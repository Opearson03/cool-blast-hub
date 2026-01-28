

# Plan: Add Internal Beam Volume to Waffle Pod Calculation

## Overview
This plan adds internal stiffening beam concrete volume to the Waffle Pod calculation using a geometric formula. The internal beams are separate from the empirical slab body calculation and are simply added to the total volume.

## Current State
The Waffle Pod `calculateVolume` function currently calculates:
1. **Slab Body**: `Area / Divisor` (empirical formula)
2. **Edge Beams**: `(Length × 0.15 × 0.15) + (Length × TotalHeight × 0.05)` (empirical formula)

**Missing**: Internal stiffening beams are not included in the volume calculation, even though the data structure exists (`answers.beams` array and legacy `internal_beams_length`/`internal_beam_width`/`internal_beam_depth` fields).

## Proposed Change
Add internal beam volume using the same geometric approach used by Raft Slab:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ INTERNAL BEAM VOLUME (Geometric)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ For each beam in answers.beams array:                                       │
│   → beamVolume = Length × Width × Depth                                     │
│                                                                             │
│ OR fallback to legacy single-value fields:                                  │
│   → internalBeamVolume = internal_beams_length × width × depth              │
│                                                                             │
│ Total = slabBodyVolume + edgeBeamVolume + internalBeamVolume                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Note: Unlike Raft Slab which subtracts slab thickness from beam depth (since beams are embedded in the slab), Waffle Pod internal beams occupy the full depth because they sit in the void space between pods.

---

## Technical Changes

### File: `src/lib/estimate-components/scopes.ts`

**Update the `calculateVolume` function in `WAFFLE_POD_SCOPE`** (lines 602-658):

Add internal beam calculation after edge beam volume:

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
  let divisor = 8.35;
  
  if (totalHeightMm >= 610) {
    divisor = 5.00;
  } else if (totalHeightMm <= 260) {
    divisor = 8.35;
  } else {
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
  const edgeBeamPartA = edgeBeamLength * 0.15 * 0.15;
  const edgeBeamPartB = edgeBeamLength * totalHeightM * 0.05;
  const edgeBeamVolume = edgeBeamPartA + edgeBeamPartB;
  
  // Step 3: Internal beam volume (geometric calculation)
  // Internal beams occupy full depth in the void space between pods
  const beams = answers.beams || [];
  let internalBeamVolume = 0;
  
  if (beams.length > 0) {
    // Calculate from beam configurations array
    internalBeamVolume = beams.reduce((sum: number, beam: any) => {
      const lengthM = Number(beam.length) || 0;
      const widthM = (Number(beam.width) || 110) / 1000; // Default 110mm for waffle pod
      const depthM = (Number(beam.depth) || totalHeightMm) / 1000; // Default to total slab height
      return sum + lengthM * widthM * depthM;
    }, 0);
  } else {
    // Fallback to legacy single-value fields
    const internalLength = Number(answers.internal_beams_length) || 0;
    const internalWidthM = (Number(answers.internal_beam_width) || 110) / 1000;
    const internalDepthM = (Number(answers.internal_beam_depth) || totalHeightMm) / 1000;
    internalBeamVolume = internalLength * internalWidthM * internalDepthM;
  }
  
  // Base volume (wastage applied in concrete-supply module at 10%)
  const baseVolume = slabBodyVolume + edgeBeamVolume + internalBeamVolume;
  
  return safeVolume(baseVolume);
},
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/estimate-components/scopes.ts` | Add internal beam geometric volume calculation to `WAFFLE_POD_SCOPE.calculateVolume` |

---

## Key Differences from Raft Slab

| Aspect | Raft Slab | Waffle Pod |
|--------|-----------|------------|
| Internal beam depth calculation | `depth - slabThickness` (beam embedded in slab) | Full `depth` (beam in void space) |
| Default beam width | 300mm | 110mm (per waffle pod spec) |
| Default beam depth | 400mm | Total slab height (pod + topping) |

---

## Calculation Example

For a 100m² waffle pod slab with:
- Pod thickness: 225mm, Top slab: 85mm → Total height: 310mm
- Perimeter (edge beam length): 40m
- Internal beams: 20m total @ 110mm wide × 310mm deep

**Volume Breakdown**:
```
Slab body = 100 ÷ 7.80 = 12.82 m³
Edge beam = (40 × 0.15 × 0.15) + (40 × 0.310 × 0.05) = 1.52 m³
Internal beams = 20 × 0.11 × 0.31 = 0.68 m³
Base volume = 12.82 + 1.52 + 0.68 = 15.02 m³
+ wastage 10% = 16.52 m³
```

---

## Testing Checklist

1. Create a waffle pod estimate with internal beams marked
2. Verify concrete volume includes internal beam contribution
3. Confirm internal beam volume uses geometric formula (Length × Width × Depth)
4. Test with legacy fields (manual entry without beam array)
5. Verify other slab types unchanged

