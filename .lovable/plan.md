

# Plan: Implement Industry-Standard Waffle Pod Concrete Volume Calculation

## Overview
This plan replaces the current geometric volumetric calculation for Waffle Pod slabs with the industry-standard empirical formula. This change is **scoped exclusively to the Waffle Pod scope** and will not affect any other slab types.

## Current vs. Proposed Calculation

### Current Implementation (Geometric)
```
Volume = (Area × TotalThickness) - (PodCount × PodSize² × PodThickness) + EdgeBeamVolume + InternalBeamVolume
```
- Uses volumetric geometry to calculate concrete required

### Proposed Implementation (Industry Empirical)
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ WAFFLE POD CONCRETE VOLUME FORMULA                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Step 1: Slab Body Volume                                                    │
│   → Lookup divisor based on total slab height:                              │
│      260mm → 8.35                                                           │
│      310mm → 7.80                                                           │
│      385mm → 6.93                                                           │
│      460mm → 6.30                                                           │
│      610mm → 5.00                                                           │
│   → slabBodyVolume = Area ÷ divisor                                         │
│                                                                             │
│ Step 2: Edge Beam Volume                                                    │
│   → Part A: edgeBeamLength × 0.15 × 0.15                                    │
│   → Part B: edgeBeamLength × totalHeightM × 0.05                            │
│   → edgeBeamVolume = Part A + Part B                                        │
│                                                                             │
│ Step 3: Base Volume                                                         │
│   → baseVolume = slabBodyVolume + edgeBeamVolume                            │
│   → Wastage (10%) applied separately in concrete-supply module              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Industry Height-to-Divisor Mapping

| Pod Thickness | Top Slab | Total Height | Divisor |
|--------------|----------|--------------|---------|
| 225mm        | 35mm     | 260mm        | 8.35    |
| 225mm        | 85mm     | 310mm        | 7.80    |
| 275mm        | 110mm    | 385mm        | 6.93    |
| 325mm        | 135mm    | 460mm        | 6.30    |
| 375mm        | 235mm    | 610mm        | 5.00    |

For heights between these values, the formula will use linear interpolation to calculate the appropriate divisor.

---

## Technical Changes

### File: `src/lib/estimate-components/scopes.ts`

**Replace the `calculateVolume` function in `WAFFLE_POD_SCOPE`**:

```typescript
calculateVolume: (answers) => {
  const area = Number(answers.area) || 0;
  const podThicknessM = (Number(answers.pod_thickness) || 225) / 1000;
  const topSlabM = (Number(answers.top_slab_thickness) || 85) / 1000;
  const perimeter = Number(answers.perimeter) || 0;
  
  // Total slab height in mm for divisor lookup
  const totalHeightMm = (podThicknessM + topSlabM) * 1000;
  const totalHeightM = podThicknessM + topSlabM;
  
  // Edge beam length (defaults to perimeter if not specified)
  const edgeBeamLength = Number(answers.edge_beam_length) || perimeter;
  
  // Industry divisor lookup based on total slab height
  const divisorTable = [
    { height: 260, divisor: 8.35 },
    { height: 310, divisor: 7.80 },
    { height: 385, divisor: 6.93 },
    { height: 460, divisor: 6.30 },
    { height: 610, divisor: 5.00 },
  ];
  
  // Find appropriate divisor with interpolation
  let divisor = 8.35; // Default for heights ≤ 260mm
  
  if (totalHeightMm >= 610) {
    divisor = 5.00;
  } else if (totalHeightMm <= 260) {
    divisor = 8.35;
  } else {
    // Linear interpolation between known points
    for (let i = 0; i < divisorTable.length - 1; i++) {
      const lower = divisorTable[i];
      const upper = divisorTable[i + 1];
      if (totalHeightMm >= lower.height && totalHeightMm <= upper.height) {
        const ratio = (totalHeightMm - lower.height) / (upper.height - lower.height);
        divisor = lower.divisor - ratio * (lower.divisor - upper.divisor);
        break;
      }
    }
  }
  
  // Step 1: Slab body volume using industry divisor
  const slabBodyVolume = area / divisor;
  
  // Step 2: Edge beam volume (industry formula)
  // Part A: Length × 0.15m × 0.15m (150mm × 150mm base contribution)
  const edgeBeamPartA = edgeBeamLength * 0.15 * 0.15;
  // Part B: Length × TotalHeight × 0.05m (50mm additional width)
  const edgeBeamPartB = edgeBeamLength * totalHeightM * 0.05;
  const edgeBeamVolume = edgeBeamPartA + edgeBeamPartB;
  
  // Base volume (wastage applied in concrete-supply module at 10%)
  const baseVolume = slabBodyVolume + edgeBeamVolume;
  
  return safeVolume(baseVolume);
},
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/estimate-components/scopes.ts` | Replace `calculateVolume` in `WAFFLE_POD_SCOPE` with industry empirical formula |

**Note**: No changes to `concrete-supply.ts` - wastage remains at 10% for all scopes including waffle pod.

---

## Calculation Example

For a 100m² waffle pod slab with:
- Pod thickness: 225mm
- Top slab: 85mm → Total height: 310mm
- Perimeter (edge beam length): 40m

**Industry Formula**:
```
Slab body = 100 ÷ 7.80 = 12.82 m³
Edge beam = (40 × 0.15 × 0.15) + (40 × 0.310 × 0.05)
          = 0.9 + 0.62 = 1.52 m³
Base volume = 12.82 + 1.52 = 14.34 m³
+ wastage 10% = 15.77 m³
```

---

## Scope of Change

- **Only affects**: Waffle Pod (`waffle_pod`) scope
- **Does NOT affect**: Raft Slab, Driveway, Slab on Ground, Crossovers, Paths, or any other scope
- **Wastage**: Remains at 10% for all scopes (no change)

---

## Testing Checklist

After implementation, verify:
1. Create a waffle pod estimate with 100m² area, 310mm total height (225mm pod + 85mm top)
2. Confirm volume calculation matches industry formula (~14.3 m³ before wastage)
3. Verify wastage shows as 10% in concrete supply module
4. Check that other slab types still calculate volume using their existing formulas
5. Confirm BOQ generates correct concrete quantities

