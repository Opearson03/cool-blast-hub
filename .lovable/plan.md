
# Plan: Fix Missing Horizontal & Vertical Bar Calculations in Reinforcement Module

## Problem Summary
When users add horizontal bars or vertical (starter) bars to edge beams or internal beams in a slab estimate, these bars are **not being included in the cost calculations**. The bars are correctly stored in the data structure but the calculation module ignores them.

## Root Cause
The `BeamReinforcementInput.tsx` UI component allows users to add:
- **Horizontal bars** (bars running along the beam length, positioned top or bottom)
- **Vertical bars** (starter bars projecting from the beam at regular centres)

These are stored in the `BeamConfig.horizontal_bars` and `BeamConfig.vertical_bars` arrays. However, the `reinforcement-raft.ts` module only processes:
- Trench mesh (tm_type, tm_layers)
- Ligatures (add_ligs, lig_size, lig_centres)
- Chairs

The horizontal and vertical bar arrays are never read or costed.

## Affected Scopes
All scopes using the `reinforcement-raft` module:
- Slab on Ground (standard_slab)
- Raft Slab (raft_slab)
- Waffle Pod (waffle_pod)
- Driveway
- Crossovers
- Paths & Surrounds

## Technical Solution

### File: `src/lib/estimate-components/modules/reinforcement-raft.ts`

Add processing for `horizontal_bars` and `vertical_bars` arrays for both edge beams and internal beams. The implementation will mirror the pattern already used in `reinforcement-footing.ts`.

**Changes:**

1. **Import `HorizontalBarConfig` and `VerticalBarConfig` types** from the types file

2. **Add horizontal bar calculation for edge beams** (inside the existing edge beam loop):
   - Iterate through `beam.horizontal_bars` array
   - For each bar config: calculate total length (beam length × bar quantity × lap allowance)
   - Aggregate bars by size and position (top/bottom)
   - Calculate weight using REBAR_WEIGHTS lookup
   - Create line items with proper pricing

3. **Add vertical bar calculation for edge beams** (inside the existing edge beam loop):
   - Iterate through `beam.vertical_bars` array
   - For each bar config: calculate count based on centres and beam length
   - Calculate weight (count × bar length × weight per metre)
   - Create line items with proper pricing

4. **Repeat the same for internal beams**

5. **Ensure all costs are added to the `subtotal`**

### Code Structure
The new code blocks will be inserted after the existing ligature calculations for each beam type:

```text
Edge Beams Section (existing):
  ├── Trench mesh calculation ✓
  ├── Ligatures calculation ✓
  ├── [NEW] Horizontal bars calculation
  └── [NEW] Vertical bars calculation

Internal Beams Section (existing):
  ├── Trench mesh calculation ✓
  ├── Ligatures calculation ✓
  ├── [NEW] Horizontal bars calculation
  └── [NEW] Vertical bars calculation
```

### Line Item IDs
To maintain consistency and allow aggregation in the cost breakdown:
- Edge beam horizontal bars: `edge_bar_{beam.id}_{barSize}_{position}`
- Edge beam vertical bars: `edge_vbar_{beam.id}_{barSize}`
- Internal beam horizontal bars: `internal_bar_{beam.id}_{barSize}_{position}`
- Internal beam vertical bars: `internal_vbar_{beam.id}_{barSize}`

---

## Technical Details

### Horizontal Bar Calculation Formula
For each bar in `horizontal_bars` array:
```
barLength = beamLength × barQuantity × lapPercent (1.125)
weight = barLength × REBAR_WEIGHTS[barSize]
cost = (weight / 1000) × pricePerTonne
```

### Vertical Bar Calculation Formula
For each bar in `vertical_bars` array:
```
barCount = ceil(beamLength × 1000 / centres)
barLengthM = barLength / 1000  // mm to m
totalLength = barCount × barLengthM
weight = totalLength × REBAR_WEIGHTS[barSize] × lapPercent
cost = (weight / 1000) × pricePerTonne
```

### Files to Modify
| File | Change |
|------|--------|
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Add horizontal and vertical bar processing for edge and internal beams |

### Testing Verification
After implementation:
1. Create/edit a Raft Slab or Driveway estimate
2. Add an edge beam with horizontal bars via the Reinforcement module
3. Verify the bars appear in the Cost Breakdown with correct quantities and pricing
4. Verify the bars are included in the module subtotal and grand total
5. Repeat for internal beams
6. Repeat for vertical (starter) bars
