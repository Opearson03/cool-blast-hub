## Goal
Replace the AI-generated hero backgrounds on `/lp/a`, `/lp/b`, `/lp/c` with real, commercially-licensed concreting photos from Unsplash.

## Photos selected (Unsplash, free for commercial use, no attribution required)

| Page | Photo | Why it fits |
|---|---|---|
| `/lp/a` "Quote a slab in 10 minutes" | [Workers pouring concrete on a foundation](https://unsplash.com/photos/d2zNp3mdtRo) by Nihar Reddy Jangam | Active pour shot — matches "speed / get it done" message |
| `/lp/b` "Send quotes that win" | [Concrete being leveled with a screed](https://unsplash.com/photos/4YbgiADkpYE) | Clean finishing shot — matches "polished / professional" message |
| `/lp/c` "Run every concrete job from one place" | [Workers pouring and leveling concrete (wide jobsite)](https://unsplash.com/photos/VHPFxU6eqto) by Nihar Reddy Jangam | Wide jobsite with crew — matches "whole business in one system" |

## Implementation steps

1. **Download** each Unsplash photo at 1920px wide via `curl` into `src/assets/`:
   - `src/assets/lp-a-pour.jpg`
   - `src/assets/lp-b-finishing.jpg`
   - `src/assets/lp-c-jobsite.jpg`
   (Resolved direct URLs by fetching the Unsplash page `og:image` and stripping query params, then re-requesting at `?w=1920&q=80&fm=jpg`.)

2. **Update imports** in:
   - `src/pages/landing/LandingA.tsx` → swap `hero-concrete-pour.jpg` → `lp-a-pour.jpg`
   - `src/pages/landing/LandingB.tsx` → swap `concrete-finishing.jpg` → `lp-b-finishing.jpg`
   - `src/pages/landing/LandingC.tsx` → swap `lp-hero-c-jobsite.jpg` → `lp-c-jobsite.jpg`

3. **Keep** the existing dark overlay (`bg-black/65` / `bg-black/70`) so headline text stays legible over the real photos.

4. **Verify**: screenshot each page after the swap to confirm the photos load, look natural, and the text remains readable. Adjust overlay opacity per-page if a photo is unusually bright/dark.

## Out of scope
- Deleting the old AI-generated assets (still imported in other places — leave them alone).
- Layout, copy, font, or CTA changes.
- Adding photo credits in the footer (Unsplash licence doesn't require it; the user has not asked for it).

## Fallback
If any of the three Unsplash downloads fail (HTTP error, image too small, etc.), I'll pick the next-best result from the same Unsplash search and document the swap in the final response.
