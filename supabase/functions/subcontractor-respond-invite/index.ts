import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invite_id, response } = await req.json();

    if (!invite_id || !["accepted", "declined"].includes(response)) {
      return new Response(
        JSON.stringify({ error: "invite_id and response (accepted/declined) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify this invite belongs to the authenticated subcontractor (by email/phone)
    const { data: profile } = await supabaseAdmin
      .from("subcontractor_directory_profiles")
      .select("email, phone")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Subcontractor profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the invite and verify ownership
    const { data: invite, error: invError } = await supabaseAdmin
      .from("external_invites")
      .select("id, recipient_email, recipient_phone, status")
      .eq("id", invite_id)
      .single();

    if (invError || !invite) {
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check the invite matches the subcontractor
    const emailMatch = profile.email && invite.recipient_email && profile.email.toLowerCase() === invite.recipient_email.toLowerCase();
    const phoneMatch = profile.phone && invite.recipient_phone && profile.phone === invite.recipient_phone;

    if (!emailMatch && !phoneMatch) {
      return new Response(JSON.stringify({ error: "This invite does not belong to you" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the invite status
    const { error: updateError } = await supabaseAdmin
      .from("external_invites")
      .update({
        status: response,
        responded_at: new Date().toISOString(),
      })
      .eq("id", invite_id);

    if (updateError) {
      console.error("Error updating invite:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-add subcontractor to business contacts on accept
    if (response === "accepted") {
      try {
        // Get the invite's business_id
        const { data: fullInvite } = await supabaseAdmin
          .from("external_invites")
          .select("business_id, recipient_name, recipient_email, recipient_phone, role")
          .eq("id", invite_id)
          .single();

        if (fullInvite) {
          const { data: existing } = await supabaseAdmin
            .from("subcontractors")
            .select("id")
            .eq("business_id", fullInvite.business_id)
            .ilike("name", fullInvite.recipient_name)
            .maybeSingle();

          if (!existing) {
            await supabaseAdmin.from("subcontractors").insert({
              business_id: fullInvite.business_id,
              name: fullInvite.recipient_name,
              email: fullInvite.recipient_email || null,
              phone: fullInvite.recipient_phone || null,
              trade: fullInvite.role || null,
            });
            console.log("Auto-added subcontractor to contacts (dashboard)");
          }
        }
      } catch (err) {
        console.error("Error auto-adding subcontractor contact:", err);
      }
    }

    // Log the event
    await supabaseAdmin.from("external_invite_events").insert({
      external_invite_id: invite_id,
      event_type: response === "accepted" ? "accepted_via_portal" : "declined_via_portal",
      metadata: { user_id: user.id },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
