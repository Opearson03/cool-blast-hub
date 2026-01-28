import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Hash token with SHA-256
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const handler = async (req: Request): Promise<Response> => {
  console.log("validate-subtrade-token: Received request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash incoming token
    const tokenHash = await hashToken(token);
    console.log("Looking up invite by token hash");

    // First try to find a batch of invites (check batch_token_hash)
    const { data: batchInvites, error: batchError } = await supabase
      .from("external_invites")
      .select(`
        id,
        status,
        role,
        recipient_name,
        notes,
        token_expires_at,
        responded_at,
        viewed_at,
        job_pour_id,
        batch_id,
        job_pours (
          id,
          pour_name,
          pour_date,
          scheduled_time,
          job_id,
          jobs (
            id,
            name,
            site_address,
            business_id,
            businesses (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .eq("batch_token_hash", tokenHash)
      .order("job_pours(pour_date)", { ascending: true });

    // If we found batch invites, handle as batch
    if (!batchError && batchInvites && batchInvites.length > 0) {
      console.log(`Found batch with ${batchInvites.length} invites`);

      // Check expiration on first invite (they all share the same expiry)
      const firstInvite = batchInvites[0];
      if (new Date(firstInvite.token_expires_at) < new Date()) {
        console.log("Token expired");
        return new Response(JSON.stringify({ error: "This invite link has expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if all are revoked
      const allRevoked = batchInvites.every(inv => inv.status === "revoked");
      if (allRevoked) {
        console.log("All invites revoked");
        return new Response(JSON.stringify({ error: "This invite has been cancelled" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if all have been responded to
      const allResponded = batchInvites.every(inv => inv.status === "accepted" || inv.status === "declined");
      if (allResponded) {
        console.log("All invites already responded");
        return new Response(
          JSON.stringify({
            error: "You have already responded to all invites",
            already_responded: true,
            all_responded: true,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark all as viewed if first access
      const unviewedIds = batchInvites.filter(inv => !inv.viewed_at).map(inv => inv.id);
      if (unviewedIds.length > 0) {
        await supabase
          .from("external_invites")
          .update({ viewed_at: new Date().toISOString(), status: "viewed" })
          .in("id", unviewedIds)
          .in("status", ["drafted", "sent"]); // Only update if not already responded

        // Log audit events
        for (const inviteId of unviewedIds) {
          await supabase.from("external_invite_events").insert({
            external_invite_id: inviteId,
            event_type: "viewed",
            metadata: { batch: true },
          });
        }
        console.log(`Marked ${unviewedIds.length} invites as viewed`);
      }

      const firstPour = firstInvite.job_pours as any;
      const job = firstPour?.jobs as any;
      const business = job?.businesses as any;

      // Build array of invites for response
      const invitesResponse = batchInvites.map(invite => {
        const pour = invite.job_pours as any;
        const inviteJob = pour?.jobs as any;
        return {
          invite_id: invite.id,
          pour_name: pour?.pour_name || "Pour",
          pour_date: pour?.pour_date || null,
          scheduled_time: pour?.scheduled_time || null,
          site_address: inviteJob?.site_address || "",
          job_name: inviteJob?.name || "",
          status: invite.status,
          already_responded: invite.status === "accepted" || invite.status === "declined",
        };
      });

      const response = {
        valid: true,
        is_batch: true,
        batch_id: firstInvite.batch_id,
        role: firstInvite.role,
        notes: firstInvite.notes || null,
        business_name: business?.name || "",
        business_logo: business?.logo_url || null,
        recipient_name: firstInvite.recipient_name,
        invites: invitesResponse,
      };

      console.log("Batch token validated successfully");
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fall back to single invite lookup (token_hash)
    const { data: invite, error: inviteError } = await supabase
      .from("external_invites")
      .select(`
        id,
        status,
        role,
        recipient_name,
        notes,
        token_expires_at,
        responded_at,
        viewed_at,
        job_pour_id,
        job_pours (
          id,
          pour_name,
          pour_date,
          scheduled_time,
          job_id,
          jobs (
            id,
            name,
            site_address,
            business_id,
            businesses (
              id,
              name,
              logo_url
            )
          )
        )
      `)
      .eq("token_hash", tokenHash)
      .single();

    if (inviteError || !invite) {
      console.error("Invite not found:", inviteError);
      return new Response(JSON.stringify({ error: "Invalid or expired invite link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    if (new Date(invite.token_expires_at) < new Date()) {
      console.log("Token expired");
      return new Response(JSON.stringify({ error: "This invite link has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if revoked
    if (invite.status === "revoked") {
      console.log("Invite revoked");
      return new Response(JSON.stringify({ error: "This invite has been cancelled" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already responded
    if (invite.status === "accepted" || invite.status === "declined") {
      console.log("Already responded:", invite.status);
      return new Response(
        JSON.stringify({
          error: `You have already ${invite.status} this invite`,
          already_responded: true,
          response: invite.status,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as viewed if first access
    if (!invite.viewed_at) {
      await supabase
        .from("external_invites")
        .update({ viewed_at: new Date().toISOString(), status: "viewed" })
        .eq("id", invite.id);

      // Log audit event
      await supabase.from("external_invite_events").insert({
        external_invite_id: invite.id,
        event_type: "viewed",
        metadata: {},
      });

      console.log("Marked invite as viewed");
    }

    const pour = invite.job_pours as any;
    const job = pour?.jobs as any;
    const business = job?.businesses as any;

    // Return single invite format (backwards compatible)
    const response = {
      valid: true,
      is_batch: false,
      pour_name: pour?.pour_name || "Pour",
      pour_date: pour?.pour_date || null,
      scheduled_time: pour?.scheduled_time || null,
      site_address: job?.site_address || "",
      job_name: job?.name || "",
      role: invite.role,
      notes: invite.notes || null,
      business_name: business?.name || "",
      business_logo: business?.logo_url || null,
      recipient_name: invite.recipient_name,
    };

    console.log("Token validated successfully");

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
