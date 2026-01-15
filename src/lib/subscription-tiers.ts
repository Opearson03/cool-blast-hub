// Subscription tier configuration - Free tier + Standard at $100/month
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    price_id: null,
    product_id: null,
    employee_limit: 999,
    monthly_estimate_limit: 1,
    description: "Get started with 1 free quote per month.",
    features: [
      "1 quote per month",
      "Unlimited jobs",
      "Unlimited employees",
      "Full job management",
      "ITPs & SWMS",
      "Photo uploads",
    ],
  },
  standard: {
    name: "PourHub Pro",
    price: 100,
    price_id: "price_1Sn7u2S7UIjxyz7VMeUH1Kct",
    product_id: "prod_TkdAIRs15o1Omv",
    employee_limit: 999,
    monthly_estimate_limit: null, // Unlimited
    description: "Unlimited quotes for growing businesses.",
    features: [
      "Unlimited quotes",
      "Unlimited employees",
      "Unlimited jobs",
      "Unlimited crews",
      "Job scheduling with conflict warnings",
      "Project Startup checklist",
      "ITPs & SWMS",
      "Concrete test result tracking & alerts",
      "Photo & document uploads",
      "Job Pack PDF export",
      "Equipment register with service reminders",
      "Custom ITP & SWMS templates",
      "Business branding on PDFs",
      "Priority support",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
