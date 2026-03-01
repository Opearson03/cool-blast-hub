

## Update Subscription Breakdown Widget for Current Pricing

### Problem
The staff portal's "Subscription Breakdown" widget hardcodes the old "$100 per month" plan label and uses creation date (30-day threshold) to distinguish paid vs trial. It needs to reflect the current two-tier model: Estimating ($99/mo) and Pro ($240/mo), and use the actual `plan_tier` and `status` columns from `business_subscriptions`.

### Current Data
The `business_subscriptions` table already stores `plan_tier` (values: `estimating`, `pro`, `standard`) and `status` (values: `active`, `trialing`, `canceled`, etc.). The DB currently has 1 estimating and 5 pro active subscriptions.

### Changes

**1. Update `get_subscription_stats` database function (migration)**
Replace the hardcoded `paid_100_plan` / `trial_100_plan` fields with tier-specific counts:
- `estimating_paid` -- plan_tier = 'estimating' AND status = 'active'
- `estimating_trial` -- plan_tier = 'estimating' AND status = 'trialing'
- `pro_paid` -- plan_tier = 'pro' AND status = 'active'
- `pro_trial` -- plan_tier = 'pro' AND status = 'trialing'
- `legacy_paid` -- plan_tier = 'standard' AND status IN ('active', 'trialing')
- Keep existing fields: `total_businesses`, `total_users`, `demo_accounts`, `waiting_list_count`, `recent_signups_*`, `active_today`

**2. Update `SubscriptionMetrics.tsx` component**
- Update the `SubscriptionStats` interface to match the new fields
- Calculate MRR as: `(estimating_paid * 99) + (pro_paid * 240) + (legacy_paid * 100)`
- Show separate rows for each tier:
  - Estimating $99/mo (paid) -- count
  - Estimating $99/mo (trial) -- count (only shown if > 0)
  - Pro $240/mo (paid) -- count
  - Pro $240/mo (trial) -- count (only shown if > 0)
  - Legacy $100/mo -- count (only shown if > 0)
  - Demo accounts (exempt) -- count
- Keep the MRR card and total businesses summary

**3. Update `StaffDashboard.tsx` interface**
- Update the `SubscriptionStats` interface to match the new DB function return shape
