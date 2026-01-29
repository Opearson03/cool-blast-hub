
# Plan: Fix Volume Calculations for Driveway, Paths & Surrounds, and Slab on Ground

## Diagnosis

The volume calculators for these three scopes are not correctly reading from the beam configuration arrays, causing incorrect volume calculations.

### Root Cause

All three scopes support multiple edge beams (`supportsMultipleEdgeBeams: true`) and use the `MultiBeamTypeInput` component, which stores beam configurations in an `edgeBeams` array with individual `length`, `width`, and `depth` values per beam type.

However, the `calculateVolume` functions only read from the scalar fallback fields (`edge_beam_length`, `edge_beam_width`, `edge_beam_depth`) and don't iterate over the actual `edgeBeams` array to calculate per-beam volumes.

Additionally, Driveway and Standard Slab support internal thickening (`supportsMultipleBeams: true`) but their volume calculations completely ignore the `beams` array.

### Current Broken Logic

```
Driveway / Paths / Standard Slab:
├── Reads: edge_beam_length (scalar total)
├── Reads: edge_beam_width (single weighted average)
├── Reads: edge_beam_depth (single weighted average)
├── Problem: Uses averaged dimensions for ALL edge beams
└── Problem: Ignores internal beams entirely
```

### Correct Logic (from Raft Slab)

```
Raft Slab (working correctly):
├── Iterates: beams[] array
├── Calculates: per-beam volume with individual dimensions
└── Falls back: to scalar fields if array empty
```

---

## Solution

Update the `calculateVolume` function for each affected scope to:

1. Read from the `edgeBeams` array first, calculating volume per edge beam type with its individual dimensions
2. Read from the `beams` array for internal thickening (Driveway, Standard Slab)
3. Fall back to scalar fields for backwards compatibility

### File Changes

**File: `src/lib/estimate-components/scopes.ts`**

### Change 1: STANDARD_SLAB_SCOPE (Lines 198-214)

Update `calculateVolume` to:
- Iterate over `edgeBeams` array for edge thickening volume
- Iterate over `beams` array for internal thickening volume
- Fall back to scalar fields if arrays are empty

```text
Before:
  Main Slab + Edge Thickening (from scalars)

After:
  Main Slab + Edge Thickening (from edgeBeams array) + Internal Thickening (from beams array)
```

### Change 2: DRIVEWAY_SCOPE (Lines 805-822)

Update `calculateVolume` to:
- Iterate over `edgeBeams` array for edge thickening volume
- Iterate over `beams` array for internal thickening volume
- Fall back to scalar fields if arrays are empty

### Change 3: PATHS_SURROUNDS_SCOPE (Lines 1037-1054)

Update `calculateVolume` to:
- Iterate over `edgeBeams` array for edge thickening volume
- Fall back to scalar fields if array is empty
- (This scope does not support internal beams)

---

## Technical Details

### Updated Calculation Pattern

Each scope's `calculateVolume` will follow this pattern:

```typescript
calculateVolume: (answers) => {
  const area = Number(answers.area) || 0;
  const thicknessM = (Number(answers.thickness) || 100) / 1000;
  const perimeter = Number(answers.perimeter) || 0;

  // Main slab volume
  const slabVolume = area * thicknessM;

  // Edge thickening volume - calculate from edgeBeams array if available
  const edgeBeams = answers.edgeBeams || [];
  let edgeThickeningVolume = 0;

  if (edgeBeams.length > 0) {
    edgeThickeningVolume = edgeBeams.reduce((sum, beam) => {
      const lengthM = Number(beam.length) || 0;
      const widthM = (Number(beam.width) || 300) / 1000;
      const depthM = (Number(beam.depth) || 300) / 1000;
      const extraDepth = Math.max(0, depthM - thicknessM);
      return sum + lengthM * widthM * extraDepth;
    }, 0);
  } else {
    // Fallback to scalar fields
    const edgeBeamLength = Number(answers.edge_beam_length) || perimeter;
    const edgeBeamWidthM = (Number(answers.edge_beam_width) || 300) / 1000;
    const edgeBeamDepthM = (Number(answers.edge_beam_depth) || 300) / 1000;
    const extraEdgeDepth = Math.max(0, edgeBeamDepthM - thicknessM);
    edgeThickeningVolume = edgeBeamLength * edgeBeamWidthM * extraEdgeDepth;
  }

  // Internal thickening volume (for scopes that support it)
  const beams = answers.beams || [];
  let internalThickeningVolume = 0;

  if (beams.length > 0) {
    internalThickeningVolume = beams.reduce((sum, beam) => {
      const lengthM = Number(beam.length) || 0;
      const widthM = (Number(beam.width) || 300) / 1000;
      const depthM = (Number(beam.depth) || 300) / 1000;
      const extraDepth = Math.max(0, depthM - thicknessM);
      return sum + lengthM * widthM * extraDepth;
    }, 0);
  }

  return safeVolume(slabVolume + edgeThickeningVolume + internalThickeningVolume);
}
```

### Key Points

| Scope | Edge Beams | Internal Beams | Notes |
|-------|------------|----------------|-------|
| Standard Slab | Yes (edgeBeams[]) | Yes (beams[]) | Full support for both |
| Driveway | Yes (edgeBeams[]) | Yes (beams[]) | Full support for both |
| Paths & Surrounds | Yes (edgeBeams[]) | No | Only edge thickening |

---

## Testing Checklist

After implementation:

1. **Standard Slab (Slab on Ground)**
   - Create estimate with multiple edge thickening types (different depths)
   - Add internal thickening beams
   - Verify volume includes both correctly

2. **Driveway**
   - Create estimate with edge thickening
   - Add internal thickening beams
   - Verify volume calculation matches expected

3. **Paths & Surrounds**
   - Create estimate with edge thickening types
   - Verify volume calculation is correct

4. **Backwards Compatibility**
   - Existing estimates using scalar fields should still calculate correctly
