
# Remove Length Labels and Reduce Vertex Dot Sizes on Takeoff Canvas

## Summary

The takeoff drawing canvas currently displays length tags on polyline segments which creates visual clutter. Additionally, the vertex dots at each point on lines are too large. This plan addresses both issues by:
1. Removing the segment length labels from polyline previews and discrete internal beams
2. Reducing all vertex dot radii by 50%

---

## Changes Overview

### File: `src/components/estimates/takeoff/DrawingCanvas.tsx`

---

## Change 1: Remove Segment Length Labels from Polyline Preview

**Location:** Lines 531-555

Remove the entire segment length labels rendering block from `renderPolylinePreview()`:

```typescript
// DELETE this entire block (lines 531-555):
{/* Segment length labels */}
{segmentLengths.map((seg, index) => (
  <Group key={`seg-label-${index}`}>
    {/* Background for label */}
    <Rect ... />
    <Text ... />
  </Group>
))}
```

Also remove the now-unused `segmentLengths` calculation (lines 506-519) since it's no longer needed.

---

## Change 2: Remove Length Labels from Discrete Internal Beams

**Location:** Lines 744-765

Remove the length label Group from `renderDiscreteInternalBeams()`:

```typescript
// DELETE this entire block (lines 745-765):
{/* Length label at midpoint */}
<Group>
  <Rect ... />
  <Text ... />
</Group>
```

Also remove the `midX` and `midY` calculations (lines 714-715) since they're no longer needed.

---

## Change 3: Reduce Vertex Dot Radii by 50%

Update all vertex circle radii throughout the file:

| Location | Current Radius | New Radius |
|----------|---------------|------------|
| Polyline preview vertices (line 562) | `activeBeamType ? 7 : 6` | `activeBeamType ? 3.5 : 3` |
| Existing beam segment vertices (line 694) | `6` | `3` |
| Discrete internal beams start point (line 731) | `6` | `3` |
| Discrete internal beams end point (line 739) | `6` | `3` |
| Pending slab reference vertices (line 603) | `4` | `2` |
| Selected polygon vertices (line 881) | `6` | `3` |
| Selected rectangle corners (lines 928-931) | `6` | `3` |
| Selected polyline vertices (line 1027) | `6` | `3` |

**Note:** The polygon drawing preview vertices (lines 794-796) use touch-adaptive sizing for usability, so those should remain unchanged to maintain touch target sizes for closing polygons.

---

## What Stays Unchanged

- **Area labels on completed polygons/rectangles** (e.g., "45.2 m²") - These provide important information about completed markups
- **Calibration point labels** ("Point 1", "Point 2") - Essential for calibration workflow
- **Number labels on pier/pad points** - Needed for counting elements
- **Touch-adaptive first-point hit targets** - Needed for closing polygons on touch devices

---

## Testing Verification

After implementation:
1. Open a takeoff and add a polyline (linear scope like Strip Footings)
2. While drawing, verify NO length labels appear on segments
3. Complete the polyline and verify the saved markup has NO segment labels
4. Add internal beams and verify NO length labels appear
5. Verify all vertex dots are visibly smaller (50% reduction)
6. Confirm polygon closing still works (first point hit target unchanged)
