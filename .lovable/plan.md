

# Fix jbrown@formandcrete.com + Prevent Future Conflicts

## Part 1: Manual Data Fix (database migration)

Run a migration that:
1. Creates a `businesses` row for "Form and Crete" with `email = 'jbrown@formandcrete.com'` and `owner_id` = their user ID
2. Creates a `profiles` row linking their user ID to the new business
3. Removes the `subcontractor` role from `user_roles` and adds `admin` role
4. Creates a `business_subscriptions` row linking to their Stripe customer (`cus_UHhrAaB2KaOhn4`) and subscription (`sub_1TJ8SGS7UIjxyz7VTPMU0nMU`) with `plan_tier = 'estimating'`, `status = 'active'`

## Part 2: Fix the webhook product ID mapping

The webhook's `PRODUCT_IDS` is missing the new $199 Pro product (`prod_U6lpws80KASuHx`). It only has the legacy `prod_TvWGfsM4uQs4od`. Add the new product ID so future Pro subscriptions are correctly categorized instead of falling through to the default.

**File:** `supabase/functions/stripe-webhook/index.ts`

## Part 3: Handle existing-user conflict in SignupSuccess

Currently `SignupSuccess` calls `supabase.auth.signUp()` which fails silently if the email already exists. Fix it to:
- Detect the "user already exists" error
- Show a message: "An account with this email already exists. Please sign in instead."
- Provide a link to `/auth` with the email pre-filled

**File:** `src/pages/SignupSuccess.tsx`

## Part 4: Prevent subcontractors from reaching business checkout

Add a guard in the `/signup` page: if the user is already logged in with a subcontractor role, show a message explaining they already have a subcontractor account and need to use a different email to sign up for quoting, or contact support.

**File:** `src/pages/Signup.tsx`

## Summary

- Part 1 fixes this specific user immediately
- Parts 2-4 prevent it from happening again
- No changes to the Stripe subscription itself — they keep the $99 Estimating plan

