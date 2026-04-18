

## Scrolling "Integrates With" Widget on /enterprise

Add a horizontally auto-scrolling logo marquee to the `/enterprise` page that showcases the major software platforms PourHub Enterprise integrates with. Recommend a curated list relevant to Australian commercial concreting businesses, then wait for the user to supply logo URLs.

### Recommended integrations (Australian concreting context)

Based on the typical software stack for large commercial concreters in AU:

**Accounting / Finance**
- Xero
- MYOB
- QuickBooks

**Communication / Collaboration**
- Microsoft Teams
- Microsoft 365 / Outlook
- Slack
- Google Workspace

**Construction / Project Management**
- Procore
- Aconex (Oracle)
- Buildxact
- Hammertech (safety/compliance — big in AU commercial)

**Tendering / Estimating**
- EstimateOne
- BCI Central

**Payroll / HR / Workforce**
- Employment Hero
- Deputy
- KeyPay

**Concrete / Plant specific**
- Command Alkon (batch plant)
- Holcim / Boral / Hanson supplier portals (logos only — informational)

**Cloud storage / Files**
- Dropbox
- Google Drive
- OneDrive

I'll ask the user to pick which ones they want shown so the strip stays clean (recommend 8–14 logos for best visual rhythm).

### Implementation

**New component:** `src/components/marketing/IntegrationsMarquee.tsx`
- Section with heading "Integrates with the tools you already use"
- Horizontally scrolling strip using a pure-CSS marquee (`@keyframes` translateX -50% on a doubled list — no JS, no library)
- Pauses on hover
- Logos rendered as `<img>` with consistent `h-10` (≈40px), grayscale by default, full colour on hover, with adequate horizontal gap
- Edge fade masks (left/right gradient) so logos fade in/out instead of hard-clipping
- Responsive: same height on mobile, smooth scroll, no horizontal page overflow

**Edited:** `src/pages/Enterprise.tsx`
- Insert the new `<IntegrationsMarquee />` section between the "End-to-End Coverage" grid and the "Built for Your Business" section (logical placement: capabilities → integrations → custom build pitch)
- Background `bg-charcoal-dark` to alternate with neighbouring `bg-charcoal` sections

**Logos:**
- Stored as a typed array `{ name: string; src: string; href?: string }` inside the component for easy editing
- Initially scaffolded with placeholder paths; the user will provide actual image URLs (either hosted externally or to drop into `public/integrations/`)

### Tailwind animation
Add a `marquee` keyframe + utility to `tailwind.config.ts` (`translateX(0)` → `translateX(-50%)`, 30s linear infinite) so the section is self-contained and reusable elsewhere later.

### What I need from the user
1. Which integrations from the recommended list (or others) to include
2. The logo image URLs (or confirmation to use placeholders that you'll swap later)

