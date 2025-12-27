import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-DEMO-PASSWORDS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify caller is admin (simple check - in production use proper auth)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email?.endsWith("@pourhub.com.au")) {
      throw new Error("Unauthorized - only PourHub admins can run this");
    }

    // List all users with pourhub.com.au emails
    const { data: users, error: listError } = await supabaseClient.auth.admin.listUsers();
    if (listError) throw new Error(`List users error: ${listError.message}`);

    const pourhubUsers = users.users.filter(u => 
      u.email?.endsWith("@pourhub.com.au")
    );
    
    logStep("Found PourHub users", { count: pourhubUsers.length });

    const updatedUsers: string[] = [];
    const errors: string[] = [];

    for (const pourhubUser of pourhubUsers) {
      try {
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
          pourhubUser.id,
          { password: "Example123" }
        );
        
        if (updateError) {
          errors.push(`${pourhubUser.email}: ${updateError.message}`);
        } else {
          updatedUsers.push(pourhubUser.email || pourhubUser.id);
          logStep("Updated password", { email: pourhubUser.email });
        }
      } catch (e) {
        errors.push(`${pourhubUser.email}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Also mark the businesses as exempt via direct update
    for (const pourhubUser of pourhubUsers) {
      await supabaseClient
        .from("businesses")
        .update({ subscription_exempt: true })
        .eq("owner_id", pourhubUser.id);
    }
    logStep("Marked businesses as exempt");

    return new Response(JSON.stringify({
      success: true,
      updated_count: updatedUsers.length,
      updated_users: updatedUsers,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
