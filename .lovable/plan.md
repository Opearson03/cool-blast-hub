
## Goal
Fix the takeoff markup misalignment issue that occurs when the split-screen panel opens/closes. When the panel opens, the plan container shrinks and the markups become misaligned with the underlying plan image.

---

## Root Cause Analysis

The `PlanViewer` component applies a CSS transform with `transformOrigin: 'center'`:

```tsx
style={{
  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
  transformOrigin: 'center',  // ← This is the problem
  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
}}
```

When the split panel opens via `TakeoffSplitLayout`, the `PlanViewer` container width shrinks (from ~100% to ~65%). Since `transformOrigin: 'center'` is relative to the container's center:

1. Old center: Container width 800px → center at 400px
2. New center: Container width 520px → center at 260px
3. The transform recalculates from the new center point
4. Result: The plan shifts visually, but the `DrawingCanvas` (which is a child inside the same transform) stays aligned to the plan

**Wait** - if the canvas is inside the transform, they should move together... Let me re-examine.

Actually, looking more carefully at the structure:

```
<div className="relative" style={{ transform: ... }}>   ← Transform container
  <canvas ref={canvasRef} />                            ← The plan image
  <div className="absolute top-0 left-0">               ← Overlay container
    {children}                                          ← DrawingCanvas
  </div>
</div>
```

The `DrawingCanvas` IS inside the transform container, so the plan and markups should move together. The issue might be different...

Let me reconsider: The problem may be that when the container shrinks, the **flex centering** (`flex items-center justify-center`) causes the entire transform container to reposition within the smaller viewport.

The container has:
```tsx
className="aspect-[4/3] flex items-center justify-center overflow-hidden relative"
```

When the parent `ResizablePanel` shrinks, the flex container maintains `aspect-[4/3]` but centers its content. The transform + flex centering together can cause visual shifts.

---

## Solution

Change `transformOrigin` from `'center'` to `'top left'` (or `'0 0'`). This anchors the zoom/pan to the top-left corner of the plan, which:

1. Makes the plan position predictable regardless of container size changes
2. Removes dependency on container center calculation
3. Ensures markup coordinates (stored in plan-relative pixels) stay aligned

---

## Technical Changes

### File: `src/components/estimates/takeoff/PlanViewer.tsx`

**Line 357**: Change `transformOrigin: 'center'` to `transformOrigin: 'top left'`

```tsx
// Before
style={{
  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
  transformOrigin: 'center',
  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
}}

// After
style={{
  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
  transformOrigin: 'top left',
  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
}}
```

### Impact on Zoom Behavior

The zoom-to-cursor logic in `handleWheel` (lines 261-285) already calculates the pan offset correctly for any `transformOrigin`. The math adjusts the pan so the point under the cursor stays fixed:

```tsx
const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;
```

This logic works with any origin because it's based on relative position to the mouse, not the container center.

Similarly, pinch-to-zoom (lines 210-229) uses the same approach with `pinchCenter`.

---

## Alternative Consideration

If the flex centering is also contributing to the issue, we could also change the container alignment, but that would affect the visual presentation. The `transformOrigin` fix is more surgical and less likely to cause layout regressions.

---

## File to Change

- `src/components/estimates/takeoff/PlanViewer.tsx` (1 line change)
