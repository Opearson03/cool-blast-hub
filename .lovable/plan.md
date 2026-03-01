

## Remove Free Trial & Free Tier, Make Pricing Page Live

### Summary
Remove all "free trial", "free tier", and "waitlist" references across the landing page, pricing page, and signup page. Replace with direct purchase CTAs that send users to Stripe checkout.

### Changes

**1. `src/pages/Pricing.tsx` -- Full overhaul**
- Remove `WaitlistForm` and `useWaitlistCount` imports and usage
- Remove the Free tier card entirely (only show Estimating and Pro)
- Remove waitlist counter from hero
- Update hero subtitle from "Start free with 2 quotes..." to something like "Choose the plan that fits your business."
- Change all "Join Waiting List" buttons to "Get Started" linking to `/signup` (passing the selected tier)
- Remove the "Join waitlist = 1 month FREE" badge on Pro card
- Remove the bottom CTA section with WaitlistForm, replace with a simple CTA linking to `/signup`
- Update comparison table to only show Estimating and Pro columns (remove Free column)
- Update SEO title/description to remove "Free" references

**2. `src/pages/Index.tsx` -- Landing page updates**
- Change hero CTA text from "Get Started Free" to "Get Started"
- Change hero card copy from "start your 30-day free trial" to "Sign up in under 2 minutes."
- Change bottom CTA button from "Start Your Free Trial" to "Get Started Today"
- Update SEO description to remove "free trial" reference

**3. `src/pages/Signup.tsx` -- Signup page updates**
- Remove the "One month free trial" badge from the plan summary card
- The signup still defaults to the legacy `standard` tier config -- this could optionally accept a `tier` query param to show the correct plan, but we can keep it simple for now

**4. `supabase/functions/create-checkout/index.ts` -- Remove trial**
- Remove `trial_period_days: 30` from subscription_data for non-affiliate signups (affiliate flow already removes it)
- Users go straight to paid subscription after checkout

### No changes needed
- Subscription tiers config (`subscription-tiers.ts`) -- free tier stays in code for potential future use
- Subscription gates -- they already handle all tiers correctly
- Stripe webhook -- no trial-related logic to change

