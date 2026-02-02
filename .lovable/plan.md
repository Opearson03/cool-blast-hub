
# Fix Waffle Pod Duplicate Information and Hide Length x Width

## Problem Summary

For Waffle Pod slabs, users are seeing duplicate information because:
1. **MultiAreaInput** component is rendered (due to `supportsMultipleAreas: true` in scope definition)
2. **MultiWafflePodZoneInput** component is also rendered (hard-coded check for `scope.id === 'waffle_pod'`)

Both components display area, perimeter, and pod-related information, causing confusion.

Additionally, the user wants to hide the "Length × Width" display for waffle pod slab areas and only show the takeoff area (measured from plans).

---

## Solution

### Option A (Recommended): Hide MultiAreaInput for Waffle Pod Scope

Since `MultiWafflePodZoneInput` is the primary input component for waffle pod slabs and contains all necessary fields (area, perimeter, pod specs), we should hide the `MultiAreaInput` component specifically for waffle pod scope.

### Changes Required

| File | Change |
|------|--------|
| `src/components/estimates/calculators/ModularCalculator.tsx` | Add condition to hide `MultiAreaInput` when `scope.id === 'waffle_pod'` |

**Code Change (Line ~1250):**

Current:
```tsx
{scope.supportsMultipleAreas && (
  <MultiAreaInput
    ...
  />
)}
```

Updated:
```tsx
{scope.supportsMultipleAreas && scope.id !== 'waffle_pod' && (
  <MultiAreaInput
    ...
  />
)}
```

This single change:
- Removes the duplicate "Slab Area" section for waffle pod scopes
- Keeps `MultiWafflePodZoneInput` as the sole source of truth for area/perimeter/pod data
- Automatically hides the "Length × Width" fields since they only exist in `MultiAreaInput`

---

## Why This Approach

1. **Single Source of Truth**: `MultiWafflePodZoneInput` is specifically designed for waffle pod slabs with zone-based pod specifications, area, and perimeter fields
2. **No Breaking Changes**: Other scopes (Raft Slab, Standard Slab, Driveway, etc.) continue using `MultiAreaInput` as before
3. **Minimal Code Change**: Only one line modification required
4. **Matches User Intent**: The user explicitly stated "waffle pod zones and slab area contain duplicate information" - removing one fixes this

---

## Technical Details

The `MultiWafflePodZoneInput` component already provides:
- Zone-based area input (m²)
- Perimeter input (m)
- Pod size, depth, topping, rib width selectors
- Pod count input
- Aggregate calculations that update `scopeAnswers.area`, `scopeAnswers.perimeter`, and `scopeAnswers.pod_count`

These values flow correctly to volume calculations and all downstream modules, so removing `MultiAreaInput` will not break any calculations.
