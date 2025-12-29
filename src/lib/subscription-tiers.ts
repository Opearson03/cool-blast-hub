// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: 79,
    price_id: "price_1SeCx7S7UIjxyz7VnNuTR8Lg",
    product_id: "prod_TbPmlPUYfBBb3F",
    employee_limit: 5,
    description: "Solo concreters, 1–3 person crews, small residential outfits.",
    features: [
      "1 Business",
      "Up to 5 employees",
      "Unlimited jobs",
      "Job scheduling",
      "Project Startup checklist",
      "ITPs & SWMS",
      "Concrete test result tracking",
      "Photo & document uploads",
      "Job Pack PDF export",
      "Equipment register (basic)",
    ],
  },
  professional: {
    name: "Professional",
    price: 199,
    price_id: "price_1SeCxpS7UIjxyz7V9Rudg8D7",
    product_id: "prod_TbPnloNedYyooY",
    employee_limit: 999,
    description: "Growing concreting businesses, multiple crews, builder work.",
    features: [
      "Everything in Starter, plus:",
      "Unlimited employees",
      "Unlimited crews",
      "Advanced scheduling (conflict warnings)",
      "Concrete test result alerts",
      "Equipment service reminders",
      "Priority support",
      "Custom ITP & SWMS templates",
      "Business branding on PDFs",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
