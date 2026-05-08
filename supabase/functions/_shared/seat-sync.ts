// Shared helper to sync the per-seat Stripe subscription item for a business.
// First 2 employees are free; quantity = max(0, employees - 2) at $5 AUD/seat/month.
import Stripe from "https://esm.sh/stripe@18.5.0";

export const TEAM_SEAT_PRICE_ID = "price_1TUfFSS7UIjxyz7VonfOuRBf";
export const TEAM_SEAT_PRICE_CENTS = 500;
export const FREE_TEAM_SEATS = 2;

type AdminClient = {
  from: (t: string) => any;
};

export interface SeatSyncResult {
  employeeCount: number;
  paidSeats: number;
  monthlyExtraCents: number;
  skipped?: string;
}

export async function syncSeatQuantity(
  admin: AdminClient,
  businessId: string,
  opts: { previousCount?: number } = {},
): Promise<SeatSyncResult> {
  // Count employees
  const { count: empCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  const employeeCount = empCount ?? 0;
  const paidSeats = Math.max(0, employeeCount - FREE_TEAM_SEATS);
  const monthlyExtraCents = paidSeats * TEAM_SEAT_PRICE_CENTS;

  // Skip exempt businesses
  const { data: biz } = await admin
    .from("businesses")
    .select("subscription_exempt")
    .eq("id", businessId)
    .maybeSingle();

  if (biz?.subscription_exempt) {
    return { employeeCount, paidSeats, monthlyExtraCents, skipped: "exempt" };
  }

  const { data: sub } = await admin
    .from("business_subscriptions")
    .select("stripe_subscription_id, status")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!sub?.stripe_subscription_id) {
    return { employeeCount, paidSeats, monthlyExtraCents, skipped: "no_subscription" };
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return { employeeCount, paidSeats, monthlyExtraCents, skipped: "no_stripe_key" };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
  } catch (err) {
    console.error("[seat-sync] failed to load subscription", err);
    return { employeeCount, paidSeats, monthlyExtraCents, skipped: "stripe_load_failed" };
  }

  const seatItem = subscription.items.data.find(
    (it) => it.price.id === TEAM_SEAT_PRICE_ID,
  );

  // Decide proration direction based on previous count if provided, else item quantity
  const prevQty = opts.previousCount !== undefined
    ? Math.max(0, opts.previousCount - FREE_TEAM_SEATS)
    : (seatItem?.quantity ?? 0);
  const isIncrease = paidSeats > prevQty;

  try {
    if (paidSeats === 0) {
      if (seatItem) {
        await stripe.subscriptionItems.del(seatItem.id, {
          proration_behavior: "none",
        });
      }
    } else if (!seatItem) {
      await stripe.subscriptionItems.create({
        subscription: subscription.id,
        price: TEAM_SEAT_PRICE_ID,
        quantity: paidSeats,
        proration_behavior: isIncrease ? "create_prorations" : "none",
      });
    } else if (seatItem.quantity !== paidSeats) {
      await stripe.subscriptionItems.update(seatItem.id, {
        quantity: paidSeats,
        proration_behavior: isIncrease ? "create_prorations" : "none",
      });
    }
  } catch (err) {
    console.error("[seat-sync] stripe update failed", err);
    return { employeeCount, paidSeats, monthlyExtraCents, skipped: "stripe_update_failed" };
  }

  return { employeeCount, paidSeats, monthlyExtraCents };
}
