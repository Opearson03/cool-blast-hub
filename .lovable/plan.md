
# Multi-Zone Waffle Pod Support

## Overview

Adding support for multiple waffle pod zones within a single estimate, where each zone can have different pod specifications (e.g., 100m² of 225mm pods + 100m² of 300mm pods). This is more complex than per-area thickness in regular slabs because different pod depths require different:
- Pod types/sizes
- Rib reinforcement configurations
- Spacer and accessory quantities
- Volume calculations

---

## Data Architecture

### New Type: `WafflePodZone`

Each zone represents a distinct area with its own pod specifications:

```text
interface WafflePodZone {
  id: string;
  name: string;                    // e.g., "Zone A - Living Areas"
  
  // Geometry
  area: number;                    // m² (from takeoff or manual)
  perimeter: number;               // m (for edge calculations)
  _fromTakeoff?: boolean;
  _actualArea?: number;
  _actualPerimeter?: number;
  
  // Pod Specifications
  pod_size: string;                // '1050' | '1090' | '1110' (mm)
  pod_thickness: string;           // '225' | '275' | '325' | '375' (mm)
  top_slab_thickness: number;      // mm (default 85)
  rib_width: number;               // mm (default 110)
  
  // Derived/Calculated
  pod_count: number;               // Total pods in this zone
  
  // Rib Reinforcement (per zone)
  rib_bottom_bars?: number;
  rib_bottom_bar_size?: string;
  rib_top_bars?: number;
  rib_top_bar_size?: string;
  
  // Accessories (auto-derived from pod_count)
  spacer_4way_count?: number;
  spacer_2way_count?: number;
  pod_rail_packs?: number;
}
```

---

## UI Design

### Multi-Zone Pod Input Component

New component: `MultiWafflePodZoneInput.tsx`

```text
+----------------------------------------------------------+
| Waffle Pod Zones                    [+ Add Zone] [Expand]|
+----------------------------------------------------------+
| Summary: 2 zones • 200m² total • 180 pods                |
+----------------------------------------------------------+

+----------------------------------------------------------+
| [v] Zone A - Living Areas                    120m² | 108 |
|----------------------------------------------------------| 
|   Pod Size       Pod Depth     Topping     Rib Width     |
|   [1090mm v]     [225mm v]     [85 mm]     [110 mm]      |
|                                                          |
|   Pod Count      Total Height                            |
|   [108    ]      310mm                                   |
|                                                          |
|   Rib Reinforcement  [Configure...]                      |
|   Bottom: 2×N12  Top: 1×N12                              |
|                                                          |
|   [Duplicate]  [Remove]                                  |
+----------------------------------------------------------+

+----------------------------------------------------------+
| [>] Zone B - Garage                           80m² | 72  |
+----------------------------------------------------------+
```

### Key Features
- Each zone is collapsible with summary in header
- Pod specifications (size, depth, topping, rib width) per zone
- Pod count per zone (auto-derived or manual)
- Rib reinforcement configuration per zone
- Duplicate/remove actions
- Summary totals across all zones

---

## Calculation Changes

### Volume Calculation (scopes.ts)

The `calculateVolume` function will iterate over zones:

```text
Total Volume = Σ per zone:
  - V_topping = zone.area × (zone.top_slab_thickness / 1000)
  - V_pod_field = (zone.area × zone.pod_thickness/1000) - (zone.pod_count × pod_volume)
  
+ Edge Beams (shared across zones, based on total perimeter)
+ Internal Beams (if any)
```

### Pods Module (pods.ts)

Aggregate pod counts and accessories across zones:

```text
for each zone:
  - Pod supply: zone.pod_count × zone-specific price (if different sizes/depths have different prices)
  - Spacers: derived from zone.pod_count using standard formulas
  - Pod rails: zone.pod_count × 2 / 20 packs (if zone.top_slab_thickness >= 100)
```

### Reinforcement Module (reinforcement-raft.ts)

Rib bar calculations per zone:

