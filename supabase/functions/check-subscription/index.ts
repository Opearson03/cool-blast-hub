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

// Single tier product ID
const PRODUCT_ID = "prod_TkdAIRs15o1Omv";
const EMPLOYEE_LIMIT = 999;

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
          employee_limit: EMPLOYEE_LIMIT,
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
          tier: "standard",
          subscription_end: null,
          employee_limit: EMPLOYEE_LIMIT,
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

    // Prefer stored Stripe IDs (avoids email case-sensitivity issues)
    let customerId: string | null = null;
    let storedSubscriptionId: string | null = null;

    if (profile?.business_id) {
      const { data: subscriptionRow } = await supabaseClient
        .from("business_subscriptions")
        .select("stripe_customer_id, stripe_subscription_id")
        .eq("business_id", profile.business_id)
        .maybeSingle();

      customerId = subscriptionRow?.stripe_customer_id ?? null;
      storedSubscriptionId = subscriptionRow?.stripe_subscription_id ?? null;

      if (customerId) {
        logStep("Using stored Stripe customer", { customerId });
      } else if (storedSubscriptionId) {
        logStep("Stored Stripe subscription found (customer unknown)", { subscriptionId: storedSubscriptionId });
      }
    }

    // If we have a subscription id, we can resolve the customer even if email search fails
    if (!customerId && storedSubscriptionId) {
      try {
        const sub: any = await stripe.subscriptions.retrieve(storedSubscriptionId);
        const customer = sub?.customer;
        const resolvedCustomerId = typeof customer === "string" ? customer : customer?.id;
        if (resolvedCustomerId) {
          customerId = resolvedCustomerId;
          logStep("Resolved customer from stored subscription", { customerId });
        }
      } catch (e) {
        logStep("Failed to retrieve stored subscription", {
          subscriptionId: storedSubscriptionId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // Fallback to Stripe lookup by email
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });

      if (customers.data.length === 0) {
        logStep("No customer found, returning unsubscribed state", { email: user.email });
        return new Response(
          JSON.stringify({
            subscribed: false,
            is_exempt: false,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });
    }

    // Check for active OR trialing subscriptions (trial periods have status "trialing")
    let subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    // If no active subscription, check for trialing (free trial period)
    if (subscriptions.data.length === 0) {
      subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
    }
    const hasActiveSub = subscriptions.data.length > 0;
    let tier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      
      // Safely handle the period end date (could be trial_end for trialing subscriptions)
      const periodEnd = subscription.current_period_end || subscription.trial_end;
      if (periodEnd && typeof periodEnd === 'number') {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      }
      logStep("Subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        endDate: subscriptionEnd,
        trialEnd: subscription.trial_end,
        currentPeriodEnd: subscription.current_period_end,
      });
      
      tier = "standard";
      logStep("Determined subscription tier", { tier, employeeLimit: EMPLOYEE_LIMIT });

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
            employee_limit: EMPLOYEE_LIMIT,
          }, { onConflict: "business_id" });
        logStep("Database subscription record updated");
      }
    } else {
      logStep("No active subscription found");
    }

    // If no active subscription, return as free tier (still has access, just limited quotes)
    const effectiveTier = hasActiveSub ? tier : "free";
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier: effectiveTier,
      subscription_end: subscriptionEnd,
      employee_limit: EMPLOYEE_LIMIT,
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
