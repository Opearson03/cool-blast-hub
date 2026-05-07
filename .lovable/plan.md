## Goal
Bring the three ABC landing pages (`/lp/a`, `/lp/b`, `/lp/c`) into visual continuity with the main `/` landing page — same logo treatment, same display font, same dark charcoal header/footer chrome, same eyebrow + `text-primary` accent styling.

## Discrepancies today
| Element | Main landing (`/`) | ABC pages today |
|---|---|---|
| Header bg | `bg-charcoal-dark/40` (dark, transparent, sticky) | `bg-card` (light) |
| Logo | `<Logo size="sm" className="w-8 h-8 rounded-lg" />` + `Pour`/`Hub` wordmark in `font-display` | `<Logo />` default (`w-8 h-8`, no rounded corners, no wordmark) |
| Headlines | `font-display` (Space Grotesk) | Default `font-sans` (Inter) |
| Eyebrow chip | `<span className="eyebrow">…</span>` style (uppercase, tracked) | Custom rounded-full badge |
| Footer | Dark charcoal | Light `bg-card` |

## Changes — all in `LandingShell.tsx` + the three Landing pages

### 1. `src/components/landing/LandingShell.tsx`
Rewrite the header + footer to mirror `Index.tsx`:
- **Header**: sticky, `bg-charcoal-dark/95 backdrop-blur-md border-b border-border/30`, max-w-6xl container, `py-3`.
- **Logo block**: `<Link to="/"><Logo size="sm" className="w-8 h-8 rounded-lg" /><span className="text-lg font-display font-bold">Pour<span className="text-primary">Hub</span></span></Link>` — identical to Index.
- **Right side**: keep the single CTA button (`Try it now` / `See plans`) as-is for ad conversion focus, but render with `font-medium` + `size="sm"` to match Index's "Start free" button styling.
- **Footer**: switch to `bg-charcoal-dark text-primary-foreground/70` with the same Privacy/Terms links.

### 2. Each `LandingA/B/C.tsx`
- Add `font-display` to every `<h1>` and `<h2>` so headings render in Space Grotesk like `/`.
- Replace the bespoke `bg-primary/10 ... rounded-full` eyebrow chip with the shared `<span className="eyebrow">…</span>` pattern (or keep the chip but switch text to uppercase tracked + `font-display`). Pick: use `eyebrow` class for consistency with main landing.
- No copy changes, no layout changes — purely typography + chip restyle.

### 3. No changes to
- The hero background images (already approved last turn).
- The CTAs / routing / Stripe checkout flow.
- `index.css`, `tailwind.config.ts`, fonts (already loaded).

## Out of scope
- Adding the Index.tsx full nav (Features/Pricing/Subbies/Articles links) — ad landing pages intentionally stay nav-light to maximise conversion. We're matching **chrome styling**, not nav structure.
- Mobile bottom-bar CTA, scroll behaviour changes.
