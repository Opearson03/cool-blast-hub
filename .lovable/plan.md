
# Add "How It's Calculated" Volume Breakdown to All Concrete Scopes

## Problem

When the estimator shows the total concrete volume (e.g., in the Cost Summary), users see the final number but don't understand how it was derived. For slab scopes (Raft, SOG, Driveway, etc.), the beam volume uses "extra depth" (beam depth minus slab thickness) to avoid double-counting the overlap zone. This is correct mathematically, but confusing -- if a user mentally adds `slab volume + beam volume using full depth`, they get a higher number than what the calculator shows.

## Solution

Add a collapsible "How it's calculated" section to both the desktop `ModularCostSummary` and mobile `MobileCostSummaryBar` components, directly below the "Concrete Volume" line. When tapped/clicked, it expands to show a line-by-line breakdown of each volume component.

### Volume Breakdown Categories

Different scope types will show different breakdowns:

**Slab scopes with beams** (raft_slab, standard_slab, driveway, crossovers, paths_surrounds):
```
Slab Body:        100.0 m2 x 100mm  = 10.00 m3
Edge Beams:       40.0 m x 450mm x (450-100)mm = 6.30 m3
                  (extra depth only -- overlap with slab excluded)
Internal Beams:   20.0 m x 300mm x (400-100)mm = 1.80 m3
                  (extra depth only -- overlap with slab excluded)
----------------------------------------------
Total Volume:     18.10 m3
```

**Waffle Pod** (already has `wafflePodBreakdown` computed in ModularCalculator):
```
Topping Slab:     120.0 m2 x 85mm   = 10.20 m3
Pod Field (ribs): 80 pods x 0.2519 x 225mm = 4.53 m3
Edge Beams:       (full depth)       = 5.40 m3
Internal Beams:   (full depth)       = 1.20 m3
----------------------------------------------
Total Volume:     21.33 m3
```

**Piers:**
```
3x 450mm dia x 1000mm deep = 0.48 m3
5x 600mm dia x 1200mm deep = 1.70 m3
----------------------------------------------
Total Volume:     2.18 m3
```

**Strip Footings / Retaining Wall / Pad Footings:**
```
Section 1: 10.0m x 450mm x 300mm = 1.35 m3
Section 2: 8.0m x 600mm x 400mm  = 1.92 m3
----------------------------------------------
Total Volume:     3.27 m3
```

**Simple scopes** (suspended_slab, architectural):
```
100.0 m2 x 200mm = 20.00 m3
```

### UI Design

- A small "How it's calculated" button (text + chevron icon) appears directly below the volume display
- Clicking toggles a collapsible section with the breakdown rows
- Uses the existing Collapsible component from Radix UI
- Each row shows the component name, dimensions, and resulting volume
- For beam scopes, a small italic note explains "extra depth only" to address the confusion
- Styled with `text-xs` and `text-muted-foreground` to keep it compact and non-intrusive

## Implementation

### Step 1: Create a volume breakdown utility

Create `src/components/estimates/calculators/shared/VolumeBreakdown.tsx` containing:

- A `computeVolumeBreakdown` function that takes `scopeId`, `scopeAnswers`, and `derivedScopeAnswers` and returns an array of breakdown rows (label, dimensions string, volume in m3)
- The `VolumeBreakdown` React component that renders the collapsible breakdown UI

The function will mirror the logic already in `scopes.ts` `calculateVolume` but returns individual components instead of just the total. For waffle pod, it will reuse the existing `wafflePodBreakdown` object already computed in `ModularCalculator`.

### Step 2: Add VolumeBreakdown to ModularCostSummary

Pass `scopeId`, `scopeAnswers`, and `derivedScopeAnswers` as new props to `ModularCostSummary`. Render `VolumeBreakdown` below the existing volume line.

### Step 3: Add VolumeBreakdown to MobileCostSummaryBar

Same as Step 2 but for the mobile cost summary sheet.

### Step 4: Pass data from ModularCalculator

Update the `ModularCalculator` component to pass `scope.id`, `scopeAnswers`, and `derivedScopeAnswers` down to both summary components. The waffle pod breakdown is already computed (`wafflePodBreakdown` memo) and can be passed directly.

## Files Modified

| File | Change |
|------|--------|
| `src/components/estimates/calculators/shared/VolumeBreakdown.tsx` | New -- breakdown computation and collapsible UI component |
| `src/components/estimates/calculators/ModularCostSummary.tsx` | Add new props, render VolumeBreakdown below volume line |
| `src/components/estimates/calculators/MobileCostSummaryBar.tsx` | Add new props, render VolumeBreakdown below volume line |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Pass scopeId, scopeAnswers, derivedScopeAnswers to both summary components |

## Technical Notes

- No database changes required
- No new dependencies -- uses existing Collapsible from Radix UI
- The breakdown is purely a UI/display feature; it does not change any calculations
- The breakdown function mirrors `calculateVolume` logic from `scopes.ts` but decomposes it into labeled components. This is intentional duplication for display purposes -- the actual calculation remains the single source of truth in `scopes.ts`
- For beam scopes, the "extra depth" note clarifies that beam depth minus slab thickness is used, which is why slab volume + beam volume (at full depth) would be more than the total