```text
for each zone:
  - Rib length per layer = zone.pod_count × 2.4m
  - Bottom bars = rib_length × bottom_bars_per_rib × weight_per_m
  - Top bars = rib_length × top_bars_per_rib × weight_per_m
```

---

## Scope Data Structure Changes

### Current Structure
```text
scopeAnswers: {
  area: number,
  perimeter: number,
  pod_size: '1090',
  pod_thickness: '225',
  top_slab_thickness: 85,
  pod_count: 150,
  ...
}
```

### New Structure
```text
scopeAnswers: {
  // Aggregated totals (for backward compatibility and summary)
  area: number,           // Sum of all zones
  perimeter: number,      // Outer perimeter
  
  // Zone array
  podZones: WafflePodZone[],
  
  // Aggregated pod count (sum across zones)
  pod_count: number,
  
  // Global settings (shared)
  edgeBeams: BeamConfig[],
  beams: BeamConfig[],    // Internal beams
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/estimate-components/types.ts` | Add `WafflePodZone` interface |
| `src/lib/estimate-components/scopes.ts` | Update `WAFFLE_POD_SCOPE` questions, volume calculation |
| `src/components/estimates/calculators/MultiWafflePodZoneInput.tsx` | **New component** for multi-zone UI |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Render new zone input, update derived calculations |
| `src/lib/estimate-components/modules/pods.ts` | Calculate per-zone pod supply and accessories |
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Calculate per-zone rib reinforcement |
| `src/components/estimates/calculators/WafflePodConfigInput.tsx` | Deprecate or repurpose as single-zone editor |

---

## Migration/Backward Compatibility

Existing estimates with single-zone waffle pod data will be automatically migrated:

```text
if (!scopeAnswers.podZones && scopeAnswers.pod_count > 0) {
  // Create single zone from existing data
  scopeAnswers.podZones = [{
    id: 'zone-1',
    name: 'Zone 1',
    area: scopeAnswers.area,
    perimeter: scopeAnswers.perimeter,
    pod_size: scopeAnswers.pod_size,
    pod_thickness: scopeAnswers.pod_thickness,
    top_slab_thickness: scopeAnswers.top_slab_thickness,
    rib_width: scopeAnswers.rib_width,
    pod_count: scopeAnswers.pod_count,
    ...
  }];
}
```

---

## Takeoff Integration

When marking up waffle pod areas on plans:

1. **Current behavior**: Single slab area markup populates global pod config
2. **New behavior**: Each slab area markup can become a separate pod zone with its own specifications

The `SlabBeamMarkupDialog` will allow users to specify pod depth for each marked area, which automatically creates a zone with those specifications.

---

## Implementation Sequence

1. Add `WafflePodZone` type to `types.ts`
2. Create `MultiWafflePodZoneInput.tsx` component
3. Update `ModularCalculator.tsx` to render zone input for waffle pod scope
4. Update `WAFFLE_POD_SCOPE` in `scopes.ts` with zone-aware volume calculation
5. Update `pods.ts` module to calculate per-zone accessories
6. Update `reinforcement-raft.ts` module to calculate per-zone rib bars
7. Add backward compatibility migration for existing estimates
8. Test with multiple zones of different pod depths

---

## Technical Considerations

### Price Differentiation
Different pod sizes/depths may have different unit prices. The UI should allow:
- Global pod price (applies to all zones)
- Or per-zone price override (if pods vary in cost)

### Shared vs Per-Zone Elements
| Element | Scope |
|---------|-------|
| Pod specifications | Per zone |
| Rib reinforcement | Per zone |
| Pod count | Per zone |
| Spacers | Per zone |
| Edge beams | Shared (outer perimeter) |
| Internal beams | Shared |
| Topping mesh | Per zone (may vary with pod depth) |
| Concrete type | Shared |

### Summary Aggregations
The cost summary will show:
- Total pods across all zones
- Total pod cost (sum of per-zone costs)
- Rib reinforcement grouped by bar size (across zones)

