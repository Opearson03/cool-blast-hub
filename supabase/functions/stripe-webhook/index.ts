import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Product IDs for tier detection
const PRODUCT_IDS = {
  estimating: "prod_TvWGele4WOtuLp",
  pro: "prod_TvWGfsM4uQs4od",
  legacy: "prod_TkdAIRs15o1Omv", // Legacy $100 plan - treat as pro
};

function getTierFromProductId(productId: string): string {
  if (productId === PRODUCT_IDS.estimating) {
    return "estimating";
  } else if (productId === PRODUCT_IDS.pro) {
    return "pro";
  } else if (productId === PRODUCT_IDS.legacy) {
    return "pro"; // Legacy subscribers get pro access
  }
  // Unknown product - default to pro for safety
  return "pro";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header found");
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription event", { 
          subscriptionId: subscription.id, 
          customerId, 
          status: subscription.status 
        });

        // Get the customer to find their email
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          logStep("Customer was deleted, skipping");
          break;
        }

        const customerEmail = customer.email;
        if (!customerEmail) {
          logStep("No email found for customer", { customerId });
          break;
        }

        // Find the business by owner email
        const { data: businesses, error: businessError } = await supabaseClient
          .from("businesses")
          .select("id, owner_id")
          .eq("email", customerEmail);

        if (businessError) {
          logStep("Error finding business", { error: businessError.message });
          break;
        }

        // If not found by business email, try profile email via auth
        let businessId: string | null = null;
        
        if (businesses && businesses.length > 0) {
          businessId = businesses[0].id;
        } else {
          // Look up user by email from auth, then get their business
          const { data: authData } = await supabaseClient.auth.admin.listUsers();
          const user = authData?.users?.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
          
          if (user) {
            const { data: profile } = await supabaseClient
              .from("profiles")
              .select("business_id")
              .eq("id", user.id)
              .single();
            
            if (profile?.business_id) {
              businessId = profile.business_id;
            }
          }
        }

        if (!businessId) {
          logStep("No business found for customer email", { email: customerEmail });
          break;
        }

        // Get subscription tier from product
        const productId = subscription.items.data[0]?.price?.product as string;
        const planTier = getTierFromProductId(productId);
        
        logStep("Determined tier from product", { productId, planTier });
        
        // Calculate subscription end
        const subscriptionEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        // Upsert business subscription
        const { error: upsertError } = await supabaseClient
          .from("business_subscriptions")
          .upsert({
            business_id: businessId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status: subscription.status === "active" || subscription.status === "trialing" ? "active" : subscription.status,
            plan_tier: planTier,
            employee_limit: 999,
            current_period_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: "business_id" });

        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError.message });
        } else {
          logStep("Subscription updated successfully", { businessId, status: subscription.status, planTier });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Processing subscription deletion", { subscriptionId: subscription.id, customerId });

        // Update subscription status to canceled
        const { error: updateError } = await supabaseClient
          .from("business_subscriptions")
          .update({ 
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          logStep("Error updating canceled subscription", { error: updateError.message });
        } else {
          logStep("Subscription marked as canceled");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (!subscriptionId) break;
        
        logStep("Payment succeeded", { invoiceId: invoice.id, subscriptionId });

        // Update subscription status to active
        const { error: updateError } = await supabaseClient
          .from("business_subscriptions")
          .update({ 
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
          logStep("Error updating subscription after payment", { error: updateError.message });
        }

        // Generate affiliate commission if applicable
        const { data: referral } = await supabaseClient
          .from("affiliate_referrals")
          .select("id, affiliate_id, monthly_amount, commission_rate, months_remaining")
          .eq("stripe_subscription_id", subscriptionId)
          .eq("status", "active")
          .gt("months_remaining", 0)
          .single();

        if (referral) {
          const invoiceAmount = invoice.amount_paid || 0; // in cents
          const commissionAmount = Math.round(invoiceAmount * Number(referral.commission_rate));
          const monthNumber = 11 - referral.months_remaining; // 1-10

          logStep("Generating affiliate commission", {
            referralId: referral.id,
            invoiceAmount,
            commissionAmount,
            monthNumber,
          });

          // Insert commission
          const { error: commError } = await supabaseClient
            .from("affiliate_commissions")
            .insert({
              referral_id: referral.id,
              affiliate_id: referral.affiliate_id,
              amount_cents: commissionAmount,
              month_number: monthNumber,
              status: "pending",
            });

          if (commError) {
            logStep("Error creating commission", { error: commError.message });
          }

          // Decrement months remaining
          const newMonths = referral.months_remaining - 1;
          const { error: decError } = await supabaseClient
            .from("affiliate_referrals")
            .update({
              months_remaining: newMonths,
              status: newMonths <= 0 ? "completed" : "active",
            })
            .eq("id", referral.id);

          if (decError) {
            logStep("Error updating referral months", { error: decError.message });
          } else {
            logStep("Affiliate referral updated", { monthsRemaining: newMonths });
          }
        }

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email || session.customer_email;
        logStep("Checkout session completed", { sessionId: session.id, email: customerEmail });

        if (customerEmail) {
          // Mark waitlist entry as converted
          const { error: waitlistError } = await supabaseClient
            .from("waiting_list")
            .update({ 
              outreach_status: "converted",
              stripe_session_id: session.id,
            })
            .ilike("email", customerEmail);

          if (waitlistError) {
            logStep("Error updating waitlist entry on conversion", { error: waitlistError.message });
          } else {
            logStep("Waitlist entry marked as converted", { email: customerEmail });
          }
        }

        // Handle affiliate referral tracking
        const affiliateCode = (session.metadata as any)?.affiliate_code;
        if (affiliateCode && session.subscription) {
          logStep("Affiliate code found in checkout metadata", { affiliateCode, subscriptionId: session.subscription });
          
          // Find the affiliate
          const { data: affiliate, error: affError } = await supabaseClient
            .from("affiliates")
            .select("id")
            .eq("affiliate_code", affiliateCode)
            .eq("status", "approved")
            .single();
          
          if (affiliate && !affError) {
            // Get subscription details for amount
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const monthlyAmount = subscription.items.data[0]?.price?.unit_amount || 0;
            const productId = subscription.items.data[0]?.price?.product as string;
            const subTier = getTierFromProductId(productId);

            // Create referral record
            const { data: referral, error: refError } = await supabaseClient
              .from("affiliate_referrals")
              .insert({
                affiliate_id: affiliate.id,
                customer_email: customerEmail || "",
                stripe_subscription_id: session.subscription as string,
                subscription_tier: subTier,
                monthly_amount: monthlyAmount,
                commission_rate: 0.10,
                months_remaining: 10,
                status: "active",
              })
              .select("id")
              .single();

            if (refError) {
              logStep("Error creating affiliate referral", { error: refError.message });
            } else {
              logStep("Affiliate referral created", { referralId: referral?.id, affiliateId: affiliate.id });
            }
          } else {
            logStep("Affiliate not found or not approved for code", { affiliateCode });
          }
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (!subscriptionId) break;
        
        logStep("Payment failed", { invoiceId: invoice.id, subscriptionId });

        // Update subscription status to past_due
        const { error: updateError } = await supabaseClient
          .from("business_subscriptions")
          .update({ 
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
          logStep("Error updating subscription after failed payment", { error: updateError.message });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
