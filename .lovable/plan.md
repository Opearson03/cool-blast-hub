

# Fix: Joint Segments Connecting Into One Continuous Line

## Problem Identified

When the user marks multiple discrete joint lines (2 clicks = 1 line, 3rd click starts new line), they appear correctly **during drawing** as separate segments. However, when clicking "Done", all lines merge into one continuous path.

### Root Cause Analysis

```text
┌─────────────────────────────────────────────────────────────────┐
│  DURING DRAWING (Correct)                                       │
│                                                                 │
│  discreteJointSegments array:                                   │
│  [                                                              │
│    { startPoint: A, endPoint: B, length: 5 },                   │
│    { startPoint: C, endPoint: D, length: 3 },                   │
│    { startPoint: E, endPoint: F, length: 4 }                    │
│  ]                                                              │
│                                                                 │
│  Visual:  A────B   C────D   E────F  (3 separate lines)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  AFTER CLICKING "DONE" (Broken)                                 │
│                                                                 │
│  handleDoneMarkingJoints flattens segments:                     │
│  allPoints = [A, B, C, D, E, F]                                 │
│                                                                 │
│  Saved to database as single polyline markup                    │
│                                                                 │
│  DrawingCanvas renders with Konva Line:                         │
│  <Line points={[Ax,Ay, Bx,By, Cx,Cy, Dx,Dy, Ex,Ey, Fx,Fy]} />   │
│                                                                 │
│  Visual:  A────B────C────D────E────F  (one continuous line!)    │
│           └──────┬──────┘                                       │
│           Unwanted connections                                  │
└─────────────────────────────────────────────────────────────────┘
```

The `flatMap` in `handleDoneMarkingJoints` creates a flat array that Konva's `<Line>` component interprets as a single continuous path.

---

## Solution: Save Each Segment as a Separate Markup

The cleanest fix is to save **each discrete segment as its own database record** rather than combining them into one markup. This matches how the data should logically be stored and rendered.

### Why This Approach?
1. **Renders correctly** - Each segment is an independent `<Line>` in the canvas
2. **Easier to edit/delete** - User can select and delete individual segments
3. **Consistent with existing patterns** - Other discrete elements (piers, bollards) save as separate records
4. **No schema changes required** - Uses existing polyline markup type

---

## Technical Changes

### File: `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

**Modify `handleDoneMarkingJoints` (lines ~1182-1230):**

Instead of:
```typescript
const allPoints = finalSegments.flatMap(seg => [seg.startPoint, seg.endPoint]);
await addPolylineMarkup(currentFileId, activeScope, allPoints, totalLength, 0, 0, color, currentPage, jointName);
```

Change to:
```typescript
// Save each discrete segment as a separate markup
for (let i = 0; i < finalSegments.length; i++) {
  const segment = finalSegments[i];
  const segmentPoints = [segment.startPoint, segment.endPoint];
  const segmentName = `Joint ${existingJointCount + i + 1}`;
  
  await addPolylineMarkup(
    currentFileId, 
    activeScope, 
    segmentPoints,        // Only 2 points per segment
    segment.length,       // Individual segment length
    0,                    // widthMm = 0 for joints
    0,                    // heightMm = 0 for joints
    color, 
    currentPage, 
    segmentName
  );
}
```

**Update logic for callback:**
```typescript
// After saving all segments, call completion callback with TOTAL length
if (onJointMarkupComplete) {
  await onJointMarkupComplete(activeScope, totalLength);
}
```

---

### Also Update: Joint Confirm Handler (legacy path)

There's also a `handleJointConfirm` function that has similar logic. Update it to match:

**Lines ~1155-1179:**
```typescript
const handleJointConfirm = useCallback(async () => {
  if (!activeScope || !currentFileId || pendingPolylineLength === 0) return;
  
  const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
  const existingJointCount = markups.filter(m => m.scope_id === activeScope && m.shape_type === 'polyline').length;
  
  // Save each discrete segment as a separate markup
  for (let i = 0; i < discreteJointSegments.length; i++) {
    const segment = discreteJointSegments[i];
    const segmentPoints = [segment.startPoint, segment.endPoint];
    const segmentName = `Joint ${existingJointCount + i + 1}`;
    
    await addPolylineMarkup(
      currentFileId,
      activeScope,
      segmentPoints,
      segment.length,
      0,
      0,
      color,
      currentPage,
      segmentName
    );
  }
  
  // ... rest of reset logic
}, [...]);
```

---

## Expected Behavior After Fix

1. User clicks 2 points → segment A-B forms
2. User clicks 2 more points → segment C-D forms  
3. User clicks "Done"
4. **Two separate markup records** are saved:
   - Markup 1: `points: [A, B]`, `length_m: 5`
   - Markup 2: `points: [C, D]`, `length_m: 3`
5. Both render as **independent lines** on the canvas
6. Total length (8m) is passed to `onJointMarkupComplete` for the estimate calculator

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | Modify `handleDoneMarkingJoints` and `handleJointConfirm` to save each segment as a separate markup record |

---

## Test Plan

1. Create an estimate with expansion joints
2. Go to takeoff → activate joint marking
3. Draw 3 separate line segments (6 clicks total)
4. Click "Done"
5. Verify:
   - 3 separate lines appear on the plan (not connected)
   - Each line can be individually selected/deleted
   - Total length in the estimate calculator = sum of all 3 segments
6. Repeat for control joints/saw cuts

