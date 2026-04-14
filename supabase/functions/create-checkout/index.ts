import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Price IDs for each tier and interval
const PRICE_IDS: Record<string, Record<string, string>> = {
  estimating: {
    monthly: "price_1SxfDWS7UIjxyz7V3CrcxMT4",
    annual: "price_1TM2ewS7UIjxyz7VFLM6Zqet",
  },
  pro: {
    monthly: "price_1T8YHhS7UIjxyz7VUdHtglc8",
    annual: "price_1TM3DAS7UIjxyz7VcUHGZ5Qp",
  },
  legacy: {
    monthly: "price_1Sn7u2S7UIjxyz7VMeUH1Kct",
    annual: "price_1Sn7u2S7UIjxyz7VMeUH1Kct",
  },
};

// Affiliate discount coupon (50% off for 2 months)
const AFFILIATE_COUPON_ID = "QD21rPWf";

function getPriceId(tier: string, interval: string): string {
  const tierPrices = PRICE_IDS[tier] || PRICE_IDS.pro;
  return tierPrices[interval] || tierPrices.monthly;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const body = await req.json();
    const { email, fullName, businessName, upgrade, tier = "pro", interval = "monthly", affiliateCode, freeMonths } = body;
    logStep("Request data received", { email, businessName, upgrade, tier, interval, affiliateCode, freeMonths });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Handle upgrade flow for existing authenticated users
    if (upgrade) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header for upgrade");

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError || !userData.user?.email) {
        throw new Error("Not authenticated for upgrade");
      }

      const userEmail = userData.user.email;
      const priceId = getPriceId(tier, interval);
      logStep("Upgrade flow", { email: userEmail, tier, interval, priceId });

      // Find or create customer
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found for upgrade", { customerId });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/admin?upgraded=true`,
        cancel_url: `${req.headers.get("origin")}/admin/estimates`,
        payment_method_collection: "always",
      });

      logStep("Upgrade checkout session created", { sessionId: session.id, tier, interval });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Original signup flow
    if (!email || !fullName || !businessName) {
      throw new Error("Missing required fields: email, fullName, businessName");
    }

    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const signupTier = tier || "pro";
    const priceId = getPriceId(signupTier, interval);
    logStep("Creating checkout for new signup", { tier: signupTier, interval, priceId });

    // Validate affiliate code if provided
    let validAffiliateCode: string | null = null;
    if (affiliateCode) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      
      const { data: affiliate } = await supabaseClient
        .from("affiliates")
        .select("id, affiliate_code, status")
        .eq("affiliate_code", affiliateCode)
        .eq("status", "approved")
        .single();
      
      if (affiliate) {
        validAffiliateCode = affiliate.affiliate_code;
        logStep("Valid affiliate code found", { affiliateCode: validAffiliateCode });
      } else {
        logStep("Invalid or unapproved affiliate code, ignoring", { affiliateCode });
      }
    }

    // Build checkout session options
    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/signup?cancelled=true`,
      payment_method_collection: "always",
      subscription_data: {
        metadata: {
          full_name: fullName,
          business_name: businessName,
          tier: signupTier,
          interval,
          ...(validAffiliateCode ? { affiliate_code: validAffiliateCode } : {}),
        },
      },
      metadata: {
        full_name: fullName,
        business_name: businessName,
        tier: signupTier,
        interval,
        ...(validAffiliateCode ? { affiliate_code: validAffiliateCode } : {}),
      },
    };

    // Apply free months trial if provided (waitlist onboarding) - only for monthly
    if (freeMonths && Number(freeMonths) > 0 && !validAffiliateCode && interval === "monthly") {
      const trialDays = 30 * Number(freeMonths);
      sessionParams.subscription_data.trial_period_days = trialDays;
      logStep("Free months trial applied", { freeMonths, trialDays });
    }

    // Apply affiliate coupon if valid code
    if (validAffiliateCode) {
      sessionParams.discounts = [{ coupon: AFFILIATE_COUPON_ID }];
      delete sessionParams.subscription_data.trial_period_days;
      logStep("Affiliate coupon applied, trial removed in favor of 50% discount");
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url, tier: signupTier, interval, affiliate: validAffiliateCode });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
