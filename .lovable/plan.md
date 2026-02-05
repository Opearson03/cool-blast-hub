# Change Joints Measurement to Discrete Point-Pair Mode (Like Internal Beams)

**STATUS: ✅ IMPLEMENTED**
**UI FIX: ✅ COMPLETE** - Added joint-specific toolbar mode with correct labels and Done button functionality.

## Current Behaviour
~~When measuring expansion joints, control joints, or cuts on plans:~~
~~- User clicks to add points continuously to a single polyline~~
~~- All points connect as one long chain~~
~~- User must click "Done" to complete~~

## New Behaviour (Implemented)
Use the same discrete point-pair mode as internal beams:
- Every **2 clicks** form one line segment
- The 3rd click **starts a new segment** (points reset automatically)
- All segments accumulate and their total length is summed
- User clicks "Done" when finished marking all segments

---

## Technical Approach

### 1. Add Discrete Joint Segments State
Add a new state variable (like `discreteInternalBeams`) specifically for joint segments:

```typescript
const [discreteJointSegments, setDiscreteJointSegments] = useState<
  Array<{ startPoint: TakeoffPoint; endPoint: TakeoffPoint; length: number }>
>([]);
```

### 2. Add Auto-Capture Effect for Joint Scopes
When in a joint scope and 2 polyline points exist, automatically:
1. Calculate the segment length
2. Add to `discreteJointSegments` array
3. Reset `polylinePoints` to allow next segment

```typescript
useEffect(() => {
  if (isJointScope && polylinePoints.length === 2 && currentScale) {
    const [start, end] = polylinePoints;
    const pixelLength = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    const lengthMeters = pixelLength / currentScale;
    
    setDiscreteJointSegments(prev => [...prev, {
      startPoint: start,
      endPoint: end,
      length: lengthMeters,
    }]);
    
    setPolylinePoints([]); // Reset for next segment
  }
}, [isJointScope, polylinePoints, currentScale]);
```

### 3. Update "Done" Handler for Joints
When clicking "Done", calculate total length from all discrete segments:

```typescript
const handleDoneMarkingPolyline = useCallback(() => {
  // ...existing slab beam handling...
  
  if (isJointScope && discreteJointSegments.length > 0) {
    const totalLength = discreteJointSegments.reduce((sum, seg) => sum + seg.length, 0);
    setPendingPolylineLength(totalLength);
    setPendingJointType(activeScope as 'expansion_joints' | 'control_joints');
    setShowJointDimensions(true);
    return;
  }
  
  // ...existing linear scope handling...
}, [/* deps */]);
```

### 4. Update Joint Confirm Handler
Store all discrete segments as the polyline points for the markup:

```typescript
const handleJointConfirm = useCallback(async () => {
  // Convert discrete segments back to points array for storage
  const allPoints = discreteJointSegments.flatMap(seg => [seg.startPoint, seg.endPoint]);
  // ...save with allPoints...
  setDiscreteJointSegments([]); // Clear after saving
}, [/* deps */]);
```

### 5. Update Undo Handler
Add support for undoing joint segments:

```typescript
// Undo discrete joint segment
if (activeTool === 'polyline' && isJointScope && discreteJointSegments.length > 0 && polylinePoints.length === 0) {
  setDiscreteJointSegments(prev => prev.slice(0, -1));
  return;
}
```

### 6. Pass Discrete Segments to DrawingCanvas
Update the DrawingCanvas component to visualize the completed joint segments:
- Add a new prop `discreteJointSegments` 
- Render each completed segment as a separate line

### 7. Update JointDimensionsPanel
Change `segmentCount` to show the number of discrete segments rather than continuous polyline points.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | Add `discreteJointSegments` state, auto-capture effect, update Done/Confirm/Undo handlers, pass segments to DrawingCanvas |
| `src/components/estimates/takeoff/DrawingCanvas.tsx` | Add `discreteJointSegments` prop, render completed joint segments visually |
| `src/components/estimates/takeoff/panels/JointDimensionsPanel.tsx` | Update segment count display |

---

## Expected Behaviour After Implementation

1. User activates expansion/control joint tool
2. User clicks **Point A** - dot appears
3. User clicks **Point B** - line segment is created, both points reset
4. User clicks **Point C** - new dot appears (starting fresh segment)
5. User clicks **Point D** - second line segment is created
6. User clicks "Done"
7. Panel shows: "2 line segments traced" with total length = segment1 + segment2
8. User confirms - all segments are saved

This matches the internal beam workflow behaviour exactly.
