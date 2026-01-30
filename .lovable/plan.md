
# Plan: Geometric Volume Calculation with Grid Area Subdivision for Waffle Pods

## Overview

This plan implements a precise geometric volume calculation for Waffle Pod slabs, replacing the current empirical "area ÷ divisor" method. The implementation includes an automatic grid-based area estimation system that subdivides complex polygon shapes into cells for accurate area measurement.

---

## Current State Analysis

### Current Volume Calculation (in `scopes.ts`)
The existing `calculateVolume` function uses an industry divisor lookup table:
```text
V = Area ÷ Divisor + EdgeBeamVolume + InternalBeamVolume

Where:
- Divisor is interpolated from table based on total height (260mm→8.35, 310mm→7.80, etc.)
- Edge beam uses industry formula: Length × 0.15 × 0.15 + Length × TotalHeight × 0.05
```

### Problems with Current Approach
1. Divisor is empirical, not geometrically traceable
2. Edge beam formula is approximation, not based on actual dimensions
3. No visibility into volume breakdown components
4. Polygon area uses shoelace formula only (accurate for simple shapes but no validation for complex ones)

---

## Implementation Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    TAKEOFF (Polygon Points)                         │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GRID AREA ESTIMATOR                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  1. Compute bounding box                                    │    │
│  │  2. Divide into 500mm grid cells                            │    │
│  │  3. For each cell: 9-point sampling (point-in-polygon)      │    │
│  │  4. Sum: coverage_ratio × cell_area                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  Output: A_zone_m² (authoritative area)                             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                GEOMETRIC VOLUME CALCULATOR                          │
│  ┌────────────────────────────────────────┐                         │
│  │  V_topping = A_zone × t_top            │                         │
│  └────────────────────────────────────────┘                         │
│  ┌────────────────────────────────────────┐                         │
│  │  V_pod_field = (A_pod × pH) - V_void   │                         │
│  │  Where: A_pod = A_zone - beam_footprint│                         │
│  │         V_void = pods × pL × pW × pH   │                         │
│  └────────────────────────────────────────┘                         │
│  ┌────────────────────────────────────────┐                         │
│  │  V_edge = Σ(L×W×H) - corner_overlaps   │                         │
│  └────────────────────────────────────────┘                         │
│  ┌────────────────────────────────────────┐                         │
│  │  V_internal = Σ(L×W×H) - intersections │                         │
│  └────────────────────────────────────────┘                         │
│  Output: Volume breakdown object                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Grid Area Estimation Utility

### New File: `src/lib/takeoff/gridArea.ts`

Create a utility module for grid-based area estimation:

| Function | Description |
|----------|-------------|
| `pointInPolygon(point, polygon)` | Ray-casting algorithm for point-in-polygon test |
| `estimateAreaGrid(polygonPointsPx, metersPerPixel, cellSizeMm, samples)` | Main grid estimation function |
| `createAreaCache()` | Memoization utility for expensive calculations |

**Algorithm Details:**

1. **Bounding Box**: Calculate minX, maxX, minY, maxY from polygon vertices
2. **Grid Division**: Convert cellSize (500mm default) to pixels using scale
3. **Cell Iteration**: For each cell in the grid:
   - Generate 9 sample points (3×3 within cell at 1/6, 3/6, 5/6 positions)
   - Run point-in-polygon test on each sample
   - Calculate coverage_ratio = inside_count / 9
   - Add: coverage_ratio × (cellSizeM × cellSizeM)
4. **Return**: Total area in square meters

**Point-in-Polygon (Ray Casting)**:
```typescript
function pointInPolygon(x: number, y: number, polygon: TakeoffPoint[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
```

---

## Phase 2: Integrate Grid Area into Takeoff

### Modify: `src/types/takeoff.ts`

Add new function:
```typescript
export function calculatePolygonAreaGrid(
  points: TakeoffPoint[], 
  pixelsPerMeter: number,
  cellSizeMm?: number
): number;
```

### Modify: `src/hooks/useTakeoffData.ts`

When saving slab markups, calculate both:
- Shoelace area (for quick display/backwards compatibility)
- Grid area (stored as `grid_area_sqm` for volume calculations)

The grid calculation runs invisibly; users see the final area in m².

---

## Phase 3: Geometric Volume Formula for Waffle Pod

### Modify: `src/lib/estimate-components/scopes.ts`

Replace the `calculateVolume` function in `WAFFLE_POD_SCOPE`:

**New Calculation Steps:**

