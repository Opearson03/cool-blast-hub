
# Split-Screen View for Takeoff Dimension Dialogs

## Overview

Jay wants to see the building plan alongside dimension input dialogs on the takeoff screen. Currently, dialogs appear as overlays that completely obscure the plan. This change will convert these dialogs to a side panel that appears alongside the plan viewer when users need to enter dimensions.

## Current Architecture

The takeoff screen (`PlanTakeoffStep.tsx`) currently has:
- A plan viewer with drawing canvas (full width/height)
- Floating scope panel on the left
- Traditional Dialog components for dimension inputs that overlay the entire screen

**Dimension dialogs affected:**
- `PierDimensionsDialog` - for piers
- `BollardDimensionsDialog` - for bollards
- `PadFootingDimensionsDialog` - for pad footings/pit bases
- `LinearDimensionsDialog` - for strip footings, kerbs, retaining walls
- `JointDimensionsDialog` - for expansion/control joints
- `SlabBeamMarkupDialog` - for slab/beam naming and dimensions
- `EditBeamDialog` - for editing beam dimensions
- `MarkupNameDialog` - for naming polygon/rectangle markups

**Not affected (remains modal):**
- `CalibrationDialog` - this is configuration, not dimension entry during marking

## Solution: Resizable Split-Screen Layout

When any dimension dialog opens during active takeoff marking:
1. The layout switches from "full-width plan" to "plan + side panel"
2. The side panel contains the dimension input form
3. User can resize the split between plan and form
4. Plan remains visible and interactive (for reference only, not new drawing while dialog open)

## Technical Approach

### 1. Create New Split Panel Wrapper Component

**New file:** `src/components/estimates/takeoff/TakeoffSplitLayout.tsx`

```text
+-------------------------------------------+
|  Toolbar                                  |
+-------------------------------------------+
|                        |                  |
|                        |  Dimension       |
|   Plan Viewer          |  Input Panel     |
|   (resizable)          |  (resizable)     |
|                        |                  |
|                        |                  |
+-------------------------------------------+
|  Footer                                   |
+-------------------------------------------+
```

This component wraps the plan viewer and conditionally shows a right-side panel when dimension dialogs are active.

### 2. Convert Dialogs to Panel Content Components

For each affected dialog, extract the content (without the Dialog wrapper) into a reusable component:

| Dialog | Panel Component |
|--------|-----------------|
| `PierDimensionsDialog` | `PierDimensionsPanel` |
| `BollardDimensionsDialog` | `BollardDimensionsPanel` |
| `PadFootingDimensionsDialog` | `PadFootingDimensionsPanel` |
| `LinearDimensionsDialog` | `LinearDimensionsPanel` |
| `JointDimensionsDialog` | `JointDimensionsPanel` |
| `SlabBeamMarkupDialog` | `SlabBeamMarkupPanel` |
| `EditBeamDialog` | `EditBeamPanel` |
| `MarkupNameDialog` | `MarkupNamePanel` |

Each panel component exports both:
- The panel version (for split-screen on desktop/tablet)
- The original dialog version (fallback for very small screens)

### 3. Update PlanTakeoffStep Layout

Modify `PlanTakeoffStep.tsx` to:

1. Track which panel should be visible (derived from existing show* states)
2. Use `ResizablePanelGroup` from the existing `react-resizable-panels` library
3. Show the plan in the left panel (default 65% width)
4. Show the active dimension panel in the right panel (default 35% width)
5. Allow resizing with a draggable handle

### 4. Responsive Behavior

| Screen Size | Behavior |
|-------------|----------|
| Desktop (>1024px) | Split-screen with resizable panels |
| Tablet (768-1024px) | Split-screen with fixed 50/50 split |
| Mobile (<768px) | Traditional full-screen dialog overlay |

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/estimates/takeoff/TakeoffSplitLayout.tsx` | **Create** - New split layout wrapper |
| `src/components/estimates/takeoff/panels/PierDimensionsPanel.tsx` | **Create** - Panel version of pier dialog |
| `src/components/estimates/takeoff/panels/BollardDimensionsPanel.tsx` | **Create** - Panel version of bollard dialog |
| `src/components/estimates/takeoff/panels/PadFootingDimensionsPanel.tsx` | **Create** - Panel version of pad footing dialog |
| `src/components/estimates/takeoff/panels/LinearDimensionsPanel.tsx` | **Create** - Panel version of linear dialog |
| `src/components/estimates/takeoff/panels/JointDimensionsPanel.tsx` | **Create** - Panel version of joint dialog |
| `src/components/estimates/takeoff/panels/SlabBeamMarkupPanel.tsx` | **Create** - Panel version of slab/beam dialog |
| `src/components/estimates/takeoff/panels/EditBeamPanel.tsx` | **Create** - Panel version of edit beam dialog |
| `src/components/estimates/takeoff/panels/MarkupNamePanel.tsx` | **Create** - Panel version of markup name dialog |
| `src/components/estimates/takeoff/panels/index.ts` | **Create** - Barrel export |
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | **Modify** - Integrate split layout |

## Implementation Details

### TakeoffSplitLayout Component

```typescript
interface TakeoffSplitLayoutProps {
  children: React.ReactNode; // Plan viewer
  panelContent: React.ReactNode | null; // Active dimension panel
  panelTitle?: string;
  onPanelClose?: () => void;
}
```

Uses `react-resizable-panels` (already installed):
- `ResizablePanelGroup` with `direction="horizontal"`
- Left `ResizablePanel` for plan (min 40%, default 65%)
- `ResizableHandle` with grip indicator
- Right `ResizablePanel` for form (min 280px, default 35%)

### Panel Content Pattern

Each panel component follows this pattern:

```typescript
interface PanelContentProps {
  // Same props as dialog, minus open/onOpenChange
  onConfirm: (...) => void;
  onCancel: () => void;
  // ...specific props
}

export function XxxDimensionsPanel(props: PanelContentProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3>Title</h3>
        <p className="text-sm text-muted-foreground">Description</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Form content */}
      </div>
      <div className="p-4 border-t flex gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </div>
    </div>
  );
}
```

### Active Panel Detection

In `PlanTakeoffStep`, derive which panel to show:

```typescript
const activePanelType = useMemo(() => {
  if (showPierDimensions) return 'pier';
  if (showBollardDimensions) return 'bollard';
  if (showPadDimensions) return 'pad';
  if (showLinearDimensions) return 'linear';
  if (showJointDimensions) return 'joint';
  if (showSlabBeamDialog) return 'slab';
  if (editingBeam) return 'edit-beam';
  if (showAddBeamDimensionsDialog) return 'add-beam';
  if (showMarkupNameDialog) return 'markup-name';
  return null;
}, [showPierDimensions, showBollardDimensions, ...]);
```

## User Experience

1. User draws a pier group on the plan
2. User clicks "Done" in toolbar
3. **Instead of modal dialog**, the layout splits:
   - Plan shrinks to ~65% width on left
   - Pier dimensions panel appears on right (~35%)
   - User can still see their marked piers on the plan
   - User can resize the split by dragging the handle
4. User enters dimensions and clicks "Save Piers"
5. Panel closes, plan returns to full width

## Benefits

- Users can reference the plan while entering dimensions
- Reduces context-switching between dialog and plan
- Matches modern split-pane UI patterns (CAD software, etc.)
- Resizable to accommodate different preferences
- Mobile falls back to familiar modal pattern
