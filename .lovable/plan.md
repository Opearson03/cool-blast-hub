

# Plan: Improve Takeoff Touch Support for iPad and Mobile Devices

## Problem Summary
When using the takeoff feature on an iPad, the touch interface doesn't recognize when a user tries to close an area (polygon). This is caused by several issues in the touch event handling:

1. **Missing touch event handlers on Stage** - The Konva Stage only uses `onClick` but is missing `onTap` for touch devices
2. **Polygon closing threshold too small** - The 15px distance to detect tapping near the first point is too small for finger taps (should be 30-40px for touch)
3. **PlanViewer lacks touch events** - The panning functionality only uses mouse events, not touch equivalents
4. **No touch-specific position tracking** - `currentMousePos` doesn't update on touch devices since there's no `onTouchMove` handler
5. **First point hit target too small** - The first point circle is only 8px radius, making it hard to tap accurately on touch

---

## Technical Implementation

### File 1: `src/components/estimates/takeoff/DrawingCanvas.tsx`

**Change 1: Add `onTap` handler to Stage**
Add `onTap` as an alias to `onClick` for touch device support:
```tsx
<Stage
  ...
  onClick={handleStageClick}
  onTap={handleStageClick}  // Add touch support
  ...
/>
```

**Change 2: Add touch move handler for position tracking**
Add `onTouchMove` to update cursor position on touch devices:
```tsx
const handleTouchMove = useCallback((e: KonvaEventObject<TouchEvent>) => {
  const stage = e.target.getStage();
  if (!stage) return;
  const pos = stage.getPointerPosition();
  if (!pos) return;
  setCurrentMousePos({ x: pos.x, y: pos.y });
}, []);
```

**Change 3: Increase polygon closing threshold for touch**
Detect touch devices and use a larger threshold (35px vs 15px):
```tsx
// In handleStageClick, around line 188-194
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const closeThreshold = isTouchDevice ? 35 : 15;

if (drawingPoints.length >= 3) {
  const firstPoint = drawingPoints[0];
  const distance = Math.sqrt(
    Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2)
  );
  
  if (distance < closeThreshold) {
    // Close polygon
    ...
  }
}
```

**Change 4: Increase first point visual hit target size for touch**
Make the first point circle larger when polygon can be closed (on touch devices):
```tsx
// In renderDrawingPreview, around line 776-784
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const firstPointRadius = (index === 0 && drawingPoints.length >= 3) 
  ? (isTouchDevice ? 18 : 8)  // Much larger on touch
  : (isTouchDevice ? 10 : 5);

<Circle
  ...
  radius={firstPointRadius}
  ...
/>
```

**Change 5: Add touch event handlers to Stage**
Add touch-specific handlers:
```tsx
<Stage
  ...
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleMouseUp}
  ...
/>
```

---

### File 2: `src/components/estimates/takeoff/PlanViewer.tsx`

**Change 1: Add touch event handlers for panning**
Add touch equivalents for the mouse-based pan handlers:
```tsx
const handleTouchStart = (e: React.TouchEvent) => {
  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  setDragStartPos({ x: touch.clientX, y: touch.clientY });
  setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!dragStartPos || e.touches.length !== 1) return;
  const touch = e.touches[0];
  
  const dx = Math.abs(touch.clientX - dragStartPos.x);
  const dy = Math.abs(touch.clientY - dragStartPos.y);
  
  if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
    setIsDragging(true);
    setIsPanning(true);
  }
  
  if (isPanning) {
    setPanOffset({
      x: touch.clientX - panStart.x,
      y: touch.clientY - panStart.y,
    });
  }
};

const handleTouchEnd = () => {
  setDragStartPos(null);
  setIsDragging(false);
  setIsPanning(false);
};
```

**Change 2: Add touch handlers to container div**
```tsx
<div
  ref={containerRef}
  className="..."
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  onWheel={handleWheel}
>
```

**Change 3: Prevent default on touch move when panning**
This prevents the page from scrolling while panning the plan:
```tsx
const handleTouchMove = (e: React.TouchEvent) => {
  if (isPanning) {
    e.preventDefault(); // Prevent page scroll during pan
  }
  // ... rest of handler
};
```

---

### File 3: `src/hooks/use-mobile.tsx` (Optional Enhancement)

**Add touch device detection hook**
Create a reusable hook for consistent touch detection:
```tsx
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }, []);
  
  return isTouch;
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/estimates/takeoff/DrawingCanvas.tsx` | Add `onTap` handler to Stage for touch tap events |
| `src/components/estimates/takeoff/DrawingCanvas.tsx` | Add `onTouchMove` handler to track touch position |
| `src/components/estimates/takeoff/DrawingCanvas.tsx` | Increase polygon close threshold to 35px on touch devices |
| `src/components/estimates/takeoff/DrawingCanvas.tsx` | Increase first point hit target size on touch devices (18px radius) |
| `src/components/estimates/takeoff/PlanViewer.tsx` | Add touch event handlers for panning (touchstart/move/end) |
| `src/components/estimates/takeoff/PlanViewer.tsx` | Prevent default scroll during touch pan |
| `src/hooks/use-mobile.tsx` | Add `useIsTouchDevice` hook for consistent detection |

---

## Expected Outcome

After these changes:
- Tapping on iPad will correctly register point placement
- Tapping near the first point (within 35px) will close the polygon
- The first point will have a larger, more visible hit target on touch devices
- Panning the plan will work smoothly on touch devices
- The preview line will update as users move their finger on the canvas

