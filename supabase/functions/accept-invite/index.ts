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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[ACCEPT-INVITE] Processing invite for: ${normalizedEmail}`);

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the pending invite
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
      console.log(`[ACCEPT-INVITE] No pending invite found for: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ success: false, error: "No pending invitation found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (userError || !user) {
      console.log(`[ACCEPT-INVITE] No user found for email: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ success: false, error: "User not found. Please sign up first." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get business_id from inviter's profile
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", invite.invited_by)
      .single();

    if (!inviterProfile?.business_id) {
      console.error("[ACCEPT-INVITE] Inviter has no business_id");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid invitation" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile to new business
      console.log(`[ACCEPT-INVITE] Updating existing profile to new business`);
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ 
          business_id: inviterProfile.business_id,
          full_name: invite.full_name 
        })
        .eq("id", user.id);

      if (updateProfileError) {
        console.error("[ACCEPT-INVITE] Error updating profile:", updateProfileError);
        throw updateProfileError;
      }
    } else {
      // Create new profile
      console.log(`[ACCEPT-INVITE] Creating new profile`);
      const { error: insertProfileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: invite.full_name,
          business_id: inviterProfile.business_id
        });

      if (insertProfileError) {
        console.error("[ACCEPT-INVITE] Error creating profile:", insertProfileError);
        throw insertProfileError;
      }
    }

    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRole) {
      // Update existing role
      console.log(`[ACCEPT-INVITE] Updating existing role to: ${invite.role}`);
      const { error: updateRoleError } = await supabase
        .from("user_roles")
        .update({ role: invite.role })
        .eq("user_id", user.id);

      if (updateRoleError) {
        console.error("[ACCEPT-INVITE] Error updating role:", updateRoleError);
        throw updateRoleError;
      }
    } else {
      // Create new role
      console.log(`[ACCEPT-INVITE] Creating new role: ${invite.role}`);
      const { error: insertRoleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: invite.role
        });

      if (insertRoleError) {
        console.error("[ACCEPT-INVITE] Error creating role:", insertRoleError);
        throw insertRoleError;
      }
    }

    // Mark invite as accepted
    const { error: acceptError } = await supabase
      .from("pending_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (acceptError) {
      console.error("[ACCEPT-INVITE] Error marking invite as accepted:", acceptError);
      throw acceptError;
    }

    console.log(`[ACCEPT-INVITE] Successfully processed invite for: ${normalizedEmail}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        role: invite.role,
        businessId: inviterProfile.business_id
      }),
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
