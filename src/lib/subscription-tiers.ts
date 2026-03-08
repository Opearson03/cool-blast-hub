// Subscription tier configuration - Free, Estimating ($99/mo), Pro ($240/mo)
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    price_id: null,
    product_id: null,
    employee_limit: 999,
    monthly_estimate_limit: 2,
    has_full_app_access: false,
    description: "Get started with 2 free quotes per month.",
    features: [
      "2 quotes per month",
      "Professional PDF quotes",
      "Quote signing & approval",
    ],
  },
  estimating: {
    name: "Estimating",
    price: 99,
    price_id: "price_1SxfDWS7UIjxyz7V3CrcxMT4",
    product_id: "prod_TvWGele4WOtuLp",
    employee_limit: 999,
    monthly_estimate_limit: null, // Unlimited
    has_full_app_access: false,
    description: "Unlimited quotes for busy estimators.",
    features: [
      "Unlimited quotes",
      "Professional PDF quotes",
      "Quote signing & approval",
      "Email delivery",
      "Priority support",
    ],
  },
  pro: {
    name: "PourHub Pro",
    price: 199,
    price_id: "price_1T8YHhS7UIjxyz7VUdHtglc8",
    product_id: "prod_U6lpws80KASuHx",
    employee_limit: 999,
    monthly_estimate_limit: null, // Unlimited
    has_full_app_access: true,
    description: "Complete business management for concreting operations.",
    features: [
      "Unlimited quotes",
      "Job scheduling with conflict warnings",
      "Project Startup checklist",
      "Concrete test result tracking & alerts",
      "Photo & document uploads",
      "Job Pack PDF export",
      "Equipment register with service reminders",
      "Business branding on PDFs",
      "Priority support",
    ],
  },
  // Legacy tier mapping - old $100 subscribers get pro access
  standard: {
    name: "PourHub Pro",
    price: 100,
    price_id: "price_1Sn7u2S7UIjxyz7VMeUH1Kct",
    product_id: "prod_TkdAIRs15o1Omv",
    employee_limit: 999,
    monthly_estimate_limit: null,
    has_full_app_access: true,
    description: "Legacy plan - full access.",
    features: [
      "Unlimited quotes",
      "Full app access",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Product ID to tier mapping for edge functions
export const PRODUCT_ID_TO_TIER: Record<string, SubscriptionTier> = {
  "prod_TvWGele4WOtuLp": "estimating",
  "prod_U6lpws80KASuHx": "pro",
  "prod_TvWGfsM4uQs4od": "pro", // Legacy $240 product
  "prod_TkdAIRs15o1Omv": "standard", // Legacy
};

// Price ID to tier mapping
export const PRICE_ID_TO_TIER: Record<string, SubscriptionTier> = {
  "price_1SxfDWS7UIjxyz7V3CrcxMT4": "estimating",
  "price_1T8YHhS7UIjxyz7VUdHtglc8": "pro",
  "price_1SxfE0S7UIjxyz7Vdj3W8vBx": "pro", // Legacy $240 price
  "price_1Sn7u2S7UIjxyz7VMeUH1Kct": "standard", // Legacy
};
