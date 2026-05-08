import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncSeatQuantity } from "../_shared/seat-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the requesting user is an admin
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only admins can delete employees" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { employeeId, type } = await req.json();

    if (!employeeId || !type) {
      return new Response(JSON.stringify({ error: "Missing employeeId or type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "invite") {
      // Delete pending invite
      const { error: deleteError } = await supabaseAdmin
        .from("pending_invites")
        .delete()
        .eq("id", employeeId);

      if (deleteError) {
        console.error("Error deleting invite:", deleteError);
        throw deleteError;
      }

      console.log("Successfully deleted pending invite:", employeeId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "employee") {
      // Get the employee's business_id to verify same business
      const { data: employeeProfile } = await supabaseAdmin
        .from("profiles")
        .select("business_id")
        .eq("id", employeeId)
        .single();

      const { data: adminProfile } = await supabaseAdmin
        .from("profiles")
        .select("business_id")
        .eq("id", requestingUser.id)
        .single();

      if (!employeeProfile || !adminProfile || employeeProfile.business_id !== adminProfile.business_id) {
        return new Response(JSON.stringify({ error: "Cannot delete employees from other businesses" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent admin from deleting themselves
      if (employeeId === requestingUser.id) {
        return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete related data first (order matters due to foreign keys)
      // pour_employees
      await supabaseAdmin.from("pour_employees").delete().eq("employee_id", employeeId);
      // employee_tickets
      await supabaseAdmin.from("employee_tickets").delete().eq("employee_id", employeeId);
      // crew_members
      await supabaseAdmin.from("crew_members").delete().eq("employee_id", employeeId);
      // timesheets
      await supabaseAdmin.from("timesheets").delete().eq("employee_id", employeeId);
      // leave_requests
      await supabaseAdmin.from("leave_requests").delete().eq("employee_id", employeeId);
      // swms_signoffs
      await supabaseAdmin.from("swms_signoffs").delete().eq("employee_id", employeeId);
      // feed_posts
      await supabaseAdmin.from("feed_posts").delete().eq("author_id", employeeId);
      // push_tokens
      await supabaseAdmin.from("push_tokens").delete().eq("user_id", employeeId);
      // user_roles
      await supabaseAdmin.from("user_roles").delete().eq("user_id", employeeId);
      // profiles
      await supabaseAdmin.from("profiles").delete().eq("id", employeeId);

      // Finally delete the auth user
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(employeeId);

      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError);
        throw deleteAuthError;
      }

      console.log("Successfully deleted employee:", employeeId);

      // Sync per-seat Stripe billing (decrement at next cycle)
      try {
        await syncSeatQuantity(supabaseAdmin, adminProfile.business_id);
      } catch (err) {
        console.error("seat sync failed (non-fatal)", err);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in delete-employee function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
