import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Session ID received", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session with expanded data
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    logStep("Session retrieved", { 
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
    });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Extract metadata
    const metadata = session.metadata || {};
    const customer = session.customer as Stripe.Customer | null;
    
    return new Response(JSON.stringify({
      success: true,
      email: session.customer_email || customer?.email,
      plan: metadata.plan || 'starter',
      fullName: metadata.full_name || '',
      businessName: metadata.business_name || '',
      customerId: typeof session.customer === 'string' ? session.customer : customer?.id,
      subscriptionId: typeof session.subscription === 'string' 
        ? session.subscription 
        : (session.subscription as Stripe.Subscription | null)?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
