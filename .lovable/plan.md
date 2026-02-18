
## Pool Surround Cutout — Fix Area Subtraction, Visual Marking & Instructions

### What's Currently Broken / Missing

**1. The Slab Workflow Bug**
When `isCutoutMode` is true and the user finishes drawing a cutout polygon, `handleMarkupComplete` checks `SLAB_WITH_BEAMS_SCOPES.includes(activeScope)` — `pool_surround` IS in that list, so it incorrectly launches the multi-step slab beam dialog instead of going straight to save. The `isCutoutMode` flag is set but never consulted inside `handleMarkupComplete`.

**2. No Visual Distinction for Cutouts**
The `renderMarkups` function in `DrawingCanvas.tsx` renders all markups with the same scope color + opacity. A cutout looks identical to the primary area. Users can't see what's being subtracted.

**3. Checklist Shows Gross Area**
`ScopeMarkupChecklist` sums `area_sqm` for all non-parent markups for a scope. For pool_surround this will sum both the primary area AND the cutout area — showing an inflated number. It needs to show net (primary minus cutout) with a breakdown.

**4. No Ordering Instructions**
There is no on-canvas guidance telling the user:
- Step 1: Draw the pool perimeter first (the cutout — the hole)
- Step 2: Draw the concrete perimeter second (the outer area — the slab)

---

### Correct Order of Operations (UX Decision)

The user asked: "first mark perimeter of pool, then mark perimeter of concrete."

This means:
1. User clicks "Mark" on pool_surround scope → enters **cutout mode** (pool perimeter)
2. Draws pool boundary → saved as `markup_type: 'cutout'` (red, dashed)
3. System auto-prompts/transitions → enters **primary mode** (concrete perimeter)
4. Draws outer concrete area → saved as `markup_type: 'primary'` (scope color)
5. Net area = primary − cutout is displayed and used

The workflow reversal (cutout first, primary second) is more intuitive — you mark the thing you're NOT concreting first.

---

### Changes Required

**File 1: `src/components/estimates/takeoff/PlanTakeoffStep.tsx`**

*Fix A — Block slab workflow when in cutout mode:*
Inside `handleMarkupComplete`, before the `isSlabWithBeamsScope` branch, add:
```typescript
// Cutout mode bypasses the slab workflow — save directly
if (isCutoutMode) {
  setPendingMarkupData({ points, shapeType, scopeId: activeScope, fileId: currentFileId, pageNumber: currentPage });
  setPendingMarkupName('Pool cutout');
  setShowMarkupNameDialog(true);
  return;
}
```

*Fix B — Auto-flow: cutout-first, then primary:*
Change `onDrawCutout` callback in `ScopeMarkupChecklist` to instead start with cutout mode automatically when user clicks "Mark" for pool_surround scope. Modify `handleMarkArea` so that when `scopeId === 'pool_surround'`:
- If no markups exist yet → enter **cutout mode** first (isCutoutMode = true, pendingMarkupName = 'Pool cutout')
- If cutout exists but no primary → enter **primary mode** (normal polygon)
- If both exist → default to "Add More" primary areas

After confirming a cutout (`handleMarkupNameConfirm` when `isCutoutMode`), automatically transition to primary mode:
```typescript
if (isCutoutMode && scopeId === 'pool_surround') {
  // Auto-start drawing the primary concrete area
  setIsCutoutMode(false);
  setActiveScope('pool_surround');
  setActiveTool('polygon');
  setDrawingPoints([]);
  setPendingMarkupName('Concrete area 1');
}
```

*Fix C — Instructions banner:*
Add a `pool_surround` specific instruction banner above the drawing canvas (similar to the calibration mode indicator). Render it when `activeScope === 'pool_surround'`:
```tsx
{activeScope === 'pool_surround' && !isCutoutMode && (
  <div className="absolute bottom-4 ... bg-blue-500/10 border-blue-500/30">
    Step 2 of 2 — Draw the concrete perimeter (the outer slab area)
  </div>
)}
{activeScope === 'pool_surround' && isCutoutMode && (
  <div className="absolute bottom-4 ... bg-orange-500/10 border-orange-500/30">
    Step 1 of 2 — Draw the pool perimeter (the area to SUBTRACT)
  </div>
)}
```

*Fix D — Remove the separate "Draw Cutout" button flow:*
Since cutout is now automatically entered first, the `onDrawCutout` callback in `ScopeMarkupChecklist` is only needed for adding additional cutouts after the initial flow. Keep the "Draw Cutout" button but label it "Add Another Cutout" for clarity.

---

**File 2: `src/components/estimates/takeoff/DrawingCanvas.tsx`**

*Visual distinction for cutout markups:*
In `renderMarkups`, detect `markup.markup_type === 'cutout'` and render differently:
- Stroke: red (`#ef4444`) with dashed line pattern (`dash={[8, 4]}`)
- Fill: red at low opacity (~10%)
- Label: shows negative area in red: `−42.5 m²`
- No scope color used — always red to signal "this is removed"

```tsx
const isCutout = markup.markup_type === 'cutout';
const strokeColor = isCutout ? '#ef4444' : markup.color;
const fillColor = isCutout ? '#ef444420' : `${markup.color}${Math.round(fillOpacity * 255).toString(16).padStart(2, '0')}`;
// For the Line component:
<Line
  dash={isCutout ? [8, 4] : undefined}
  stroke={strokeColor}
  fill={fillColor}
  ...
/>
// Label shows "−42.5 m²" for cutout
text={isCutout ? `−${formatArea(markup.area_sqm)}` : formatArea(markup.area_sqm)}
fill={isCutout ? '#ef4444' : '#fff'}
```

---

**File 3: `src/components/estimates/takeoff/ScopeMarkupChecklist.tsx`**

*Fix area display for pool_surround:*
The `getScopeStatus` function sums all `area_sqm` for a scope. For `pool_surround`, split it:

```typescript
if (scopeId === 'pool_surround') {
  const primaryMarkups = scopeMarkups.filter(m => m.markup_type !== 'cutout');
  const cutoutMarkups = scopeMarkups.filter(m => m.markup_type === 'cutout');
  const primaryArea = primaryMarkups.reduce((sum, m) => sum + (m.area_sqm || 0), 0);
  const cutoutArea = cutoutMarkups.reduce((sum, m) => sum + (m.area_sqm || 0), 0);
  const netArea = Math.max(0, primaryArea - cutoutArea);
  // return net area
}
```

In the markup list within the scope card, show cutout markups with red dashed styling and a `−` prefix:
```tsx
{markup.markup_type === 'cutout' ? (
  <span className="text-red-500 font-mono text-[10px]">−{formatArea(markup.area_sqm)}</span>
) : (...)}
```

Also update the "marked" summary line from e.g. `1 area • 85.0 m²` to:
```
85.0 m² − 42.5 m² = 42.5 m² net
```

*Show cutout markups in the pool_surround markup list:*
The current `getScopeMarkups` filters to `!m.parent_markup_id`. Cutouts have no parent, so they already appear — but they're rendered the same as primary areas. Just add the visual distinction.

---

### Summary of Files to Change

| File | Changes |
|---|---|
| `PlanTakeoffStep.tsx` | Fix cutout bypass in `handleMarkupComplete`; auto-flow cutout→primary; instruction banner |
| `DrawingCanvas.tsx` | Render cutouts in red with dashed border + negative label |
| `ScopeMarkupChecklist.tsx` | Show net area breakdown; red styling for cutout entries |

No database changes needed. No new components needed.
