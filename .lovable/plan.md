

# Fix: Excavation for Retaining Wall Toe is ~20% Over

## Root Cause

The excavation calculation adds the toe width to the footing width and then multiplies the entire combined width by the **footing depth**. But the toe only extends to its own depth (`toe_depth`), which is shallower than the footing. This overcounts the excavation for the toe portion.

**Current (incorrect):**
```text
Excavation = Length x (FootingWidth + ToeWidth) x FootingDepth
                       ^^^^^^^^^^^^^^^^^^^^^^^^^
                       Full trench width at full footing depth
```

**Correct approach (matches concrete calculation):**
```text
Excavation = (Length x FootingWidth x FootingDepth)   -- main footing
           + (Length x ToeWidth x ToeDepth)            -- toe portion at its own depth
```

This matches exactly how the concrete volume is calculated in `scopes.ts`.

## Example (why it's ~20% over on the toe portion)

With footing_depth = 400mm, toe_depth = 330mm, toe_width = 200mm, footing_width = 600mm, length = 10m:

| | Current (wrong) | Fixed |
|---|---|---|
| Footing excavation | 10 x 0.8 x 0.4 = 3.20 m3 | 10 x 0.6 x 0.4 = 2.40 m3 |
| Toe excavation | (included above) | 10 x 0.2 x 0.33 = 0.66 m3 |
| **Total** | **3.20 m3** | **3.06 m3** |

The current method over-reports by 0.14 m3 (4.6% of total, but ~21% of the toe volume itself).

## Changes (1 file)

### ModularCalculator.tsx (lines 341-349)

Split the excavation into two separate calculations -- main footing volume and toe volume -- instead of combining widths:

**From:**
```typescript
excavationVolume = scopeAnswers.footings.reduce((sum, f) => {
  const length = ...;
  const footingWidth = Number(f.width) || 0;
  const hasToe = f.has_toe === true;
  const toeWidth = hasToe ? (Number(f.toe_width) || 0) : 0;
  const excavationWidthM = (footingWidth + toeWidth) / 1000;
  const depthM = (Number(f.depth) || 0) / 1000;
  return sum + length * excavationWidthM * depthM;
}, 0);
```

**To:**
```typescript
excavationVolume = scopeAnswers.footings.reduce((sum, f) => {
  const length = ...;
  const footingWidthM = (Number(f.width) || 0) / 1000;
  const footingDepthM = (Number(f.depth) || 0) / 1000;
  const mainVolume = length * footingWidthM * footingDepthM;

  const hasToe = f.has_toe === true;
  const toeWidthM = hasToe ? (Number(f.toe_width) || 0) / 1000 : 0;
  const toeDepthM = hasToe ? (Number(f.toe_depth) || 0) / 1000 : 0;
  const toeVolume = length * toeWidthM * toeDepthM;

  return sum + mainVolume + toeVolume;
}, 0);
```

The same pattern applies to the `excavationArea` calculation (lines 353-360) -- the toe area should use `toe_width` alone, not be combined with footing width at the same depth.

## Risk Assessment

Very low risk. This only affects the `retaining_wall_footings` scope when a toe is present. It corrects the excavation to match the concrete volume logic exactly, which is the expected behavior.

