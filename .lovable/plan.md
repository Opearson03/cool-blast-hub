
# Split-Screen Plan Viewer for Takeoff

## The Problem

When users are in the "Configure" step entering dimensions (footing widths, depths, slab thickness, etc.), dimension dialogs popup and completely block the plan viewer. Users cannot reference the plans to answer questions that appear in these dialogs - this is the biggest usability issue reported.

**Current Flow:**
1. User marks areas/footings on plans in "Takeoff" step
2. User moves to "Configure" step (plans hidden)
3. Dialogs pop up asking for dimensions (LinearDimensionsDialog, PierDimensionsDialog, etc.)
4. User has no way to see plans to answer dimension questions

---

## Proposed Solution: Split-Screen Configure Mode

Replace the single-panel "Configure" step with a **resizable split-screen layout** that shows the plan viewer alongside the calculator inputs. This allows users to reference marked areas while entering dimensions.

```text
+--------------------------------------------------+
|  [Plan Viewer - 50%]    |  [Calculator - 50%]    |
|                         |                        |
|  Shows the marked up    |  - Module accordions   |
|  plans with all scope   |  - Dimension inputs    |
|  markups visible        |  - Cost summary        |
|                         |                        |
|  User can zoom/pan      |  Scrollable content    |
|  to reference dims      |                        |
|                         |                        |
+--------------------------------------------------+
          <--- Resizable handle --->
```

### Key Features

1. **Persistent Plan Reference**: Plans stay visible in the left panel while entering data in the right panel
2. **Resizable Panels**: Users can drag the divider to adjust the split (e.g., 60/40, 70/30)
3. **Collapsible Plan Panel**: Button to hide plans entirely if user wants full-width calculator
4. **Mobile Fallback**: On mobile devices, use a slide-up sheet or toggle between views (plans can't fit side-by-side)

---

## Implementation Plan

### 1. Create Split-Screen Layout Component

**New File:** `src/components/estimates/SplitScreenLayout.tsx`

A reusable wrapper that combines:
- `ResizablePanelGroup` with horizontal direction
- Left panel: Plan viewer (read-only mode, no drawing)
- Right panel: Children content (calculator)
- Toggle button to show/hide plan panel
- Persist panel sizes in localStorage

### 2. Create Read-Only Plan Viewer

**New File:** `src/components/estimates/takeoff/PlanPreviewPanel.tsx`

A simplified, read-only version of PlanViewer that:
- Shows current plans with all markups overlaid
- Supports zoom/pan for reference
- Highlights the currently active scope's markups
- No drawing tools or calibration controls
- Lighter weight than full takeoff component

### 3. Update Configure Step in EstimateFormDialog

**File:** `src/components/estimates/EstimateFormDialog.tsx`

Wrap the configure step content with SplitScreenLayout:
- Pass the plan files and markups to the preview panel
- Active scope highlighting syncs with calculator accordion
- Maintain all existing calculator functionality in the right panel

### 4. Mobile-Responsive Handling

For screens < 768px wide:
- Default to calculator-only view
- Add floating "View Plans" button that opens a bottom sheet with the plan viewer
- Sheet can be dismissed to return to calculator

---

## Technical Details

### Panel State Management

```typescript
interface SplitScreenLayoutProps {
  estimateId: string | null;
  businessId: string | null;
  activeScope?: string | null;
  showPlanPanel?: boolean;
  onTogglePlanPanel?: () => void;
  children: React.ReactNode;
}
```

### File Changes Summary

| File | Change |
|------|--------|
| `src/components/estimates/SplitScreenLayout.tsx` | NEW - Resizable split layout |
| `src/components/estimates/takeoff/PlanPreviewPanel.tsx` | NEW - Read-only plan viewer |
| `src/components/estimates/EstimateFormDialog.tsx` | Wrap configure step with split layout |
| `src/components/ui/resizable.tsx` | Already exists - no changes needed |

### State Flow

1. When user enters Configure step, SplitScreenLayout mounts
2. PlanPreviewPanel loads existing takeoff files and markups (reuses useTakeoffData hook)
3. As user navigates between scopes in calculator, activeScope prop updates
4. PlanPreviewPanel highlights markups for the active scope with a glow/border
5. User can resize panels or collapse plan panel entirely

---

## Benefits

1. **Solves Core Problem**: Users can see plans while answering dimension questions
2. **Non-Disruptive**: Existing takeoff and calculator flows remain unchanged
3. **Flexible**: Resizable panels let users choose their preferred layout
4. **Progressive**: Mobile users still get a workable fallback

---

## Alternative Considered: Floating Plan Window

An alternative approach would be a floating/draggable window that shows plans, which users could position anywhere. However, this has UX challenges:
- Window management complexity
- Potential overlap with content
- Mobile support is harder

The split-screen approach is cleaner and more predictable.
