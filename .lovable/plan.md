

## Visual Polish for the Landing Page

### Summary
Refine the existing landing page layout with improved spacing, subtle visual enhancements, shadows, and typography tweaks -- keeping the same structure and content intact.

### Changes (all in `src/pages/Index.tsx`)

**1. Hero Section**
- Add a sticky top navigation bar with the Logo, "Pricing" link, and "Sign In" link for a more professional feel (moves "Already have an account?" out of the hero body)
- Increase the hero heading font weight tracking and add a subtle text-shadow for depth
- Give the CTA card a stronger glass-morphism effect: increased backdrop blur, a subtle primary-tinted border glow, and a slight shadow-xl lift
- Add a small "Trusted by Australian concreters" tagline or badge near the quoted value counter

**2. Feature Cards Grid**
- Add `shadow-md hover:shadow-lg` transitions to each card for lift on hover
- Add a subtle top-border accent (`border-t-2 border-primary`) to each card for visual pop
- Increase padding slightly and add a `group` class for icon colour animation on hover

**3. App Showcase Section**
- Make the screenshots taller on desktop (`lg:h-96` instead of `lg:h-80`) for more visual impact
- Add a subtle `ring-1 ring-primary/20` around images for cohesion with the orange theme
- Slightly increase gap between text and image columns

**4. CTA Banner**
- Add a subtle gradient (`bg-gradient-to-r from-primary to-orange-dark`) instead of flat `bg-primary`
- Increase vertical padding for more breathing room

**5. Footer**
- Add a thin `border-t border-border/30` separator above footer
- Slightly increase footer padding

**6. Global Enhancements**
- Add smooth scroll behaviour via `scroll-smooth` on the page wrapper
- Ensure consistent `transition-all duration-300` on all interactive hover states

### Technical Details

- All changes are in `src/pages/Index.tsx` and `src/index.css` (if needed for a utility)
- No new dependencies or components required
- Existing `FeatureCard` component updated in-place with enhanced styling
- Navigation bar added as inline JSX at the top of the page (no new component file needed)

