
# Update Edge Beam & Thickening Chairs to Match Retaining Wall Pattern

## What's Changing

The chair selection for SOG edge beams/thickenings (and raft slab edge/internal beams) currently only offers a basic "TM Chairs" toggle with chairs-per-metre and a fixed $/25 price. The retaining wall footing module already has a proper chair type dropdown (TM Chair, 25-40mm, 50-65mm, 75-90mm, 100-120mm, 125-150mm) with dynamic bag sizing (25 for TM Chair, 100 for bar chairs).

This update brings the edge beam chairs in line with that pattern.

## Changes

### 1. UI -- BeamReinforcementInput.tsx

**Add chair type dropdown and dynamic bag size** to the "TM Chairs" section (currently lines 878-925):

- Add the `CHAIR_TYPE_OPTIONS` constant (already exists in `FootingSectionReinforcementInput.tsx`)
- Add helper functions: `getChairOption`, `getChairCatalogPrice`, `getChairBagSize` (same as footing file)
- Replace the current simple 2-column grid (Chairs/m + $/25) with:
  - A chair type dropdown (TM Chair, 25-40mm, 50-65mm, etc.)
  - Chairs/m input
  - Price per bag with dynamic label showing the bag size (e.g. $/bag(100) for bar chairs, $/bag(25) for TM Chair)
- When the chair type changes, auto-populate the price from the price map

### 2. Calculation -- reinforcement-raft.ts (edge beams, lines 612-670)

Update the edge beam chairs calculation to be chair-type aware:

- Read `beam.chair_type` (default 'TMCHAIR' for backward compatibility)
- Determine bag size: 25 for TMCHAIR, 100 for bar chairs
- Use the correct price lookup based on chair type
- Update the line item description to show the chair type and correct bag size

Apply the same change to internal beam chairs (lines 672-730).

### 3. Calculation -- reinforcement-slab.ts (SOG edge beams, lines 1049-1067)

This is the legacy SOG path that uses `answers.edge_tm_chairs`. Update similarly:

- Read `answers.edge_chair_type` (default 'TMCHAIR')
- Use dynamic bag size based on chair type
- Update description

## Summary

| File | Change |
|------|--------|
| `BeamReinforcementInput.tsx` | Add chair type dropdown + dynamic bag pricing (matching footing/retaining wall UI) |
| `reinforcement-raft.ts` | Edge beam + internal beam chairs: read chair_type, use correct bag size (25 or 100) |
| `reinforcement-slab.ts` | SOG edge beam chairs: same chair type awareness |

No database changes needed. The `BeamConfig` type already has `chair_type` defined.
