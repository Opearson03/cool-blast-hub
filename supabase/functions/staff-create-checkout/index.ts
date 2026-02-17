import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Validate staff JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Verify the caller is pourhub staff using the service role client
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: isStaff } = await serviceClient.rpc("is_pourhub_staff", {
      _user_id: userId,
    });

    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Access denied: pourhub_staff role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, businessName, tier, referralCount } = await req.json();

    if (!email || !tier) {
      return new Response(JSON.stringify({ error: "email and tier are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-08-27.basil",
    });

    // Price IDs from subscription-tiers config
    const priceIdMap: Record<string, string> = {
      estimating: "price_1SxfDWS7UIjxyz7V3CrcxMT4",
      pro: "price_1SxfE0S7UIjxyz7Vdj3W8vBx",
    };

    const priceId = priceIdMap[tier];
    if (!priceId) {
      return new Response(JSON.stringify({ error: `Invalid tier: ${tier}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Free months: 1 base + 1 per referral
    const freeMonths = 1 + (referralCount ?? 0);
    const trialDays = 30 * freeMonths;

    // Check if Stripe customer already exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Pre-create the customer with name info for better Stripe records
      const newCustomer = await stripe.customers.create({
        email,
        name: fullName || undefined,
        metadata: {
          business_name: businessName || "",
          onboarded_by_staff: "true",
        },
      });
      customerId = newCustomer.id;
    }

    const origin = Deno.env.get("APP_URL") || "https://cool-blast-hub.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          full_name: fullName || "",
          business_name: businessName || "",
          tier,
          onboarded_by_staff: "true",
        },
      },
      customer_update: {
        name: "auto",
      },
      success_url: `${origin}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        full_name: fullName || "",
        business_name: businessName || "",
        tier,
        onboarded_by_staff: "true",
      },
    });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        trialDays,
        freeMonths,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[staff-create-checkout] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
