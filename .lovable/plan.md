
# Plan: Allow Multiple Thicknesses for Different Area Measurements (Slab on Ground)

## Status: ✅ COMPLETED

## Overview
Implemented per-area thickness support for the Slab on Ground scope. Users can now specify different thickness values for each individual area measurement.

---

## What Was Implemented

- Each area in the "Slab on Ground" scope can have its own thickness value
- Toggle switch: "Different thickness per area" (only shown when 2+ areas exist)
- When enabled:
  - Shared thickness input hides
  - Each area card shows its own thickness field
  - Volume badge on each area shows individual volume (m³)
- Accurate volume calculations based on individual area thicknesses
- Backward compatible - existing estimates continue working with shared thickness

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/estimate-components/types.ts` | Added `thickness?: number` to `MeasurementArea` interface |
| `src/components/estimates/calculators/MultiAreaInput.tsx` | Added per-area thickness toggle, per-area thickness inputs in each card, and volume display |
| `src/lib/estimate-components/scopes.ts` | Updated `STANDARD_SLAB_SCOPE.calculateVolume()` to use per-area thickness when enabled |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Added `usePerAreaThickness` prop passing to MultiAreaInput |

---

## Technical Details

### Data Model
- Added `thickness?: number` (mm) to `MeasurementArea` interface
- When undefined, the area uses the shared scope-level thickness
- `usePerAreaThickness` boolean flag controls which mode is active

### Volume Calculation
```text
When usePerAreaThickness is true:
  totalVolume = Σ(area_i * thickness_i) + beamVolumes

When usePerAreaThickness is false (default):
  totalVolume = totalArea × sharedThickness + beamVolumes
```

### UI Changes
- Toggle appears below areas when 2+ areas exist
- Per-area mode shows thickness input and calculated volume in each area card
- Shared thickness input is hidden when per-area mode is active
