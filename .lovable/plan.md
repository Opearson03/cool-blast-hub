

## Fix "Get Started" to Use the $240/mo Pro Plan

### Problem
The "Get Started" buttons link to `/signup` without specifying a tier, and the Signup page defaults to the legacy `standard` tier ($100/mo) instead of the current Pro tier ($240/mo).

### Changes

**1. `src/pages/Index.tsx` -- Add `tier=pro` to signup links**
- Update both "Get Started" and "Get Started Today" links to include `?tier=pro` (preserving existing affiliate code logic)

**2. `src/pages/Signup.tsx` -- Read tier from URL, default to `pro`**
- Read the `tier` query parameter from the URL
- Use it to select the correct tier config from `SUBSCRIPTION_TIERS` (defaulting to `pro` if not specified)
- Pass the selected tier to the `create-checkout` edge function call
- The plan summary card on the left will automatically show the correct name, price, and features

### Technical Detail
- Line 15 of Signup.tsx changes from `const tierConfig = SUBSCRIPTION_TIERS.standard` to reading from the URL param with a `pro` default
- The `create-checkout` function already accepts a `tier` parameter and maps it to the correct Stripe price ID, so no backend changes needed

