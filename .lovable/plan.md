

# Fix Raft Slab Internal Beam Volume + Excavation Consistency

## Problem

Two issues affecting raft slab calculations:

1. **Excavation volume inflated by scalar fallbacks**: When no `edgeBeams` array exists, the excavation calculation falls back to scalar fields (`edge_beam_depth` default 450mm, `edge_beam_length` defaulting to full perimeter). This inflates the excavation volume even when no edge beams have been drawn. The concrete volume calculation does NOT have this fallback, creating a mismatch.

2. **Internal beams not merged from takeoff**: The `needsTakeoffMerge` condition checks for `areasNeedMerge` and `edgeBeamsNeedMerge`, but NOT `internalBeamsNeedMerge`. If internal beams are marked on plans after the estimate has already been saved with areas and edge beams, the internal beam data may not flow into the calculator.

## Changes

### 1. Fix excavation volume fallback (ModularCalculator.tsx, ~line 466)

Remove the scalar fallback path for edge beam excavation volume. Only calculate edge beam excavation from the `edgeBeams` array (same pattern as the concrete volume calculation). This prevents phantom excavation volume from default scalar values.

**Before:**
```
if (edgeBeams.length > 0) {
  // calculate from array
} else if (scopeAnswers.edge_beam_depth) {
  // FALLBACK: uses perimeter x default depth - WRONG
}
```

**After:**
```
if (edgeBeams.length > 0) {
  // calculate from array - only path
}
// No fallback - if no edgeBeams array, volume = 0
```

### 2. Add internalBeamsNeedMerge to takeoff merge logic (EstimateFormDialog.tsx, ~line 1571)

Add a check for internal beams needing merge, mirroring the existing `edgeBeamsNeedMerge` pattern.

**Before:**
```
const needsTakeoffMerge = !hasUserData || areasNeedMerge || edgeBeamsNeedMerge;
```

**After:**
```
const takeoffHasInternalBeams = raftSlabAreas.some(s => 
  s.internalBeams && s.internalBeams.length > 0 && 
  s.internalBeams.some(b => b.length > 0));
const savedInternalBeamsHaveLength = initialScopeAnswers.beams?.some((b: any) => 
  b.length > 0 && b._fromTakeoff === true);
const internalBeamsNeedMerge = takeoffHasInternalBeams && !savedInternalBeamsHaveLength;

const needsTakeoffMerge = !hasUserData || areasNeedMerge || edgeBeamsNeedMerge || internalBeamsNeedMerge;
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/estimates/calculators/ModularCalculator.tsx` | Remove scalar fallback for edge beam excavation volume (~line 466-473) |
| `src/components/estimates/EstimateFormDialog.tsx` | Add `internalBeamsNeedMerge` check to takeoff merge condition (~line 1563-1571) |

## Impact

- Excavation volume will only reflect beams that actually exist in the `edgeBeams`/`beams` arrays
- Internal beams marked on plans will always merge correctly into the calculator, even if areas and edge beams were already saved
- No database changes needed

