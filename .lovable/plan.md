
# Fix Beam Length Not Being Recorded in Edge Beam Details Dialog

## Problem Summary

When you draw an edge beam on the takeoff and click "Done", the "Edge Beam Details" dialog shows "0.00 m" for beam length instead of the actual measured length. The length should display correctly and carry through to the configure page.

## Root Cause

The issue is a timing problem in how data flows:

1. When you finish drawing and click "Done", the code calls `handleDoneMarkingSingleBeam`
2. This function copies the drawn points to `currentBeamPoints`
3. It then **immediately clears** `polylinePoints` 
4. But the `currentBeamLength` displayed in the dialog is calculated from `polylinePoints` - not from `currentBeamPoints`

Since `polylinePoints` is emptied before the dialog shows, the length calculation returns 0.

```text
Timeline of events:
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Done"                                          │
│    ↓                                                        │
│ polylinePoints = [point1, point2, point3...]  (has data)   │
│    ↓                                                        │
│ Copy to currentBeamPoints                                   │
│    ↓                                                        │
│ setPolylinePoints([])  ← CLEARED!                           │
│    ↓                                                        │
│ Dialog opens                                                │
│    ↓                                                        │
│ currentBeamLength = calculateFrom(polylinePoints)           │
│                    = calculateFrom([])                      │
│                    = 0  ← BUG!                              │
└─────────────────────────────────────────────────────────────┘
```

## Where This Issue Occurs

| Location | Affected | Why |
|----------|----------|-----|
| SlabBeamMarkupDialog - Edge Beam | YES | Uses `currentBeamLength` derived from cleared `polylinePoints` |
| SlabBeamMarkupDialog - Segments | YES | Uses `polylineSegments` derived from cleared `polylinePoints` |
| LinearDimensionsDialog | NO | Correctly caches `pendingPolylineLength` before clearing |
| EditBeamDialog (existing slabs) | NO | Correctly uses cached `pendingBeamLength` |

## Solution

Create a cached beam length value (similar to how linear scopes work) that gets set before clearing `polylinePoints`, and also cache the segments.

---

## Technical Changes

### File: `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

#### 1. Add new state for cached beam length and segments (near line 117)

```typescript
const [currentBeamPoints, setCurrentBeamPoints] = useState<TakeoffPoint[]>([]);

// ADD THESE TWO NEW STATE VARIABLES:
const [cachedBeamLength, setCachedBeamLength] = useState<number>(0);
const [cachedBeamSegments, setCachedBeamSegments] = useState<BeamSegment[]>([]);
```

#### 2. Update `handleDoneMarkingSingleBeam` to cache values before clearing (around line 492-500)

```typescript
const handleDoneMarkingSingleBeam = useCallback(() => {
  // For edge beams: use continuous polyline points
  if (slabWorkflowStep === 'mark_edge_beam' && polylinePoints.length >= 2 && currentScale) {
    // Calculate and cache the length BEFORE clearing polylinePoints
    const length = calculatePolylineLength(polylinePoints, currentScale);
    const segments = polylinePoints.slice(0, -1).map((point, i) => {
      const nextPoint = polylinePoints[i + 1];
      const pixelLength = Math.sqrt(
        Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
      );
      return {
        startPoint: point,
        endPoint: nextPoint,
        length: pixelLength / currentScale,
      };
    });
    
    setCachedBeamLength(length);
    setCachedBeamSegments(segments);
    setCurrentBeamPoints([...polylinePoints]);
    setPolylinePoints([]);  // Now safe to clear
    setSlabWorkflowStep('edge_beam_details');
    setShowSlabBeamDialog(true);
    setActiveTool('select');
    return;
  }
  // ... rest of function
}, [...dependencies, calculatePolylineLength]);
```

#### 3. Pass cached values to SlabBeamMarkupDialog (around line 1658-1660)

```typescript
currentBeamPoints={currentBeamPoints}
currentBeamLength={cachedBeamLength}        // Changed from currentBeamLength
currentBeamSegments={cachedBeamSegments}    // Changed from polylineSegments
```

#### 4. Reset cached values when starting new beam (in handleAddAnotherEdgeBeam, around line 600)

```typescript
const handleAddAnotherEdgeBeam = useCallback(() => {
  setShowSlabBeamDialog(false);
  setSlabWorkflowStep('mark_edge_beam');
  setPolylinePoints([]);
  setCachedBeamLength(0);      // ADD
  setCachedBeamSegments([]);   // ADD
  setActiveTool('polyline');
}, []);
```

#### 5. Also reset in workflow reset function (in resetSlabWorkflow)

Add to the reset:
```typescript
setCachedBeamLength(0);
setCachedBeamSegments([]);
```

---

## Testing Verification

After implementation:
1. Create a new estimate with Raft Slab scope
2. Upload a plan and calibrate
3. Draw the slab outline (polygon)
4. Name the slab and click "Next: Mark Edge Beams"
5. Draw an edge beam polyline on the plan
6. Click "Done" button
7. **Verify**: The "Edge Beam Details" dialog should show the correct beam length (e.g., "5.40 m") - NOT "0.00 m"
8. Enter type name (EB1), width, and depth
9. Click "Save Beam"
10. Navigate to Configure step
11. **Verify**: The beam length carries through correctly to the Edge Beams section

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | Add cached state variables, update handler to cache before clearing, pass cached values to dialog, reset in appropriate places |

