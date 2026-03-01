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

// Price IDs for each tier
const PRICE_IDS = {
  estimating: "price_1SxfDWS7UIjxyz7V3CrcxMT4", // $99/month
  pro: "price_1SxfE0S7UIjxyz7Vdj3W8vBx",        // $240/month
  legacy: "price_1Sn7u2S7UIjxyz7VMeUH1Kct",     // $100/month (legacy)
};

// Affiliate discount coupon (50% off for 2 months)
const AFFILIATE_COUPON_ID = "QD21rPWf";

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
    const { email, fullName, businessName, upgrade, tier = "pro", affiliateCode } = body;
    logStep("Request data received", { email, businessName, upgrade, tier, affiliateCode });

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
      logStep("Upgrade flow - user authenticated", { email: userEmail, targetTier: tier });

      // Determine price ID based on requested tier
      const priceId = tier === "estimating" ? PRICE_IDS.estimating : PRICE_IDS.pro;
      logStep("Using price ID for tier", { tier, priceId });

      // Find or create customer
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found for upgrade", { customerId });
      }

      // Create checkout session for upgrade (no trial for upgrades)
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/admin?upgraded=true`,
        cancel_url: `${req.headers.get("origin")}/admin/estimates`,
        payment_method_collection: "always",
      });

      logStep("Upgrade checkout session created", { sessionId: session.id, tier });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Original signup flow - default to pro tier with trial
    if (!email || !fullName || !businessName) {
      throw new Error("Missing required fields: email, fullName, businessName");
    }

    // Check if customer already exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Determine price ID for signup (default to pro for new signups)
    const signupTier = tier || "pro";
    const priceId = signupTier === "estimating" ? PRICE_IDS.estimating : PRICE_IDS.pro;
    
    logStep("Creating checkout for new signup", { tier: signupTier, priceId });

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
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/signup?cancelled=true`,
      payment_method_collection: "always",
      subscription_data: {
        metadata: {
          full_name: fullName,
          business_name: businessName,
          tier: signupTier,
          ...(validAffiliateCode ? { affiliate_code: validAffiliateCode } : {}),
        },
      },
      metadata: {
        full_name: fullName,
        business_name: businessName,
        tier: signupTier,
        ...(validAffiliateCode ? { affiliate_code: validAffiliateCode } : {}),
      },
    };

    // Apply affiliate coupon if valid code
    if (validAffiliateCode) {
      sessionParams.discounts = [{ coupon: AFFILIATE_COUPON_ID }];
      // Can't use discounts with trial, so remove trial for affiliate signups
      // Instead give them 50% off first 2 months - better value proposition
      delete sessionParams.subscription_data.trial_period_days;
      logStep("Affiliate coupon applied, trial removed in favor of 50% discount");
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url, tier: signupTier, affiliate: validAffiliateCode });

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
