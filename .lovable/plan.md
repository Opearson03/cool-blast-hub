

# Add Annual Plan Options

## Overview
Add yearly billing options: **$999/year for Estimating** and **$1,999/year for Pro** (saving ~$189/yr and ~$389/yr respectively). Users choose monthly or annual at checkout.

## Step 1: Create Stripe Prices
Create two new recurring yearly prices on the existing products:
- `prod_TvWGele4WOtuLp` (Estimating) → $999/year
- `prod_U6lpws80KASuHx` (Pro) → $1,999/year

## Step 2: Update `subscription-tiers.ts`
Add annual price IDs and annual prices to each tier config so the UI can reference them.

## Step 3: Update Pricing Page
Add a monthly/annual toggle at the top. When annual is selected, show the annual price with a "Save $X" badge on each card. The "Get Started" links pass `&interval=annual` to the signup page.

## Step 4: Update Signup Page
Read the `interval` URL param. Show "monthly" or "annual" pricing in the plan summary card. Pass `interval` to the `create-checkout` function.

## Step 5: Update `create-checkout` Edge Function
Accept an `interval` param (`monthly` | `annual`). Use the corresponding price ID when creating the checkout session. Add annual price IDs to the `PRICE_IDS` map.

## Step 6: Update Upgrade Dialogs
Update `EstimateQuotaDialog` and `FullAppAccessGate` to pass `interval` (default monthly for upgrades, or add a toggle).

## Step 7: Update Price ID Mappings
Add the new annual price IDs to `PRICE_ID_TO_TIER` so the webhook and check-subscription functions correctly identify the tier from annual subscriptions.

## Technical Details

**Files to modify:**
- `src/lib/subscription-tiers.ts` — add `annual_price`, `annual_price_id` fields
- `src/pages/Pricing.tsx` — monthly/annual toggle UI
- `src/pages/Signup.tsx` — read `interval` param, display correct price
- `supabase/functions/create-checkout/index.ts` — accept `interval`, select correct price ID
- `src/components/estimates/EstimateQuotaDialog.tsx` — show monthly price (no change needed for MVP)
- `src/components/subscription/FullAppAccessGate.tsx` — show monthly price (no change needed for MVP)

**Stripe tools needed:**
- `create_stripe_product_and_price` × 2 (annual prices on existing products)

**Edge function redeployment:** `create-checkout`

