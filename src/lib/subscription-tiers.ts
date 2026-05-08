// Subscription tier configuration - Free, Estimating ($99/mo), Pro ($199/mo)

// Per-seat team billing: first 2 seats free, then $5/seat/month
export const FREE_TEAM_SEATS = 2;
export const TEAM_SEAT_PRICE_CENTS = 500;
export const TEAM_SEAT_PRICE_ID = "price_1TUfFSS7UIjxyz7VonfOuRBf";
export const TEAM_SEAT_PRODUCT_ID = "prod_UTcUhHmhPAyOqh";

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    price_id: null,
    product_id: null,
    annual_price: 0,
    annual_price_id: null,
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
    annual_price: 999,
    annual_price_id: "price_1TM2ewS7UIjxyz7VFLM6Zqet",
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
    annual_price: 1999,
    annual_price_id: "price_1TM3DAS7UIjxyz7VcUHGZ5Qp",
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
    annual_price: 100,
    annual_price_id: null,
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
  "price_1TM2ewS7UIjxyz7VFLM6Zqet": "estimating", // Annual
  "price_1T8YHhS7UIjxyz7VUdHtglc8": "pro",
  "price_1TM3DAS7UIjxyz7VcUHGZ5Qp": "pro", // Annual
  "price_1SxfE0S7UIjxyz7Vdj3W8vBx": "pro", // Legacy $240 price
  "price_1Sn7u2S7UIjxyz7VMeUH1Kct": "standard", // Legacy
};
