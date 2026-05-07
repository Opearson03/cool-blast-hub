## Goal
Remove all "free trial" messaging from the three ad landing pages, add concreting hero background imagery to each variant, and make at least one variant route directly into Stripe checkout ("Try it now") instead of the pricing page.

## 1. Remove "free trial" / "14-day" messaging
Sweep `LandingA.tsx`, `LandingB.tsx`, `LandingC.tsx` and replace every trial reference with neutral, no-trial CTAs. Examples:

- `Start free trial` → `Get started` (or variant-specific: `Start quoting`, `Send a quote`, `See it in action`)
- `Try free for 14 days` → `Get started today`
- `No credit card • 14-day trial` → remove the line entirely
- `Try PourHub free for 14 days. Cancel anytime.` → `Cancel anytime. Pay monthly or annually.`
- `14-day free trial • No card required` → remove the line entirely
- `Send your first branded quote tonight.` → keep (no trial language)

No "free trial" wording will remain on any of the three pages.

## 2. Add concreting hero background images
Use existing assets (no new generation needed):

- **Variant A (Speed)** → `hero-concrete-pour.jpg` as hero background
- **Variant B (Win more jobs)** → `concrete-finishing.jpg` as hero background
- **Variant C (Whole business)** → `hero-industrial.jpg` as hero background

Apply via the hero `<section>`: background image + dark overlay (`bg-black/55` or gradient `from-background/90 to-background/60`) so existing text/buttons stay readable in both light and dark mode. Use `bg-cover bg-center`. Keep the existing benefit/closing CTA sections clean (no background image) so the page stays light and fast.

Also add a subtle background image strip behind the closing CTA on Variant C using `concrete-formwork.jpg` for visual rhythm.

## 3. "Try it now" — direct Stripe checkout on Variant A
Variant A becomes the **direct-checkout** variant. Variants B and C continue routing to `/pricing?variant=b|c`.

### Behaviour
- Primary hero CTA on `/lp/a` → "Try it now — $99/mo" → calls `create-checkout` edge function with the **Estimating** plan price_id (`price_1SxfDWS7UIjxyz7V3CrcxMT4`) and opens Stripe Checkout in a new tab.
- If the user is **not signed in**, we route them to `/signup?variant=a&checkout=estimating` first; after signup completes, `SignupSuccess` (or the post-signup landing) detects `?checkout=estimating` and immediately invokes `create-checkout` so the user lands in Stripe Checkout with no extra clicks.
- If the user **is** signed in, the CTA invokes `create-checkout` directly from the landing page.
- Track both paths via the existing `useLandingTracker` hook: fire `trackCTA("hero_direct_checkout")` and (on success) `recordLandingConversion` with `{ event_type: "checkout_started", plan: "estimating" }`.
- Header CTA on Variant A and the closing CTA also point to the same direct-checkout flow for consistency.

### Existing infrastructure
- `supabase/functions/create-checkout` already exists and accepts a price/tier — we'll reuse it as-is.
- `src/lib/subscription-tiers.ts` already exports the Estimating price_id.
- `useAuth()` from `AuthContext` provides the current user; we'll branch on `user` presence.
- A small toast on failure + loading state on the button.

## 4. Files to change
- `src/pages/landing/LandingA.tsx` — strip trial copy, add hero bg image + overlay, swap CTAs to a new `<TryItNowButton variant="a" />` that triggers direct checkout (or signup-then-checkout).
- `src/pages/landing/LandingB.tsx` — strip trial copy, add hero bg image + overlay, keep `/pricing?variant=b` CTA, retune labels.
- `src/pages/landing/LandingC.tsx` — strip trial copy, add hero bg image + overlay, keep `/pricing?variant=c` CTA.
- `src/components/landing/LandingShell.tsx` — allow either an `href` link CTA or an `onClick` handler (so Variant A's header CTA can also fire direct checkout). Keep default behaviour for B/C.
- `src/components/landing/TryItNowButton.tsx` *(new, small)* — encapsulates the "signed-in → checkout / not-signed-in → /signup?variant=a&checkout=estimating" logic + loading state + tracking.
- `src/pages/SignupSuccess.tsx` — when `?checkout=estimating` is present in the post-signup URL, auto-invoke `create-checkout` and redirect to the returned `session.url`.

## Out of scope
- No changes to `/pricing`, the Stripe products, or `create-checkout` itself.
- No new images generated — using existing `src/assets/*.jpg`.
- Variants B and C keep the "view pricing" flow (this gives us a real A/B/C signal: direct-checkout vs pricing-page).
