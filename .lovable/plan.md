

## Convert Landing Page from Waitlist to Live Signup

### Summary
Replace the waitlist form and counter on the landing page with a direct "Get Started" call-to-action that sends users to `/signup`. Remove all waitlist-related references. Keep the "Total Quoted" counter as social proof.

### Changes

**1. `src/pages/Index.tsx` -- Landing Page**

- **Remove imports**: `WaitlistForm`, `useWaitlistCount`
- **Remove state/data**: `waitlistCount`, `isCountLoading`, `referralCode`
- **Hero right side**: Replace the waitlist form card with two clear CTA buttons:
  - Primary: "Get Started Free" linking to `/signup`
  - Secondary: "View Pricing" linking to `/pricing`
  - Keep the affiliate link passthrough (`?aff=` param forwarded to `/signup`)
- **Hero left side**:
  - Remove the "X concreters on the waiting list" counter (lines 108-120)
  - Keep the "Total Quoted through PourHub" counter as social proof
  - Change "Already have access? Sign In" to just "Already have an account? Sign In"
- **Referral banner area** (lines 150-165): Remove the waitlist referral/early bird banners entirely
- **CTA section** (bottom): Change from "Join the Waiting List" to "Start Your Free Trial" linking to `/signup`
  - Update copy from "Join X concreters on the waiting list" to something like "Join hundreds of concreters already using PourHub"
- **SEO description**: Update to reflect live product (remove any "waiting list" or "launching soon" language)

**2. No backend changes needed** -- The `/signup` page and checkout flow already exist and work.

### What stays the same
- All feature sections, screenshots, and app showcase content
- The "Total Quoted through PourHub" counter
- Footer with links, feedback dialog
- The Signup page itself (already handles direct signups via Stripe checkout)
- Native platform redirect logic

