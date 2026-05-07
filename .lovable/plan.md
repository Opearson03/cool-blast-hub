# Modernise `/pricing`

Bring the pricing page in line with the new design language used on EOFY, Articles, and Enterprise — and add the missing trust/conversion elements identified in the gap review.

## Changes — `src/pages/Pricing.tsx` (full rewrite)

### 1. Chrome
- Wrap in `<LandingShell ctaHref="/signup?tier=pro" ctaLabel="Start free" />`. Remove the bespoke `<header>` and `<footer>`.
- Keep `SEOHead`.

### 2. Hero
- `eyebrow` chip: `Pricing`.
- `font-display` h1: `Simple pricing. No surprises.`
- Sub: `Start free with 2 quotes a month — upgrade when you're ready.` (matches actual Free tier behaviour from `subscription-tiers.ts` — there's no time-limited trial).
- Trust strip directly under: `No credit card to start • Cancel anytime • Built in Australia`.
- Keep the Monthly/Annual toggle but restyle to match the rest of the site (charcoal pill, primary fill on active, `font-display` on labels).

### 3. Plan cards (3-column)
- Restyle all three `Card`s to match the EOFY/Enterprise treatment: `border-border/70 bg-card/80 backdrop-blur`, hover `border-primary/50` lift, rounded-3xl.
- Plan name in `font-display font-semibold`.
- Price in `font-display` extra-bold.
- Replace the invisible placeholder `Badge` height-aligners with a flex layout that handles alignment cleanly.
- "Most popular" badge restyled to the new eyebrow chip style (primary outline + bg).
- CTAs: Estimating → outline; Pro → primary; Enterprise → secondary outline → `/enterprise`.
- Add a per-card one-line "best for" sub-label under price (e.g. "For solo estimators", "For growing crews", "For commercial operations").

### 4. NEW — Risk-reversal strip (between cards and comparison table)
Three small icon+text columns:
- **No card to start** — Free tier forever, no payment details required.
- **Cancel anytime** — Monthly plans cancel from settings in two clicks.
- **Your data stays yours** — Export quotes, jobs and contacts to CSV anytime.

### 5. Comparison table
- Keep the same rows (data is correct).
- Restyle: `font-display` heading, lighter borders (`border-border/40`), zebra-stripe on hover, `text-primary-foreground/80` for body cells, sticky-feeling header row using `bg-charcoal/60`.
- Wrap in a `rounded-2xl border border-border/40 overflow-hidden` container so it visually matches the other surfaces.

### 6. Replace the "Why concreters choose PourHub" stats strip
- Drop the made-up stats (`$199`, `100%`, `0`).
- Replace with a small "What you get on day one" 3-column block (icon + title + 1 line):
  - **Quote in minutes** — Modular calculators handle the maths.
  - **Schedule the week** — Drag-and-drop pours across crews.
  - **Track every test** — MPa, slump and supplier dockets, matched automatically.
- Apply `font-display` to titles, charcoal card backgrounds.

### 7. NEW — FAQ section
Accordion (use existing `@/components/ui/accordion`) with these Qs (all answers ≤2 sentences, written in Aussie tone):
1. Is there a contract?
2. Do I need a credit card to start?
3. What happens if I exceed 2 quotes a month on Free?
4. Can I switch between Estimating and Pro?
5. Do you offer onboarding or training?
6. Can I import my existing price list?
7. What payment methods do you accept?
8. Is my data backed up and secure?
9. Do you support sole traders / single-user accounts?
10. Can I cancel and come back later?

Section uses `eyebrow` chip "Questions?" and `font-display` h2 "Common questions, straight answers."

### 8. NEW — "Still deciding?" pre-footer block
Two-button row matching the EOFY closing CTA pattern:
- Primary: `Start free` → `/signup?tier=pro`
- Outline: `Book a 15-min walkthrough` → `/bookings` (currently only surfaced on landing — bring it onto pricing too).
- Single line above: "Free forever on the starter plan. Upgrade in 30 seconds when you're ready."

### 9. Final CTA strip
- Keep `bg-primary` band, but use `font-display` heading and tighten button row to match EOFY.
- Buttons: `Start free` (secondary) + `Back to home` (ghost outline) — keep current structure, just restyled.

## Out of scope
- No changes to `src/lib/subscription-tiers.ts` (prices, features, IDs stay as-is).
- No changes to `create-checkout` edge function or signup flow.
- No new routes.
- No copy changes to any other page.
- No light-mode work — page stays dark-charcoal to match the rest of the marketing surfaces.

## Files touched
- `src/pages/Pricing.tsx` (full rewrite, ~450 lines).

That's it — single-file change, no DB or backend impact.
