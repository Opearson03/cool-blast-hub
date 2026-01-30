
# Plan: Fix Waffle Pod Count Calculation

## Problem Analysis

The current waffle pod count calculation is significantly underestimating the number of pods required. For a 42m² slab, the user sees only 12 pods when there should be approximately 30-35.

### Root Cause

The pod grid estimation logic in `ModularCalculator.tsx` applies multiple conservative reductions that compound into a severe undercount:

```text
Input: 42m² slab area
Step 1: podFieldArea = 42 × 0.85 = 35.7m² (assumes 15% edge beams)
Step 2: Estimate dimensions as ~6.55m × 5.45m
Step 3: Subtract 0.9m edge beam allowance → inner field 5.65m × 4.55m
Step 4: Calculate grid: nx=4, ny=3 → 12 pods
```

This is wrong because:
1. The 85% pod field area multiplier is arbitrary and too aggressive
2. The edge beam width assumption (0.45m × 2) is hardcoded and may not match reality
3. The `floor()` operation on both dimensions compounds the error
4. This grid-derived value then drives `pods_x` and `pods_y`, which in turn affects reinforcement calculations

### Correct Approach

The pod count should be based on **area coverage**, not geometric grid estimation:

```text
Module pitch = pod_size + rib_width = 1090 + 110 = 1200mm = 1.2m
Module area = 1.2 × 1.2 = 1.44 m²
Pods required = ceil(slab_area / module_area) = ceil(42 / 1.44) = 30 pods
```

---

## Technical Changes

### 1. Update Pod Count Formula in ModularCalculator.tsx

Replace the flawed grid estimation with a direct area-based calculation:

| Current (incorrect) | Proposed (correct) |
|--------------------|--------------------|
| `podFieldArea = totalArea × 0.85` | Use full `totalArea` |
| Grid estimation → nx, ny | Area ÷ module area = pod count |
| `pods_x × pods_y = 12` | `ceil(42 / 1.44) = 30` |

The grid dimensions (nx, ny) should only be derived **after edge beams are marked** from the actual pod field geometry, not estimated from slab area.

### 2. Separate Pod Count from Grid Dimensions

**Pod Count** (for quantity ordering):
- Simple formula: `ceil(area / (moduleSize²))`
- Used for: material ordering, accessory calculations

**Grid Dimensions nx × ny** (for rib bar calculations):
- Derived from actual edge beam geometry when available
- Falls back to square root estimation when geometry unknown
- Used for: rib reinforcement length calculations

### 3. Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/ModularCalculator.tsx` | Fix auto-calculation logic for `pod_count`; decouple from nx/ny grid |

---

## Calculation Comparison

| Metric | Current (Flawed) | Proposed (Correct) |
|--------|-----------------|-------------------|
| 42m² slab area | 12 pods | 30 pods |
| Pod formula | `nx × ny` from estimated grid | `ceil(area / module²)` |
| Module size | 1.2m (correct) | 1.2m (correct) |
| Module area | 1.44m² | 1.44m² |
| Result | 4 × 3 = 12 | ceil(42/1.44) = 30 |

---

## Summary

The fix replaces the complex grid-estimation approach with a straightforward area-based pod count:

```
pods = ceil(slab_area / (module_pitch²))
     = ceil(42 / 1.44)
     = 30 pods
```

Grid dimensions (nx, ny) will still be calculated for rib bar reinforcement, but they won't override the pod count. This ensures accurate material quantities while preserving the geometric rib calculations for reinforcement.