```text
INPUTS:
- A_zone_m²: Total slab area (from grid or stored area)
- perimeter_m: Slab perimeter
- t_top_m: Topping thickness (mm → m)
- pH_m: Pod height/thickness (mm → m)
- pL_m, pW_m: Pod dimensions (mm → m)
- g_m: Rib/gap width (mm → m)
- pod_count: Number of pods
- edgeBeams[]: {length_m, width_m}
- internalBeams[]: {length_m, width_m}

STEP 1: TOPPING VOLUME
V_topping = A_zone × t_top_m

STEP 2: BEAM FOOTPRINTS
A_edge_footprint = Σ(edge.length × edge.width) - corner_overlaps
  corner_overlaps = 4 × (avg_edge_width²)
  
A_internal_footprint = Σ(internal.length × internal.width) - edge_intersections
  edge_intersections = 2 per internal beam × (internal_width × edge_width)

STEP 3: POD FIELD VOLUME
A_pod_field = max(0, A_zone - A_edge_footprint - A_internal_footprint)
V_void = pod_count × pL × pW × pH
V_pod_field = (A_pod_field × pH) - V_void

STEP 4: EDGE BEAM VOLUME
totalHeight = t_top + pH
V_edge_raw = Σ(edge.length × edge.width × totalHeight)
V_edge_corner_overlap = 4 × (avg_width² × totalHeight)
V_edge = max(0, V_edge_raw - V_edge_corner_overlap)

STEP 5: INTERNAL BEAM VOLUME
V_internal_raw = Σ(internal.length × internal.width × totalHeight)
V_internal_edge_overlap = intersection_count × (int_width × edge_width × totalHeight)
V_internal = max(0, V_internal_raw - V_internal_edge_overlap)

STEP 6: TOTAL
V_total = V_topping + V_pod_field + V_edge + V_internal
```

**Return Value Enhancement:**
The function will return the volume number, but also populate `scopeAnswers.volumeBreakdown` for UI display:
```typescript
{
  topping_m3: number,
  podFieldNet_m3: number,
  voidVolume_m3: number,
  edgeBeams_m3: number,
  internalBeams_m3: number,
  podFieldArea_m2: number,
  total_m3: number
}
```

---

## Phase 4: Update WafflePodConfigCard

### Modify: `src/components/estimates/calculators/WafflePodConfigCard.tsx`

Add a "Volume Breakdown" collapsible section:

| Display Row | Value |
|-------------|-------|
| Topping slab | X.XX m³ |
| Pod field (net of voids) | X.XX m³ |
| Edge beams | X.XX m³ |
| Internal beams | X.XX m³ |
| **Total (pre-wastage)** | **X.XX m³** |

Include a subtle warning note:
```text
"Estimator only. Actual volumes may vary based on site conditions 
and engineering specifications."
```

**New Props:**
```typescript
interface WafflePodConfigCardProps {
  // ... existing props ...
  volumeBreakdown?: {
    topping_m3: number;
    podFieldNet_m3: number;
    voidVolume_m3: number;
    edgeBeams_m3: number;
    internalBeams_m3: number;
    total_m3: number;
  };
}
```

---

## Phase 5: Wire Up ModularCalculator

### Modify: `src/components/estimates/calculators/ModularCalculator.tsx`

1. **Pass volumeBreakdown to WafflePodConfigCard**: Extract from scopeData and pass as prop
2. **Calculate breakdown when scope changes**: Add effect to compute breakdown when waffle pod inputs change
3. **Store in scopeAnswers**: The breakdown becomes part of the estimate state for persistence

---

## Phase 6: Pod Count Estimation Fallback

When `pod_count` is not explicitly provided, estimate using:

```typescript
// Pod grid cell area (pod + half rib on each side)
const cellArea = (pL_m + g_m) * (pW_m + g_m);
const estimatedPodCount = Math.floor(A_pod_field / cellArea);
```

Add a "Pod count is estimated" badge in the UI when using this fallback.

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/takeoff/gridArea.ts` | Grid area estimation utility |

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/estimate-components/scopes.ts` | Replace WAFFLE_POD_SCOPE.calculateVolume with geometric formula |
| `src/types/takeoff.ts` | Add calculatePolygonAreaGrid function |
| `src/components/estimates/calculators/WafflePodConfigCard.tsx` | Add Volume Breakdown UI section |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Pass breakdown data to WafflePodConfigCard |

---

## Edge Cases and Fallbacks

| Scenario | Handling |
|----------|----------|
| No edge beams marked | Use perimeter with default 450mm width |
| No internal beams | V_internal = 0 |
| No pod count | Estimate from pod field area |
| Zero area | Return 0 for all volumes |
| Legacy data (no edgeBeams array) | Fall back to scalar fields |
| Non-calibrated page | Skip grid calculation, use stored area |

---

## Performance Considerations

1. **Grid calculation caching**: Hash polygon points + scale + cellSize for memoization
2. **Cell size of 500mm**: Balances accuracy vs performance (~400 cells for 100m² slab)
3. **Invisible to user**: Grid subdivision is internal; user sees only final area

---

## Validation During Implementation

During development, temporarily log both:
- Old divisor-based volume
- New geometric volume

This allows comparison and validation before removing the old method entirely.

---

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| Area calculation | Shoelace formula only | Grid subdivision with 9-point sampling |
| Volume formula | Empirical divisor | Geometric: topping + pod field - voids + beams |
| Edge beam volume | Approximation formula | Actual: L × W × H with overlap deductions |
| Internal beam volume | Simple L × W × H | L × W × H with intersection deductions |
| UI visibility | Total volume only | Full breakdown panel |
| Pod count | Required input | Optional (estimated if missing) |
