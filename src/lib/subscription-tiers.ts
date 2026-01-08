// Subscription tier configuration - Single tier at $100/month
export const SUBSCRIPTION_TIERS = {
  standard: {
    name: "PourHub",
    price: 100,
    price_id: "price_1Sn7u2S7UIjxyz7VMeUH1Kct",
    product_id: "prod_TkdAIRs15o1Omv",
    employee_limit: 999,
    description: "Complete job management for concreting businesses.",
    features: [
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
