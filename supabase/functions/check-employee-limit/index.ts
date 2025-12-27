import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-EMPLOYEE-LIMIT] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's business_id
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);
    if (!profile?.business_id) throw new Error("User has no business");
    logStep("Found business", { businessId: profile.business_id });

    // Check if business is exempt
    const { data: business } = await supabaseClient
      .from("businesses")
      .select("subscription_exempt")
      .eq("id", profile.business_id)
      .maybeSingle();

    if (business?.subscription_exempt) {
      logStep("Business is exempt from subscription limits");
      return new Response(JSON.stringify({
        can_add: true,
        current_count: 0,
        limit: 999,
        is_exempt: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current employee count
    const { count: employeeCount, error: countError } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("business_id", profile.business_id);

    if (countError) throw new Error(`Count error: ${countError.message}`);
    const currentCount = employeeCount || 0;
    logStep("Current employee count", { currentCount });

    // Get subscription limit
    const { data: subscription } = await supabaseClient
      .from("business_subscriptions")
      .select("employee_limit, status, current_period_end")
      .eq("business_id", profile.business_id)
      .maybeSingle();

    const employeeLimit = subscription?.employee_limit || 5;
    const isActive = subscription?.status === "active" && 
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

    logStep("Subscription info", { employeeLimit, isActive, status: subscription?.status });

    const canAdd = isActive && currentCount < employeeLimit;

    return new Response(JSON.stringify({
      can_add: canAdd,
      current_count: currentCount,
      limit: employeeLimit,
      is_exempt: false,
      subscription_active: isActive,
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
