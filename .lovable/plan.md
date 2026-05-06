## Landing page redesign — `src/pages/Index.tsx`

### Why the current page reads as "vibe-coded"

A quick honest audit:

1. **No clear hierarchy** — hero has logo + wordmark + H1 + H2 + paragraph + counter + microcopy + a glassy CTA card all fighting for attention. The eye doesn't know where to land.
2. **Duplication** — "PourHub" appears as logo, wordmark, nav, and again huge in the hero. The product name is shouted four times before you read what it does.
3. **Inconsistent rhythm** — section padding jumps between `py-16/20/24`, headings between `text-2xl/3xl/4xl`, cards between `p-6/7/8`. Nothing is on a grid.
4. **Generic SaaS clichés** — three identical card rows, every card with `border-t-2 border-t-primary` + hover scale. It looks AI-generated because every card is treated equally.
5. **Weak typography** — single weight, single family (Inter default), no display face, no tracking discipline. Headlines and body look like the same text at different sizes.
6. **Decoration > information** — gradient overlays, blur orbs, ring-1, shadow-2xl, hover:scale-[1.02] applied everywhere. Effects should reward attention, not demand it.
7. **Three CTAs in the hero card** (Get Started / View Pricing / Book a Call) — no primary action wins.
8. **Screenshots are dark-masked** with a gradient covering the bottom third — the product is literally hidden behind decoration.
9. **Subbie section is huge** (6 cards + tag cloud + dual CTA) for what is a secondary audience.
10. **Footer + final CTA** are forgettable orange-on-orange.

### Core web design principles we'll apply

- **One job per section.** Each band answers one question: What is it? → Who is it for? → What does it do? → Proof → Price/Action.
- **Hierarchy through contrast, not size.** Display font + weight + colour temperature do the work; we stop scaling everything up.
- **A real type system.** Display face for headlines (Space Grotesk or Bricolage Grotesque via Google Fonts), Inter for body. Tracking tightened on display, looser on eyebrows/labels.
- **An 8-pt vertical rhythm.** Section padding standardised (`py-28` desktop / `py-20` mobile). Heading scale fixed (eyebrow `text-xs` uppercase tracked, H2 `text-4xl/5xl`, body `text-lg`).
- **Restraint with effects.** Blur orbs and hover scales removed from generic cards; reserved for the hero and the final CTA only.
- **Asymmetry where it earns it.** Feature rows alternate in a 7/5 grid instead of 6/6, with the screenshot bleeding off the edge of its container — feels editorial, not cookie-cutter.
- **Show the product, don't mask it.** Screenshots in clean device-style frames, no bottom gradient covering the UI.
- **Single primary CTA above the fold.** "Start free trial" wins; secondary actions become text links.

### New page structure

```text
┌──────────────────────────────────────────────────────────┐
│ NAV   PourHub   ·   Features  Pricing  Subbies  Sign in │
├──────────────────────────────────────────────────────────┤
│ HERO  (existing hero-pour-background.png, kept)          │
│   eyebrow: "Built in Australia for concreters"           │
│   H1:      Run your concreting                           │
│            business like a pro.                          │
│   sub:     One platform for jobs, quotes, schedules      │
│            and test results.                             │
│   [ Start free trial ]   Watch 60-sec tour →             │
│   live counter:  $X.XM quoted through PourHub            │
├──────────────────────────────────────────────────────────┤
│ LOGOS / TRUST STRIP   "Trusted by Aussie concreters"     │
│   (uses live counter + small stat row, no fake logos)    │
├──────────────────────────────────────────────────────────┤
│ FOUR PILLARS  Jobs · Estimates · Schedule · Testing      │
│   compact icon row, one line each, no card chrome        │
├──────────────────────────────────────────────────────────┤
│ FEATURE 1  Job Management        [ screenshot, right ]   │
│ FEATURE 2  Estimates             [ screenshot, left  ]   │
│ FEATURE 3  Schedule              [ screenshot, right ]   │
│   (asymmetric 7/5 grid, screenshots un-masked,           │
│    bullets become 3 short benefit lines)                 │
├──────────────────────────────────────────────────────────┤
│ SUBBIE BANNER (compact, single row, no card grid)        │
│   "Are you a subbie? Get listed free. →"                 │
├──────────────────────────────────────────────────────────┤
│ ENTERPRISE BANNER (kept, restyled to match)              │
├──────────────────────────────────────────────────────────┤
│ FINAL CTA  big display headline, single button           │
├──────────────────────────────────────────────────────────┤
│ FOOTER  three-column: brand · product · legal            │
└──────────────────────────────────────────────────────────┘
```

