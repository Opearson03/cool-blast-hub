
# Fix: Include Retaining Wall Footing Toe Concrete Volume

## Problem Summary

The concrete volume calculation for retaining wall footings is missing the toe portion. When a user enables "Has Toe" and sets toe dimensions (width and depth), this additional concrete is not being included in the volume calculation - resulting in an underestimate of concrete requirements.

## Technical Root Cause

The toe is a horizontal projection at the base of a retaining wall footing (typically extending towards the retained soil). It has its own width and depth dimensions that run the full length of the footing. 

```text
                  ┌─────────────────┐
                  │   Main Footing  │
                  │   (width × depth)│
                  │                 │
  ┌───────────────┼─────────────────┤
  │     TOE       │                 │
  │ (toe_width ×  │                 │
  │  toe_depth)   │                 │
  └───────────────┴─────────────────┘
        ← toe →   ← main footing →
```

**Current Calculation:**
```typescript
volume = length × (width/1000) × (depth/1000)
```

**Required Calculation:**
```typescript
mainVolume = length × (width/1000) × (depth/1000)
toeVolume = has_toe ? length × (toe_width/1000) × (toe_depth/1000) : 0
totalVolume = mainVolume + toeVolume
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/MultiLinearTypeInput.tsx` | Add toe volume to `groupLinearByType` (line 82) and segment display (line 552) |
| `src/lib/estimate-components/scopes.ts` | Add toe volume to `RETAINING_WALL_FOOTINGS_SCOPE.calculateVolume` (line 1599-1603) |

---

## Implementation Details

### 1. Fix Volume in `groupLinearByType` Function

**File:** `src/components/estimates/calculators/MultiLinearTypeInput.tsx`

Update line 82:

```typescript
// Current (line 82):
const volume = length * (section.dimension1 / 1000) * (section.dimension2 / 1000);

// Fixed - include toe volume:
const mainVolume = length * (section.dimension1 / 1000) * (section.dimension2 / 1000);
const toeVolume = section.has_toe 
  ? length * ((section.toe_width || 0) / 1000) * ((section.toe_depth || 0) / 1000)
  : 0;
const volume = mainVolume + toeVolume;
```

### 2. Fix Volume in Segment Display

**File:** `src/components/estimates/calculators/MultiLinearTypeInput.tsx`

Update line 552:

```typescript
// Current (line 552):
const segmentVolume = segmentLength * (segment.dimension1 / 1000) * (segment.dimension2 / 1000);

// Fixed - include toe volume:
const mainVolume = segmentLength * (segment.dimension1 / 1000) * (segment.dimension2 / 1000);
const toeVolume = segment.has_toe 
  ? segmentLength * ((segment.toe_width || 0) / 1000) * ((segment.toe_depth || 0) / 1000)
  : 0;
const segmentVolume = mainVolume + toeVolume;
```

### 3. Fix Scope Volume Calculation

**File:** `src/lib/estimate-components/scopes.ts`

Update `RETAINING_WALL_FOOTINGS_SCOPE.calculateVolume` (lines 1595-1612):

```typescript
calculateVolume: (answers) => {
  const footings = answers.footings || [];
  if (footings.length > 0) {
    const volume = footings.reduce((sum: number, footing: any) => {
      const length = Number(footing.length) || 0;
      const widthM = (Number(footing.width) || 0) / 1000;
      const depthM = (Number(footing.depth) || 0) / 1000;
      
      // Main footing volume
      const mainVolume = length * widthM * depthM;
      
      // Toe volume (if has_toe is enabled)
      const hasToe = footing.has_toe === true;
      const toeWidthM = hasToe ? (Number(footing.toe_width) || 0) / 1000 : 0;
      const toeDepthM = hasToe ? (Number(footing.toe_depth) || 0) / 1000 : 0;
      const toeVolume = length * toeWidthM * toeDepthM;
      
      return sum + mainVolume + toeVolume;
    }, 0);
    return safeVolume(volume);
  }
  // Fallback to total_length with default dimensions
  const length = Number(answers.total_length) || 0;
  const widthM = 600 / 1000;
  const depthM = 400 / 1000;
  return safeVolume(length * widthM * depthM);
},
```

---

## Expected Behaviour After Fix

**Example:** Retaining wall footing with:
- Length: 10m
- Width: 600mm, Depth: 400mm
- Toe: 300mm wide × 300mm deep

**Before (incorrect):**
- Volume = 10 × 0.6 × 0.4 = **2.4 m³**

**After (correct):**
- Main = 10 × 0.6 × 0.4 = 2.4 m³
- Toe = 10 × 0.3 × 0.3 = 0.9 m³
- **Total = 3.3 m³**

The fix adds 37.5% more concrete in this example - a significant underestimation that was previously occurring.

---

## Testing Checklist

- Create a new estimate with retaining wall footings scope
- Add a footing section (e.g., RF1) with 10m length, 600mm width, 400mm depth
- Enable "Has Toe" with 300mm width and 300mm depth
- Verify the displayed volume shows approximately 3.3 m³ (not 2.4 m³)
- Check that the concrete supply module uses this corrected volume
- Verify excavation volume also includes the toe width (already handled in ModularCalculator lines 333-339)
