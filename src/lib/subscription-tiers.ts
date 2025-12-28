// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: 99,
    price_id: "price_1SeCx7S7UIjxyz7VnNuTR8Lg",
    product_id: "prod_TbPmlPUYfBBb3F",
    employee_limit: 5,
    features: [
      "Up to 5 users",
      "Job scheduling",
      "Basic ITPs",
      "Email support",
    ],
  },
  professional: {
    name: "Professional",
    price: 199,
    price_id: "price_1SeCxpS7UIjxyz7V9Rudg8D7",
    product_id: "prod_TbPnloNedYyooY",
    employee_limit: 20,
    features: [
      "Up to 20 users",
      "Full ITP & SWMS",
      "Equipment register",
      "Crew timesheets",
      "Priority support",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
