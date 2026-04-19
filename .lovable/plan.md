

## Replace dropdowns with inline segmented pills

The Radix `<Select>` dropdowns in the quoting tool are misbehaving (likely portal/z-index or focus issues inside the sticky 2-column layout), and they're slow to use in a live sales meeting anyway. I'll replace all of them with inline segmented pill buttons — one tap, no popover, no portal.

### Changes

**1. `ComplexityControls.tsx`** — replace both `<Select>`s with two segmented pill rows:
- Complexity: `Low ×1.0` · `Medium ×1.25` · `High ×1.5`
- Urgency: `Standard ×1.0` · `Fast-track ×1.2` · `Rush ×1.4`

**2. `IntegrationSelector.tsx`** — replace the per-row complexity `<Select>` (Simple / Moderate / Advanced + price) with a compact 3-button pill group that appears inline when the integration is checked. Keeps the price label on the right; wraps cleanly on narrow widths.

**3. `QuoteBuilder.tsx`** — replace the Confidence `<Select>` (Low / Medium / High) in section H with the same pill pattern for consistency.

### Pill component (shared, lightweight)

Small inline helper inside each section (no new shared file needed) using existing `Button` + `cn`:
- Selected: `bg-primary text-primary-foreground`
- Unselected: `bg-card border-border text-foreground hover:bg-muted`
- `h-9 px-3 text-xs font-medium rounded-md` — fits 3 across at 1067px viewport without overflow

### Why this fixes the issue
- No Radix Portal → no z-index/sticky-container conflicts
- One tap instead of click-open-click-select
- Selected option always visible (better for screen-sharing in a meeting)
- Touch-friendly for iPad

### Files touched
- `src/components/staff/quotes/sections/ComplexityControls.tsx`
- `src/components/staff/quotes/sections/IntegrationSelector.tsx`
- `src/components/staff/quotes/QuoteBuilder.tsx` (Confidence selector only)

No DB, no routing, no new dependencies.

