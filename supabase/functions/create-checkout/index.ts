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

// Single tier price ID
const PRICE_ID = "price_1Sn7u2S7UIjxyz7VMeUH1Kct";

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
    const { email, fullName, businessName, upgrade } = body;
    logStep("Request data received", { email, businessName, upgrade });

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
      logStep("Upgrade flow - user authenticated", { email: userEmail });

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
            price: PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/admin?upgraded=true`,
        cancel_url: `${req.headers.get("origin")}/admin/estimates`,
        payment_method_collection: "always",
      });

      logStep("Upgrade checkout session created", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Original signup flow
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

    // Create checkout session with 30-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/signup?cancelled=true`,
      payment_method_collection: "always",
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          full_name: fullName,
          business_name: businessName,
        },
      },
      metadata: {
        full_name: fullName,
        business_name: businessName,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

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
