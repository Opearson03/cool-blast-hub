
# Fix Manual Input Focus Loss on Driveway Beams

## Problem Analysis

Manual inputs for driveway edge thickening/beams lose focus or don't work properly when editing dimensions (width, depth, length). This is caused by **React component remounting** due to unstable keys.

### Root Cause

In `MultiBeamTypeInput.tsx`, there's a fundamental key stability issue:

1. **Grouping uses full dimensions**: Line 55 groups beams by `${typeName}-${beam.width}-${beam.depth}` (e.g., `EB1-450-300`)

2. **React key uses only typeName**: Line 274 sets `const stableKey = group.typeName` (e.g., just `EB1`)

3. **The matching function uses stale references**: Lines 114-123 check:
   ```typescript
   if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth)
   ```
   This compares against the group's OLD dimensions, which can fail when the component re-renders mid-edit

### Why This Breaks Input

When a user types in a dimension field:
1. The `onChange` handler receives the new value
2. State updates and groups are recalculated with new dimensions
3. The matching logic may fail because it compares against stale group dimensions from the closure
4. The Input component loses its controlled value sync, causing erratic behavior

This is the same issue that was previously fixed in `MultiLinearTypeInput` and `FootingSectionReinforcementInput` using stable unique keys.

---

## Solution

Apply the same fix that works in `FootingSectionReinforcementInput`:

### 1. Add `groupKey` to BeamTypeGroup interface

Store the full grouping key (`typeName-width-depth`) in the group object itself, so the matching logic can use the segment-level data instead of the stale group-level reference.

### 2. Fix matching logic to use segment IDs directly

Instead of comparing dimensions against the group object (which may be stale), update all segments that belong to the group by their IDs:

```typescript
const updateGroupDimensions = (group: BeamTypeGroup, field: 'width' | 'depth', value: number) => {
  // Get IDs of all segments in this group
  const segmentIds = new Set(group.segments.map(s => s.id));
  
  const updatedBeams = beams.map(beam => {
    if (segmentIds.has(beam.id)) {
      return { ...beam, [field]: value };
    }
    return beam;
  });
  onChange(updatedBeams);
};
```

### 3. Apply same fix to `updateGroupTotalLength` and `deleteGroup`

Use segment IDs instead of dimension-based matching for all group operations.

---

## Technical Details

### File to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/MultiBeamTypeInput.tsx` | Fix matching logic to use segment IDs instead of stale dimension comparisons |

### Specific Changes

**1. Update `groupBeamsByType` function (lines 49-78)**
Add a `groupKey` property to track the full key:

```typescript
interface BeamTypeGroup {
  typeName: string;
  width: number;
  depth: number;
  segments: BeamConfig[];
  totalLength: number;
  totalVolume: number;
  groupKey: string;  // Add this
}
```

**2. Fix `updateGroupDimensions` (lines 114-123)**
Change from dimension-based matching to segment ID matching:

```typescript
const updateGroupDimensions = (group: BeamTypeGroup, field: 'width' | 'depth', value: number) => {
  const segmentIds = new Set(group.segments.map(s => s.id));
  const updatedBeams = beams.map(beam => 
    segmentIds.has(beam.id) ? { ...beam, [field]: value } : beam
  );
  onChange(updatedBeams);
};
```

**3. Fix `updateGroupTotalLength` (lines 125-157)**
Apply the same segment ID matching pattern.

**4. Fix `deleteGroup` (lines 159-165)**
Apply the same segment ID matching pattern.

---

## Why This Works

By using segment IDs instead of dimension comparisons:

1. **Segment IDs are stable**: They don't change when dimensions are edited
2. **No stale closures**: We don't rely on the group's dimensions matching the beams' dimensions
3. **Immediate updates**: Each keystroke correctly identifies which beams to update
4. **Consistent with other components**: Same pattern used in `FootingSectionReinforcementInput`

---

## Implementation Sequence

1. Update `BeamTypeGroup` interface to include `groupKey`
2. Update `groupBeamsByType` to set `groupKey` 
3. Refactor `updateGroupDimensions` to use segment IDs
4. Refactor `updateGroupTotalLength` to use segment IDs
5. Refactor `deleteGroup` to use segment IDs
6. Test with driveway, raft slab, and other beam-enabled scopes
