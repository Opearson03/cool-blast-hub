

# EOFY Sale Landing Page (`/eofy`)

## What we're building
A standalone promotional landing page at `/eofy` designed for ad traffic. It presents the annual plans as an "End of Financial Year Sale" with urgency-driven copy, crossed-out monthly pricing to highlight savings, and direct signup CTAs. No monthly toggle — annual only.

## Page design
- Same dark `bg-charcoal-dark` theme as the Pricing page
- PourHub logo header with "Sign In" button
- Hero section: "End of Financial Year Sale" headline with urgency tagline ("Lock in your annual rate before June 30")
- Sale badge / countdown feel (e.g. "EOFY SALE" badge, "Limited Time" callout)
- Two pricing cards (Estimating $999/yr, Pro $1,999/yr) showing:
  - Crossed-out monthly-equivalent price (e.g. ~~$1,188~~ → $999/yr)
  - "Save $189/yr" and "Save $389/yr" badges
  - Feature lists (same as Pricing page)
  - CTA buttons linking to `/signup?tier=estimating&interval=annual` and `/signup?tier=pro&interval=annual`
- Brief value props section
- Footer with links

## Technical details

**New file:** `src/pages/EOFY.tsx`
- Imports `SUBSCRIPTION_TIERS`, `SEOHead`, `Logo`, shared UI components
- Purely static/presentational — no new hooks or backend changes

**Modified file:** `src/App.tsx`
- Add route: `<Route path="/eofy" element={<EOFY />} />`

No database, edge function, or Stripe changes needed — the signup flow already handles `tier` + `interval=annual` params.