### Specific changes

**Nav**
- Add `Features`, `Subbies` anchor links alongside `Pricing`.
- Slightly translucent at top, becomes solid on scroll (existing sticky stays).
- Sign in becomes ghost link; primary CTA `Start free` lives in nav on scroll.

**Hero**
- Keep `hero-pour-background.png` and the dark gradient overlay.
- Drop the second giant logo + wordmark (nav already shows it).
- Single H1 in the new display font, two lines max, tighter tracking.
- One paragraph, one primary button, one secondary text link. Remove "Book a Call" from hero (keep in footer / subbie band).
- Live quoted-value counter rendered as a slim pill under the CTA, not as a separate proof card.
- Right-hand "Start Managing Jobs Today" card is removed — it duplicates the hero CTA. The hero becomes a single, confident left-aligned column with the image breathing on the right.

**Trust strip**
- New thin band: `$X.XM quoted · Australian-built · Mobile-first · ABN-verified subbies`.
- Replaces the current orphaned "Trusted by Australian concreters" line.

**Four pillars**
- Replace the current 4-card grid with a single horizontal row of icon + label + 1-line description, no borders. Acts as a visual table of contents for the feature deep-dives below.

**Feature deep-dives (3, not 4)**
- Merge "Job Management" content; keep Estimates and Schedule. Drop the Testing dive (it's already in the pillars row + counter).
- 7/5 asymmetric grid, alternating sides.
- Screenshots in a simple bordered frame with subtle shadow — no overlay gradient, no caption pill covering the image. Caption sits underneath.
- Bullet lists become 3 short benefit lines with a small check glyph, not full sentences.

**Subbies**
- Collapse current 6-card grid + tag cloud into one banner: left = headline + one paragraph + trade chips inline, right = single CTA. Links to `/sub-contractors` for the full story.

**Enterprise banner**
- Kept structurally; restyled with the new type scale and a subtler glow so it stops competing with the hero.

**Final CTA**
- Replace orange-on-orange gradient with charcoal background + oversized display headline ("Quote your next job in minutes.") and one primary button. Higher contrast, more memorable.

**Footer**
- Three columns on desktop (Brand + tagline / Product links / Legal + feedback) instead of one centre-aligned line. Stacks on mobile.

### Design system touch-ups (`index.css` + `tailwind.config.ts`)

- Add display font (`Space Grotesk` or `Bricolage Grotesque`) via Google Fonts in `index.html`; expose as `font-display` Tailwind family.
- Add semantic tokens: `--surface-1` (charcoal-dark), `--surface-2` (charcoal), `--surface-3` (card on dark), so sections stop using raw `bg-charcoal-dark` / `bg-background` mixes.
- Add a `--gradient-hero` token for the hero overlay so it's reused consistently.
- Standardise section padding via a `.section` utility class (`py-20 md:py-28 px-4`).
- Standardise eyebrow style via `.eyebrow` (uppercase, tracked, primary colour, text-xs).

No colour-palette change. Orange + charcoal stays.

### Motion

- Subtle fade-up on section enter using `framer-motion` (already in deps if present; otherwise pure CSS `@keyframes` + `IntersectionObserver` to avoid a new dep).
- Hero CTA gets one well-timed entrance, not a hover bounce.
- Remove `hover:scale-[1.02]` from generic cards; keep on the single primary button.

### Files touched

- `src/pages/Index.tsx` — full rebuild end-to-end (hero image asset reused as-is).
- `src/index.css` — add `.section`, `.eyebrow` utilities, `--surface-*` and `--gradient-hero` tokens.
- `tailwind.config.ts` — register `fontFamily.display`.
- `index.html` — preconnect + load Google Font (display face only).
- Small new presentational component(s) extracted from `Index.tsx` for readability: `SectionHeading`, `FeatureRow`, `Pillar`. Kept in `src/components/marketing/`.

### Out of scope

- New hero/product imagery (using existing assets).
- Pricing page, Enterprise page, Subbie landing page redesigns.
- Copywriting beyond the hero, pillars and final CTA (deeper sections keep current copy with light edits).
- Any backend / data changes — live quoted-value counter hook stays as-is.
