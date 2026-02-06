import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ESTIMATE-QUOTA] ${step}${detailsStr}`);
};

// Product IDs for tier detection
const PRODUCT_IDS = {
  estimating: "prod_TvWGele4WOtuLp",
  pro: "prod_TvWGfsM4uQs4od",
  legacy: "prod_TkdAIRs15o1Omv", // Legacy $100 plan - treat as pro
};

const FREE_TIER_LIMIT = 2;

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
    
    if (userError) {
      logStep("Auth error", { error: userError.message });
      return new Response(JSON.stringify({ 
        can_create: true, 
        tier: null,
        used: 0,
        limit: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's business
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.business_id) {
      logStep("No business found");
      return new Response(JSON.stringify({ 
        can_create: true, 
        tier: "free",
        used: 0,
        limit: FREE_TIER_LIMIT,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if business is exempt
    const { data: business } = await supabaseClient
      .from("businesses")
      .select("subscription_exempt")
      .eq("id", profile.business_id)
      .maybeSingle();

    if (business?.subscription_exempt) {
      logStep("Business is exempt - unlimited quotes");
      return new Response(JSON.stringify({
        can_create: true,
        tier: "pro",
        used: 0,
        limit: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe subscription status
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get stored customer ID
    let customerId: string | null = null;
    const { data: subscriptionRow } = await supabaseClient
      .from("business_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("business_id", profile.business_id)
      .maybeSingle();

    customerId = subscriptionRow?.stripe_customer_id ?? null;

    // Fallback to email lookup
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Check for active or trialing subscription
    let hasActiveSub = false;
    let tier = "free";
    
    if (customerId) {
      let subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length === 0) {
        subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "trialing",
          limit: 1,
        });
      }
      
      hasActiveSub = subscriptions.data.length > 0;
      
      if (hasActiveSub) {
        // Determine tier from product ID
        const productId = subscriptions.data[0].items.data[0]?.price?.product as string;
        
        if (productId === PRODUCT_IDS.estimating) {
          tier = "estimating";
        } else if (productId === PRODUCT_IDS.pro || productId === PRODUCT_IDS.legacy) {
          tier = "pro";
        } else {
          // Unknown product - default to pro for safety (legacy handling)
          tier = "pro";
        }
        
        logStep("Active subscription found", { tier, productId });
      }
    }

    // If subscribed (active or trialing), unlimited quotes
    if (hasActiveSub) {
      logStep("Paid tier - unlimited quotes", { tier });
      return new Response(JSON.stringify({
        can_create: true,
        tier: tier,
        used: 0,
        limit: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Free tier - check usage
    logStep("Free tier - checking usage");
    const currentMonthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    
    const { data: usage } = await supabaseClient
      .from("estimate_usage")
      .select("estimate_count")
      .eq("business_id", profile.business_id)
      .eq("month_year", currentMonthYear)
      .maybeSingle();

    const usedCount = usage?.estimate_count || 0;
    const canCreate = usedCount < FREE_TIER_LIMIT;

    // Calculate next month reset date
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const resetsAt = nextMonth.toISOString();

    logStep("Quota check complete", { usedCount, limit: FREE_TIER_LIMIT, canCreate });

    return new Response(JSON.stringify({
      can_create: canCreate,
      tier: "free",
      used: usedCount,
      limit: FREE_TIER_LIMIT,
      resets_at: resetsAt,
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
