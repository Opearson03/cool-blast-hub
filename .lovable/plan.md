## Goal
Bring `/eofy` in line with the new landing-page design language used on `/lp/a`, `/lp/b`, `/lp/c` (and matching the main `/`): shared `LandingShell` chrome, `font-display` headings, `eyebrow` chips, consistent logo size + rounded corners.

## Current vs target

| Element | EOFY today | Target (new design language) |
|---|---|---|
| Header | Bespoke header, `Logo size="lg"` (40px) + `text-2xl` wordmark, "Sign In" outline button | Use `<LandingShell>` → sticky `bg-charcoal-dark/95` header, `Logo size="sm" w-8 h-8 rounded-lg` + `text-lg font-display` wordmark, single primary CTA |
| Footer | Bespoke charcoal footer with 3 links | `<LandingShell>` footer (Privacy / Terms) — drop "All Plans" link or keep as third item |
| Headings (h1/h2/h3) | `font-bold` (Inter) | `font-display font-bold` (Space Grotesk) |
| Eyebrow chips | Custom `Badge` components (e.g. "🔥 EOFY SALE", "💰 TAX DEDUCTION", "EOFY DEAL") | Replace top-of-section chips with `<span className="eyebrow text-primary">` style; keep card-level "EOFY DEAL" / "BEST VALUE" badges as-is (they're functional pricing badges, not section eyebrows) |
| Page background | `bg-charcoal-dark` | Keep — same as new pages |

## Changes — single file: `src/pages/EOFY.tsx`

1. **Wrap content in `<LandingShell>`**
   - Import `LandingShell` from `@/components/landing/LandingShell`.
   - `ctaHref="/signup?tier=pro&interval=annual"`, `ctaLabel="Get EOFY deal"`.
   - Remove the bespoke `<header>` (lines 29–43) and bespoke `<footer>` (lines 237–256).
   - Drop the outer `<div className="min-h-screen bg-charcoal-dark">` wrapper (LandingShell handles it). Apply `bg-charcoal-dark` to `<main>` content sections instead, or wrap children in a charcoal-dark container so the visual feel stays the same.

2. **Typography pass**
   - Add `font-display` to every h1/h2/h3 in the file (hero h1, "Claim It as a Business Expense", "Why Go Annual?", "Don't Miss Out", card h2s).

3. **Eyebrow chips**
   - Replace the destructive Badge "🔥 EOFY SALE — LIMITED TIME" with `<span className="eyebrow text-primary">EOFY sale — limited time</span>`.
   - Replace the "💰 TAX DEDUCTION" Badge with `<span className="eyebrow text-primary">Tax deduction</span>`.
   - Keep the in-card `Badge`s ("EOFY DEAL", "BEST VALUE") unchanged — they're pricing-card chrome, consistent with shadcn Badge use elsewhere.

4. **Sign-in link**
   - Removed when we switch to LandingShell (which only renders the single primary CTA). Acceptable trade-off for visual consistency; users can still reach `/auth` from `/pricing` and the main nav.

## Out of scope
- Pricing data, tier feature lists, copy, tax-deduction wording.
- Stripe / signup routing.
- Any change to `LandingShell` itself.
- New images or hero photos (EOFY is currently solid charcoal — leaving it that way).

## Verification
After the edit, visit `/eofy` and confirm: dark sticky header with small rounded PourHub logo + wordmark matches `/lp/c`; headings render in Space Grotesk; eyebrow chips have the same uppercase tracked styling as `/`; footer matches the ABC pages.
