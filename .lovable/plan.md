

# Plan: Three-Tier Subscription System

## Overview

Restructure the subscription model from 2 tiers (Free + Standard) to 3 tiers:

| Tier | Price | Quote Limit | App Access |
|------|-------|-------------|------------|
| **Free** | $0 | 2 per month | Quotes only |
| **Estimating** | $99/month | Unlimited | Quotes only |
| **PourHub Pro** | $240/month | Unlimited | Full app |

Demo accounts (`subscription_exempt = true`) remain unchanged with full access.

## Current vs New Structure

```text
CURRENT:
┌─────────────────────────────────────────────────────────┐
│ Free ($0)          → 1 quote/month, full app access     │
│ Standard ($100)    → Unlimited quotes, full app access  │
└─────────────────────────────────────────────────────────┘

NEW:
┌─────────────────────────────────────────────────────────┐
│ Free ($0)          → 2 quotes/month, quotes page ONLY   │
│ Estimating ($99)   → Unlimited quotes, quotes page ONLY │
│ PourHub Pro ($240) → Unlimited quotes, FULL app access  │
└─────────────────────────────────────────────────────────┘
```

## Technical Changes

### 1. Create New Stripe Products & Prices

Before implementation, I'll create two new Stripe products:

| Product | Price |
|---------|-------|
| PourHub Estimating | $99/month |
| PourHub Pro | $240/month |

### 2. Update Subscription Tiers Configuration

**File: `src/lib/subscription-tiers.ts`**

```typescript
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    price_id: null,
    product_id: null,
    monthly_estimate_limit: 2,  // Changed from 1 to 2
    has_full_app_access: false, // NEW - quotes only
    description: "Get started with 2 free quotes per month.",
    features: [
      "2 quotes per month",
      "Professional PDF quotes",
      "Quote signing & approval",
    ],
  },
  estimating: {  // NEW TIER
    name: "Estimating",
    price: 99,
    price_id: "price_xxx",  // Will be set after Stripe creation
    product_id: "prod_xxx", // Will be set after Stripe creation
    monthly_estimate_limit: null, // Unlimited
    has_full_app_access: false,   // Quotes only
    description: "Unlimited quotes for busy estimators.",
    features: [
      "Unlimited quotes",
      "Professional PDF quotes",
      "Quote signing & approval",
      "Email delivery",
      "Priority support",
    ],
  },
  pro: {  // Renamed from 'standard'
    name: "PourHub Pro",
    price: 240,
    price_id: "price_xxx",  // Will be set after Stripe creation
    product_id: "prod_xxx", // Will be set after Stripe creation
    monthly_estimate_limit: null, // Unlimited
    has_full_app_access: true,    // Full app access
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
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
```

### 3. Update Access Control Logic

**File: `src/hooks/useSubscription.ts`**

Add a new `hasFullAppAccess` computed property:

```typescript
// Add to return object
const hasFullAppAccess = 
  state.isExempt ||  // Demo accounts
  (state.tier === "pro");  // Only pro tier gets full access
```

**File: `src/components/subscription/SubscriptionGate.tsx`**

Currently wraps the entire admin layout. Need to split into:
- `SubscriptionGate` - Basic authentication check (keep as-is)
- `FullAppAccessGate` - NEW - Blocks non-pro users from full app features

### 4. Create Feature Access Gate Component

**New File: `src/components/subscription/FullAppAccessGate.tsx`**

This component blocks users without full app access from accessing non-quote pages:

```typescript
export function FullAppAccessGate({ children }: { children: React.ReactNode }) {
  const { tier, isExempt } = useSubscription();
  const location = useLocation();
  
  // Allow access to quotes page for all tiers
  const isQuotesPage = location.pathname.includes("/estimates");
  const isSettingsPage = location.pathname.includes("/settings");
  
  // Pro tier and exempt users get full access
  const hasFullAccess = isExempt || tier === "pro";
  
  // Free and Estimating tiers can only access quotes + settings
  if (!hasFullAccess && !isQuotesPage && !isSettingsPage) {
    return <UpgradeToProPrompt />;
  }
  
  return <>{children}</>;
}
```

### 5. Update Admin Layout Navigation

**File: `src/components/layout/AdminLayout.tsx`**

- Add visual indicators for locked features
- Show upgrade prompt for non-pro tiers trying to access locked pages
- Grey out or badge nav items that require Pro tier

### 6. Update Edge Functions

**File: `supabase/functions/check-estimate-quota/index.ts`**

Update `FREE_TIER_LIMIT` from 1 to 2:

```typescript
const FREE_TIER_LIMIT = 2;
```

