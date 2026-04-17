

# Introducing PourHub Enterprise

## What we're building
1. A new public **/enterprise** info page describing the bespoke offering for large commercial concreting companies
2. An **"Introducing PourHub Enterprise"** banner/section on the home page (`/`) linking to it
3. A third **Enterprise** card on the **/pricing** page with an "Enquire Now" CTA (no price — links to enterprise page or a contact action)

## Page design — `/enterprise`
- Same `bg-charcoal-dark` theme as Pricing/EOFY
- Header: PourHub logo + "Sign In" button
- **Hero**: "Introducing PourHub Enterprise" + subhead "A fully custom-built platform for large commercial concreting companies"
- **What we manage** section — end-to-end coverage with feature blocks:
  - Estimating & tendering at scale
  - Job & project management
  - Crew & subcontractor coordination
  - Scheduling across multiple sites
  - Concrete testing & compliance
  - Equipment & tool logs
  - Plant & vehicle tracking
  - Custom reporting & dashboards
- **"Built for your business"** section — copy explaining it's a fully custom build (custom workflows, integrations with your existing systems, dedicated onboarding, white-glove support)
- **Who it's for** — large commercial concreters, multi-crew operations, businesses needing bespoke workflows
- **CTA**: "Enquire Now" button → `/bookings` (existing booking page) with prefilled context, plus a `mailto:` fallback
- Footer matching site style

## Home page (`/`) addition
- Insert a new **"Introducing PourHub Enterprise"** banner section between the existing "Subbie" section and the final CTA (~line 437)
- Dark gradient panel with badge ("NEW"), heading, short pitch ("Fully custom platform for large commercial operations — from estimating to tool logs"), and "Learn More" button → `/enterprise`

## Pricing page addition
- Switch the pricing grid from 2 columns to 3 columns on `md+` (`md:grid-cols-3`)
- Add a third **Enterprise** card:
  - Title: "Enterprise"
  - Price: "Custom" (no $ figure)
  - Description: "Fully custom platform for large commercial concreting companies"
  - Features: Everything in Pro + Custom workflows, Tool & equipment logs, Multi-site scheduling, Dedicated onboarding, Priority support, Custom integrations
  - CTA: "Enquire Now" → `/enterprise`
- Add an **Enterprise** column to the comparison table (mostly checks + "Custom" entries)

## Technical details

**New file:** `src/pages/Enterprise.tsx` — purely presentational, uses `SEOHead`, `Logo`, `Button`, `Card`, `Badge`, lucide icons

**Modified files:**
- `src/App.tsx` — add `<Route path="/enterprise" element={<Enterprise />} />`
- `src/pages/Index.tsx` — insert Enterprise banner section before final CTA
- `src/pages/Pricing.tsx` — add third tier card + comparison column, switch grid to 3 cols

No database, edge function, or Stripe changes. Enterprise enquiries route to the existing `/bookings` flow.

