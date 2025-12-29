import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");

    // Service role client (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Identify the calling user (must match the invite email)
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = userData.user;
    const normalizedEmail = (user.email ?? "").toLowerCase().trim();
    if (!normalizedEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "User email is missing" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[ACCEPT-INVITE] Attempting for userId=${user.id} email=${normalizedEmail}`);

    // Find the pending invite for this email
    const { data: invite, error: inviteError } = await supabase
      .from("pending_invites")
      .select("id, full_name, role, invited_by")
      .ilike("email", normalizedEmail)
      .is("accepted_at", null)
      .maybeSingle();

    if (inviteError) {
      console.error("[ACCEPT-INVITE] Error fetching invite:", inviteError);
      throw inviteError;
    }

    if (!invite) {
      return new Response(
        JSON.stringify({ success: false, error: "No pending invitation found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Determine invited business via inviter profile
    const { data: inviterProfile, error: inviterError } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", invite.invited_by)
      .single();

    if (inviterError || !inviterProfile?.business_id) {
      console.error("[ACCEPT-INVITE] Invalid inviter profile:", inviterError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid invitation" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const invitedBusinessId = inviterProfile.business_id;

    // If the user already belongs to a different business, block (avoids cross-tenant switching)
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[ACCEPT-INVITE] Error reading profile:", profileError);
      throw profileError;
    }

    if (existingProfile?.business_id && existingProfile.business_id !== invitedBusinessId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "This email is already linked to a different business. Please use a different email address for this invite.",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Ensure profile exists and is linked to the invited business
    if (existingProfile) {
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ business_id: invitedBusinessId, full_name: invite.full_name })
        .eq("id", user.id);

      if (updateProfileError) {
        console.error("[ACCEPT-INVITE] Error updating profile:", updateProfileError);
        throw updateProfileError;
      }
    } else {
      const { error: insertProfileError } = await supabase
        .from("profiles")
        .insert({ id: user.id, full_name: invite.full_name, business_id: invitedBusinessId });

      if (insertProfileError) {
        console.error("[ACCEPT-INVITE] Error creating profile:", insertProfileError);
        throw insertProfileError;
      }
    }

    // Ensure role exists (roles remain in user_roles table)
    const { data: existingRole, error: roleReadError } = await supabase
      .from("user_roles")
      .select("id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleReadError) {
      console.error("[ACCEPT-INVITE] Error reading role:", roleReadError);
      throw roleReadError;
    }

    if (existingRole) {
      const { error: updateRoleError } = await supabase
        .from("user_roles")
        .update({ role: invite.role })
        .eq("user_id", user.id);

      if (updateRoleError) {
        console.error("[ACCEPT-INVITE] Error updating role:", updateRoleError);
        throw updateRoleError;
      }
    } else {
      const { error: insertRoleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: invite.role });

      if (insertRoleError) {
        console.error("[ACCEPT-INVITE] Error creating role:", insertRoleError);
        throw insertRoleError;
      }
    }

    // Mark invite accepted
    const { error: acceptError } = await supabase
      .from("pending_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (acceptError) {
      console.error("[ACCEPT-INVITE] Error marking invite as accepted:", acceptError);
      throw acceptError;
    }

    console.log(`[ACCEPT-INVITE] Success inviteId=${invite.id} role=${invite.role}`);

    return new Response(
      JSON.stringify({ success: true, role: invite.role, businessId: invitedBusinessId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ACCEPT-INVITE] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