Add tier detection based on product ID:

```typescript
const PRODUCT_IDS = {
  estimating: "prod_xxx",
  pro: "prod_xxx",
};

// Determine tier from subscription
const productId = subscription.items.data[0]?.price?.product;
let tier = "free";
if (productId === PRODUCT_IDS.estimating) tier = "estimating";
if (productId === PRODUCT_IDS.pro) tier = "pro";
```

**File: `supabase/functions/check-subscription/index.ts`**

Update tier determination logic:

```typescript
const PRODUCT_IDS = {
  estimating: "prod_xxx",
  pro: "prod_xxx",
};

// Determine tier
let tier = "free";
if (hasActiveSub) {
  const productId = subscription.items.data[0]?.price?.product;
  if (productId === PRODUCT_IDS.estimating) tier = "estimating";
  else if (productId === PRODUCT_IDS.pro) tier = "pro";
  else tier = "pro"; // Fallback for legacy subscriptions
}
```

**File: `supabase/functions/stripe-webhook/index.ts`**

Update tier detection from product:

```typescript
const PRODUCT_IDS = {
  estimating: "prod_xxx",
  pro: "prod_xxx",
};

// Determine tier based on product
let planTier = "free";
if (productId === PRODUCT_IDS.estimating) planTier = "estimating";
else if (productId === PRODUCT_IDS.pro) planTier = "pro";
else planTier = "pro"; // Legacy fallback
```

**File: `supabase/functions/create-checkout/index.ts`**

Update to accept tier selection and use correct price:

```typescript
const PRICE_IDS = {
  estimating: "price_xxx",
  pro: "price_xxx",
};

// Get tier from request body
const { tier = "pro" } = body;
const priceId = PRICE_IDS[tier] || PRICE_IDS.pro;
```

### 7. Update Pricing Page

**File: `src/pages/Pricing.tsx`**

Display all three tiers with clear feature comparison:
- Free: 2 quotes/month, quotes page only
- Estimating ($99): Unlimited quotes, quotes page only  
- PourHub Pro ($240): Full app access

### 8. Update Estimate Quota Dialog

**File: `src/components/estimates/EstimateQuotaDialog.tsx`**

Show both upgrade options:
- Estimating ($99) for unlimited quotes
- PourHub Pro ($240) for full app access

### 9. Database Updates

**Migration: Update `business_subscriptions.plan_tier` type**

The existing `plan_tier` column accepts text values. We need to ensure edge functions write the correct tier names ('free', 'estimating', 'pro').

No schema change required - just ensure consistent tier naming.

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/subscription-tiers.ts` | Add 3 tiers with `has_full_app_access` flag |
| `src/hooks/useSubscription.ts` | Add `hasFullAppAccess` property |
| `src/components/subscription/SubscriptionGate.tsx` | Keep basic auth check |
| `src/components/subscription/FullAppAccessGate.tsx` | NEW - Block non-pro from full app |
| `src/components/layout/AdminLayout.tsx` | Add feature gating + nav indicators |
| `supabase/functions/check-estimate-quota/index.ts` | Update limit to 2, add tier detection |
| `supabase/functions/check-subscription/index.ts` | Add multi-tier detection |
| `supabase/functions/stripe-webhook/index.ts` | Add multi-tier detection |
| `supabase/functions/create-checkout/index.ts` | Support tier selection in checkout |
| `src/pages/Pricing.tsx` | Show 3-tier comparison |
| `src/components/estimates/EstimateQuotaDialog.tsx` | Show both upgrade options |
| `src/hooks/useEstimateQuota.ts` | Update for new tier names |

---

## Stripe Products to Create

| Product Name | Price | Interval |
|--------------|-------|----------|
| PourHub Estimating | $99 | monthly |
| PourHub Pro | $240 | monthly |

---

## Legacy Subscription Handling

Existing subscribers on the old $100/month plan will be treated as "pro" tier (full app access) to maintain their current feature set. This is handled by the fallback logic in tier detection.

---

## User Experience Flow

### Free Tier User
1. Can access `/admin/estimates` freely
2. Can create up to 2 quotes per month
3. Clicking on Jobs, Schedule, Dashboard shows upgrade prompt
4. Settings page accessible for branding setup

### Estimating Tier User  
1. Full access to `/admin/estimates`
2. Unlimited quote creation
3. Clicking on Jobs, Schedule, Dashboard shows upgrade prompt
4. Settings page accessible

### Pro Tier User
1. Full access to all pages
2. Unlimited everything
3. All features unlocked

### Demo Account (Exempt)
1. Full access to everything (unchanged)

