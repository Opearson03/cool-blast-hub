import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeSecretKey) {
    logStep("ERROR: STRIPE_SECRET_KEY not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    
    let event: Stripe.Event;
    
    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified", { type: event.type });
      } catch (err) {
        logStep("Webhook signature verification failed", { error: String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Parse event without verification (for development)
      event = JSON.parse(body) as Stripe.Event;
      logStep("Webhook received (unverified)", { type: event.type });
    }

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription update", { 
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
        });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) {
          logStep("Customer deleted, skipping");
          break;
        }
        
        const customerEmail = customer.email;
        if (!customerEmail) {
          logStep("No customer email found");
          break;
        }
        
        // Find business by owner email
        const { data: userData } = await supabaseClient.auth.admin.listUsers();
        const user = userData.users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
        
        if (!user) {
          logStep("No user found for email", { email: customerEmail });
          break;
        }
        
        // Get business ID
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .single();
          
        if (!profile?.business_id) {
          logStep("No business found for user", { userId: user.id });
          break;
        }
        
        // Determine employee limit based on tier
        const priceId = subscription.items.data[0]?.price.id;
        let employeeLimit = 999; // Default for standard plan
        
        // Map status to our format
        let status = subscription.status;
        if (subscription.status === "trialing") {
          status = "active";
        }
        
        // Calculate period end
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Update or insert subscription record
        const { error: upsertError } = await supabaseClient
          .from("business_subscriptions")
          .upsert({
            business_id: profile.business_id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: status,
            plan_tier: "standard",
            employee_limit: employeeLimit,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: "business_id" });
          
        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError.message });
        } else {
          logStep("Subscription updated successfully", { 
            businessId: profile.business_id,
            status,
            periodEnd,
          });
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", { subscriptionId: subscription.id });
        
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
        if (invoice.subscription) {
          logStep("Payment succeeded for subscription", { 
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid,
          });
          
          // Update subscription status to active
          const { error } = await supabaseClient
            .from("business_subscriptions")
            .update({ 
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string);
            
          if (error) {
            logStep("Error updating subscription after payment", { error: error.message });
          }
        }
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          logStep("Payment failed for subscription", { subscriptionId: invoice.subscription });
          
          // Update subscription status to past_due
          const { error } = await supabaseClient
            .from("business_subscriptions")
            .update({ 
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string);
            
          if (error) {
            logStep("Error updating subscription after payment failure", { error: error.message });
          }
        }
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
