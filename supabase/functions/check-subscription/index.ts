import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product IDs for each tier (2 tiers only)
const PRODUCT_IDS = {
  starter: "prod_TbPmlPUYfBBb3F",
  professional: "prod_TbPnloNedYyooY",
};

const TIER_FROM_PRODUCT: Record<string, string> = {
  "prod_TbPmlPUYfBBb3F": "starter",
  "prod_TbPnloNedYyooY": "professional",
};

const EMPLOYEE_LIMITS: Record<string, number> = {
  starter: 5,
  professional: 999,
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
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    // Use getUser with the token directly (more reliable than session-based auth)
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("Auth error occurred", { error: userError.message });
      // If token is expired/invalid, return a graceful response instead of error
      // The client-side has caching and will retry
      if (userError.message.includes("session") || userError.message.includes("expired") || userError.message.includes("invalid")) {
        return new Response(JSON.stringify({ 
          subscribed: false,
          tier: null,
          subscription_end: null,
          employee_limit: 5,
          is_exempt: false,
          token_error: true, // Signal to client that token was invalid
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 so client handles gracefully
        });
      }
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's business and check if exempt
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.business_id) {
      const { data: business } = await supabaseClient
        .from("businesses")
        .select("subscription_exempt")
        .eq("id", profile.business_id)
        .maybeSingle();

      // If business is exempt (demo account), return full access
      if (business?.subscription_exempt) {
        logStep("Business is exempt from subscription - granting full access");
        return new Response(JSON.stringify({
          subscribed: true,
          tier: "professional",
          subscription_end: null,
          employee_limit: 20,
          is_exempt: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        is_exempt: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let tier = null;
    let subscriptionEnd = null;
    let employeeLimit = 5;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      const productId = subscription.items.data[0].price.product as string;
      tier = TIER_FROM_PRODUCT[productId] || "starter";
      employeeLimit = EMPLOYEE_LIMITS[tier] || 5;
      logStep("Determined subscription tier", { productId, tier, employeeLimit });

      // Update subscription record in database
      if (profile?.business_id) {
        await supabaseClient
          .from("business_subscriptions")
          .upsert({
            business_id: profile.business_id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            plan_tier: tier,
            status: "active",
            current_period_end: subscriptionEnd,
            employee_limit: employeeLimit,
          }, { onConflict: "business_id" });
        logStep("Database subscription record updated");
      }
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      subscription_end: subscriptionEnd,
      employee_limit: employeeLimit,
      is_exempt: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
