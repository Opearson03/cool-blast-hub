## Goal

Bring `/enterprise` in line with the new design language used on EOFY and Articles (LandingShell chrome, eyebrow chips, `font-display` headings, consistent dark-charcoal sectioning).

## Changes — `src/pages/Enterprise.tsx`

1. **Replace bespoke header/footer with `LandingShell`**
   - Wrap content in `<LandingShell ctaHref="/bookings" ctaLabel="Enquire now" />`.
   - Remove the custom `<header>` (Logo + Sign In) and `<footer>` blocks.

2. **Hero**
   - Swap the gradient `Badge` ("NEW — INTRODUCING" with Sparkles icon) for an `eyebrow` span (e.g. `New — introducing`), matching EOFY/Articles.
   - Add `font-display` to the `h1`.
   - Keep the "Enquire Now" + "Email Us" buttons but tighten styling to match EOFY (primary CTA + outline secondary).

3. **Section headings**
   - Apply `font-display` to all `h2` / `h3` headings ("End-to-End Coverage…", "Built for Your Business", "Who It's For", "Let's Talk About Your Operation").
   - Replace the `Badge variant="outline"` "FULLY CUSTOM BUILD" with an `eyebrow` chip.

4. **Capability cards (8-grid)**
   - Keep the layout, but switch titles to `font-display font-semibold` and standardise card styling to match the EOFY/Articles card treatment (`border-border/70`, hover `border-primary/50`, subtle lift).

5. **"Built for Your Business" 4-grid**
   - Use `font-display` on the sub-headings; align padding/border with the other landing surfaces.

6. **"Who It's For" stats**
   - Apply `font-display` to the three large stat numbers.

7. **Final CTA strip**
   - Keep `bg-primary` background but use `font-display` heading and tighten button row (Enquire Now primary `secondary` + secondary outline back to `/pricing`), matching EOFY's closing CTA.

## Out of scope

- Copy/content changes beyond chip wording.
- Changes to `IntegrationsMarquee`, SEO metadata, routes, or any business logic.
- Light/dark token changes — continue using existing semantic tokens (`charcoal-dark`, `charcoal`, `primary`, `muted-foreground`, etc.).
