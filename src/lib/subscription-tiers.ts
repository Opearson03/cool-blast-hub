// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: 79,
    price_id: "price_1SeCx7S7UIjxyz7VnNuTR8Lg",
    product_id: "prod_TbPmlPUYfBBb3F",
    employee_limit: 5,
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
    employee_limit: 15,
    features: [
      "Everything in Starter, plus:",
      "Up to 15 employees",
      "Unlimited crews",
      "Advanced scheduling (conflict warnings)",
      "Concrete test result alerts",
      "Equipment service reminders",
      "Priority support",
      "Custom ITP & SWMS templates",
      "Business branding on PDFs",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 300,
    price_id: "price_1SeCz7S7UIjxyz7VaqZ2oUDM",
    product_id: "prod_TbPoNLzeCemzy9",
    employee_limit: 999,
    features: [
      "Everything in Professional, plus:",
      "Unlimited employees",
      "Multi-site businesses",
      "Custom workflows",
      "Custom fields",
      "Dedicated onboarding",
      "Priority feature requests",
      "Phone support",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
