
# Feature: "Edge Beam = Full Perimeter" Quick Option

## Overview

Add a quick toggle/button in the slab naming dialog that allows users to instantly create an edge beam that matches the slab's perimeter without having to manually trace it. This speeds up the takeoff workflow significantly for common cases.

## User Flow

1. User marks a slab area (polygon or rectangle)
2. The **"Name This Slab"** dialog appears with slab stats (Area: X m², Perimeter: Y m)
3. **NEW:** Below the edge beam section, a toggle/button appears:
   - "Does the edge beam run the full perimeter?"
   - [Yes, Use Perimeter] / [No, I'll Mark It]
4. If user clicks **"Yes, Use Perimeter"**:
   - Skip the manual marking step
   - Go directly to **edge_beam_details** step with pre-filled length = perimeter
   - User only needs to enter beam name, width, and depth
5. If user clicks **"No, I'll Mark It"** or the existing "Add Edge Beam" button:
   - Continue with normal manual marking workflow

---

## Technical Changes

### 1. SlabBeamMarkupDialog.tsx

**Add new prop for the "use perimeter" action:**

```typescript
interface SlabBeamMarkupDialogProps {
  // ... existing props
  onUsePerimeterAsEdgeBeam?: () => void;  // NEW
}
```

**Update the 'name' step UI** to add a quick option section:

After the "Edge Beams" label and description, add:

```text
┌─────────────────────────────────────────────────────┐
│ Does the edge beam run the full perimeter?          │
│                                                     │
│  [Yes, Use Perimeter (X.Xm)]    [No, Mark Manually] │
└─────────────────────────────────────────────────────┘
```

The buttons:
- **"Yes, Use Perimeter (X.Xm)"**: Calls `onUsePerimeterAsEdgeBeam()`, displays the perimeter length for clarity
- **"No, Mark Manually"**: Calls the existing `onStartEdgeBeams()` 

**Move existing footer buttons** to this inline section for a cleaner flow, so the footer only shows Cancel/Skip.

### 2. PlanTakeoffStep.tsx

**Add new handler for perimeter-based edge beam:**

```typescript
const handleUsePerimeterAsEdgeBeam = useCallback(() => {
  if (!pendingSlabData || !currentScale) return;
  
  const { slabPoints, slabShapeType } = pendingSlabData;
  
  // Convert slab polygon to a closed polyline for the edge beam
  // For polygons: use all points, adding first point at end to close the loop
  // For rectangles: expand 2 corners into 4 corners + close
  let edgeBeamPoints: TakeoffPoint[];
  
  if (slabShapeType === 'polygon') {
    // Close the polygon by adding first point at end
    edgeBeamPoints = [...slabPoints, slabPoints[0]];
  } else {
    // Rectangle: expand corners [topLeft, bottomRight] to full rectangle path
    const [p1, p2] = slabPoints;
    edgeBeamPoints = [
      { x: p1.x, y: p1.y },  // top-left
      { x: p2.x, y: p1.y },  // top-right
      { x: p2.x, y: p2.y },  // bottom-right
      { x: p1.x, y: p2.y },  // bottom-left
      { x: p1.x, y: p1.y },  // close back to top-left
    ];
  }
  
  // Calculate perimeter length
  const perimeter = slabStats.perimeter; // Already calculated
  
  // Cache beam data
  setCachedBeamLength(perimeter);
  setCachedBeamSegments(/* calculate segments from edgeBeamPoints */);
  setCurrentBeamPoints(edgeBeamPoints);
  
  // Skip directly to edge_beam_details step
  setSlabWorkflowStep('edge_beam_details');
  setShowSlabBeamDialog(true);
}, [pendingSlabData, currentScale, slabStats]);
```

**Pass the new handler to the dialog:**

```tsx
<SlabBeamMarkupDialog
  // ... existing props
  onUsePerimeterAsEdgeBeam={handleUsePerimeterAsEdgeBeam}
/>
```

---

## UI Design (Updated 'name' Step)

```text
┌─────────────────────────────────────────────────────────┐
│ 🏷 Name This Slab                                      │
│ Give this slab a descriptive name, then add beams.     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Slab Name                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Slab 1                                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Area:        125.50 m²                              │ │
│ │ Perimeter:    45.20 m                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ Edge Beams                                              │
│ Raft slabs typically have thickened edge beams...      │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Does the edge beam run the full perimeter?          │ │
│ │                                                     │ │
│ │ ┌───────────────────────┐ ┌───────────────────────┐ │ │
│ │ │ ✓ Yes (45.2m)         │ │   No, Mark Manually   │ │ │
│ │ └───────────────────────┘ └───────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    [Cancel]     [Skip Beams]            │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx` | Add `onUsePerimeterAsEdgeBeam` prop, add "full perimeter" quick option UI in 'name' step |
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | Add `handleUsePerimeterAsEdgeBeam` handler, pass to dialog |

---

## Edge Cases Handled

1. **Rectangle slabs**: The 2-point rectangle is expanded to a 4-corner path before creating the polyline
2. **Polygon slabs**: The polygon points are used directly with the first point appended to close the loop
3. **Existing workflow preserved**: Users can still choose to manually mark edge beams for partial perimeters or complex shapes

---

## Benefits

1. **Speed**: Skip entire marking step for the most common case (full perimeter edge beams)
2. **Accuracy**: Uses exact slab geometry, no manual tracing errors
3. **Clear UX**: Simple Y/N choice right after naming the slab
4. **Non-breaking**: Existing "Mark Manually" workflow remains available
