
# Waffle Pod Calculation Fixes

## Overview

This plan addresses two calculation issues in the Waffle Pod estimator:

1. **Internal Rib Reinforcement Formula** - Currently uses `pods × 2.4`, should be `(pods × 2.4) - (perimeter / 2)`
2. **Concrete Volume Formula** - Currently only calculating edge beams correctly; the pod field concrete should use `pods × 0.2519 × pod_depth`

---

## Issue 1: Rib Reinforcement Formula Fix

### Current Behavior
The rib reinforcement length per layer is calculated as:
```
ribLengthPerLayerM = pods × 2.4
```

### Corrected Formula
```
ribLengthPerLayerM = (pods × 2.4) - (perimeter / 2)
```

This accounts for the fact that ribs don't run all the way to the edge - the perimeter is occupied by edge beams, so half the perimeter's worth of rib length should be deducted.

### Files to Update

| File | Change |
|------|--------|
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Update rib length formula in both multi-zone and legacy single-zone calculations |
| `src/components/estimates/calculators/WafflePodRibsInput.tsx` | Update the UI summary calculation to show the corrected formula |

---

## Issue 2: Concrete Volume Formula Fix

### Current Behavior
The pod field concrete volume uses a complex geometric subtraction:
```
V_pod_field = (podFieldArea × podThickness) - (pods × podSize³)
```

This approach calculates the gross volume minus the void created by pods, but it's producing incorrect results.

### Corrected Formula (Boss's Empirical Formula)
```
V_pod_ribs = pods × 0.2519 × pod_depth_in_metres
```

This is a simplified empirical formula that directly calculates the concrete volume in the rib grid based on pod count and pod depth.

The total waffle pod concrete volume becomes:
```
V_total = V_topping + V_pod_ribs + V_edge_beams + V_internal_beams
```

Where:
- `V_topping = total_area × topping_thickness` (unchanged)
- `V_pod_ribs = pods × 0.2519 × pod_depth` (new simplified formula)
- `V_edge_beams` and `V_internal_beams` remain calculated from beam dimensions

### Files to Update

| File | Change |
|------|--------|
| `src/lib/estimate-components/scopes.ts` | Update `WAFFLE_POD_SCOPE.calculateVolume()` to use new pod rib formula |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Update `wafflePodBreakdown` calculation for consistency |

---

## Technical Implementation Details

### 1. reinforcement-raft.ts (Lines ~370-500)

**Multi-zone calculation (line ~372):**
```typescript
// Current:
const ribLengthPerLayerM = zonePodCount * 2.4;

// Change to:
const zonePerimeter = Number(zone.perimeter) || 0;
const ribLengthPerLayerM = Math.max(0, (zonePodCount * 2.4) - (zonePerimeter / 2));
```

**Legacy single-zone calculation (line ~441):**
```typescript
// Current:
const ribLengthPerLayerM = podCount * 2.4;

// Change to:
const perimeter = Number(scopeData?.perimeter) || 0;
const ribLengthPerLayerM = Math.max(0, (podCount * 2.4) - (perimeter / 2));
```

### 2. WafflePodRibsInput.tsx (Line ~50)

```typescript
// Current:
const ribLengthPerLayer = podCount * 2.4;

// Change to:
const perimeter = numericWithDefault(scopeData?.perimeter, 0);
const ribLengthPerLayer = Math.max(0, (podCount * 2.4) - (perimeter / 2));
```

Also update the display text:
```typescript
// Current display:
({podCount} pods × 2.4m)

// New display:
({podCount} × 2.4 - {perimeter/2}m edge)
```

### 3. scopes.ts - WAFFLE_POD_SCOPE.calculateVolume()

**Multi-zone calculation (lines ~816-829):**
```typescript
// Replace pod field calculation with:
podZones.forEach((zone: any) => {
  const zoneArea = Number(zone.area) || 0;
  const topSlabM = (Number(zone.top_slab_thickness) || 85) / 1000;
  const podThicknessM = (Number(zone.pod_thickness) || 225) / 1000;
  const zonePodCount = Number(zone.pod_count) || 0;
  
  // Topping volume for this zone
  totalToppingVolume += zoneArea * topSlabM;
  
  // Pod rib volume using boss's formula: pods × 0.2519 × depth
  totalPodFieldVolume += zonePodCount * 0.2519 * podThicknessM;
});
```

**Legacy single-zone calculation (lines ~937-940):**
```typescript
// Replace:
const podFieldArea = Math.max(0, totalArea - edgeBeamFootprint - internalBeamFootprint);
const podVoidVolume = podCount * podSizeM * podSizeM * podThicknessM;
const V_pod_field = Math.max(0, (podFieldArea * podThicknessM) - podVoidVolume);

// With:
const V_pod_field = podCount * 0.2519 * podThicknessM;
```

### 4. ModularCalculator.tsx - wafflePodBreakdown (Lines ~515-518)

```typescript
// Replace:
const podVoidVolume = podCount * podSizeM * podSizeM * podThicknessM;
const V_pod_field = Math.max(0, (podFieldArea * podThicknessM) - podVoidVolume);

// With:
const V_pod_field = podCount * 0.2519 * podThicknessM;
```

---

## Summary of Formula Changes

| Calculation | Current | Corrected |
|-------------|---------|-----------|
| Rib reo length per layer | `pods × 2.4` | `(pods × 2.4) - (perimeter ÷ 2)` |
| Pod rib concrete | `(area × depth) - (pods × pod_size³)` | `pods × 0.2519 × pod_depth` |

---

## Testing Considerations

After implementation:
1. Create a new waffle pod estimate with a known pod count and perimeter
2. Verify the rib reinforcement shows the corrected length calculation
3. Verify the concrete volume properly includes the pod rib concrete (not just edge beams)
4. Compare totals against manual calculations using the boss's formulas
