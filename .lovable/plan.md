

# Fix: Retaining Wall Toe Not Added to Concrete and Excavation

## The Problem

When you enable "Include Strip Footing" on a full retaining wall estimate and enter a toe length (e.g. 300mm), the toe volume is completely ignored in both the concrete supply and excavation calculations. The estimator calculates wall volume + footing volume but never adds the toe.

This means every retaining wall quote with a toe is under-quoting concrete and excavation.

## Root Cause

The `retaining_walls` scope (full retaining wall construction) has a `toe_length` input field that users can fill in, but the `calculateVolume` function never reads it. The toe volume formula should be:

```text
Toe Volume = Total Length x Toe Length x Footing Depth
```

This volume needs to be added in three places:

1. The scope's volume calculation (feeds concrete supply)
2. The excavation module's volume calculation (feeds excavation pricing)
3. The volume breakdown display (so users can see how it's calculated)

## The Fix

### 1. Add toe volume to `calculateVolume` in scopes.ts

In `RETAINING_WALLS_SCOPE.calculateVolume`, after calculating the footing volume, also calculate and add the toe volume using the existing `toe_length` answer field:

```typescript
// Current (missing toe):
footingVolume = totalLength * footingWidthM * footingDepthM;

// Fixed (includes toe):
footingVolume = totalLength * footingWidthM * footingDepthM;

// Toe volume
const toeLengthM = (Number(answers.toe_length) || 0) / 1000;
if (toeLengthM > 0) {
  toeVolume = totalLength * toeLengthM * footingDepthM;
}
```

This ensures `concrete_volume` (used by concrete-supply) includes the toe.

### 2. Add toe volume to excavation module

In `excavation.ts`, the m3-rate detailed excavation calculation reads linear sections but doesn't know about the global `toe_length` answer. For the `retaining_walls` scope, the excavation volume needs to include the toe volume from `scopeData`.

The simplest approach: pass `concrete_volume` (which will now include toe) as the excavation fallback for retaining walls. The excavation module already reads `scopeData.excavation_volume` first -- we just need to ensure the footing + toe volume is available there.

Since excavation for retaining walls should cover the footing trench (footing + toe combined width), the fix is to check `scopeData.toe_length` when calculating excavation volume from the retaining walls scope answers, adding it the same way the concrete calculation does.

### 3. Update VolumeBreakdown display

In `buildRetainingWallsBreakdown`, add a "Footing Toe" row when `toe_length > 0`:

```typescript
if (scopeAnswers.include_footing && toeLengthMM > 0) {
  const toeVol = totalLength * (toeLengthMM / 1000) * (footingDepthMM / 1000);
  rows.push({
    label: "Footing Toe",
    dimensions: `${totalLength.toFixed(1)}m x ${toeLengthMM}mm x ${footingDepthMM}mm`,
    volume: toeVol,
  });
}
```

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/estimate-components/scopes.ts` | Add toe volume calculation to `RETAINING_WALLS_SCOPE.calculateVolume` (lines 2323-2329) |
| `src/lib/estimate-components/modules/excavation.ts` | Add toe volume to the m3-rate excavation calculation for `retaining_walls` scope |
| `src/components/estimates/calculators/shared/VolumeBreakdown.tsx` | Add "Footing Toe" row to `buildRetainingWallsBreakdown` |

## What stays the same

- **Retaining Wall Footings** scope (standalone footings) -- already handles toe correctly via per-section `has_toe` fields
- Wall volume calculation -- unchanged
- Footing width/depth calculation -- unchanged
- Hourly-rate excavation -- unaffected (user enters hours manually)
- All other scope calculations -- untouched

## Risk Assessment

Low risk. These changes only add missing volume that should have been included. The `toe_length` field already exists in the UI and is already being collected from users -- it just wasn't being used in the calculations. No new fields, no schema changes, no downstream dependencies affected.
