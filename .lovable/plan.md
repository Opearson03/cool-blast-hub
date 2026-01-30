
# Plan: Allow Multiple Thicknesses for Different Area Measurements (Slab on Ground)

## Overview
Currently, the Slab on Ground scope uses a single shared thickness value for all areas. This change will allow users to specify different thickness values for each individual area measurement, which is important for projects where different slab sections have varying thickness requirements.

---

## What You'll Get
- Each area in the "Slab on Ground" scope can have its own thickness value
- Option to still use a shared thickness for all areas (default behavior preserved)
- Toggle switch to enable "per-area thickness" mode
- Accurate volume calculations based on individual area thicknesses
- Correct chair type suggestions per area based on their specific thickness

---

## Technical Implementation

### Step 1: Update Data Model
**File: `src/lib/estimate-components/types.ts`**

Add `thickness` property to the `MeasurementArea` interface:
- `thickness?: number` (mm) - optional per-area thickness
- When undefined, the area uses the shared scope-level thickness

### Step 2: Update MultiAreaInput Component
**File: `src/components/estimates/calculators/MultiAreaInput.tsx`**

Changes:
- Add a toggle: "Use different thicknesses per area"
- When toggled ON:
  - Hide the shared thickness input at the bottom
  - Show thickness input inside each area card
- When toggled OFF (default):
  - Show shared thickness (current behavior)
  - Per-area thickness values are ignored
- Pass per-area thickness mode state to parent via callback

### Step 3: Update Volume Calculation
**File: `src/lib/estimate-components/scopes.ts`**

Modify `STANDARD_SLAB_SCOPE.calculateVolume()`:
```text
Current: totalVolume = totalArea × singleThickness
New:     totalVolume = Σ(eachArea × eachThickness)
```

- If per-area thickness mode is enabled:
  - Calculate each area's volume using its own thickness
  - Sum all individual volumes
- If using shared thickness (default):
  - Use existing calculation (area × shared thickness)

### Step 4: Update Derived Scope Answers
**File: `src/components/estimates/calculators/ModularCalculator.tsx`**

Update `derivedScopeAnswers` to:
- Calculate effective thickness (weighted average when using per-area mode)
- Pass `usePerAreaThickness` flag and `areas` array to modules
- Ensure volume calculations flow through correctly

### Step 5: Update Reinforcement Module
**File: `src/lib/estimate-components/modules/reinforcement-raft.ts`**

The module already supports per-area reinforcement settings including chairs. Update chair type auto-selection to use:
- Per-area thickness when available
- Shared thickness as fallback

---

## User Experience

**Default Behavior (unchanged):**
- Single thickness input shown below all areas
- Label: "Thickness - shared across all areas"
- All areas use the same thickness value

**Per-Area Mode (new):**
- Toggle appears: "Different thickness per area"
- When enabled:
  - Shared thickness input hides
  - Each area card shows its own thickness field
  - Volume badge on each area shows individual volume (m³)

---

## Considerations

1. **Backward Compatibility**: Existing estimates without per-area thickness will continue working - they'll use the shared thickness value as before

2. **Takeoff Integration**: Areas from plan takeoff will still work - thickness can be manually set per area after import

3. **Reinforcement Accuracy**: Chair types will be suggested based on each area's actual thickness, ensuring correct cover is maintained

4. **Edge Thickening**: Beam volume calculations remain unchanged - they continue to use their own depth values independent of slab thickness

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/estimate-components/types.ts` | Add `thickness` to `MeasurementArea` |
| `src/components/estimates/calculators/MultiAreaInput.tsx` | Add per-area thickness toggle and inputs |
| `src/lib/estimate-components/scopes.ts` | Update `calculateVolume()` for standard_slab |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Update derived scope answers and state handling |
