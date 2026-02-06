
# Plan: Fix Slab Workflow Page Navigation Issue

## Problem Summary

When using the "Use Perimeter as Edge Beam" shortcut during slab takeoff, if users navigate to a different page (sheet), they lose sight of their pending slab and the workflow becomes confusing. The slab workflow remains active but the visual context disappears, leaving users unable to complete the workflow properly.

## Root Cause

The slab workflow stores `pageNumber` and `fileId` when a slab is drawn, but there's no mechanism to:
1. Prevent page navigation during an active workflow
2. Warn users if they navigate away
3. Automatically return them to the correct page

## Proposed Solution

Implement a **page navigation guard** during active slab workflows that prevents accidental navigation and provides clear feedback to users.

---

## Implementation Details

### 1. Add Page Navigation Prevention During Active Slab Workflow

**File: `src/components/estimates/takeoff/PlanTakeoffStep.tsx`**

- Create a wrapper function for `setCurrentPage` that checks if a slab workflow is active
- If active, show a confirmation toast or block the navigation entirely
- Provide a way for users to cancel the workflow if they need to navigate away

```text
Logic:
1. When slabWorkflowActive is true AND user tries to change page:
   - Show toast: "Complete or cancel the current slab workflow first"
   - Prevent the page change
2. Alternative: Auto-navigate back to the correct page
```

### 2. Auto-Return to Slab Page When Workflow Dialog Opens

**File: `src/components/estimates/takeoff/PlanTakeoffStep.tsx`**

- When the slab beam dialog/panel opens (`showSlabBeamDialog = true`)
- Automatically navigate back to the page where the slab was drawn
- This ensures visual context is always maintained

### 3. Add Visual Indicator for Wrong Page

**File: `src/components/estimates/takeoff/panels/SlabBeamMarkupPanel.tsx`** and **`SlabBeamMarkupDialog.tsx`**

- If user is on a different page than where the slab was drawn, show a warning:
  - "You're viewing a different page. Return to Sheet X to see your slab."
- Add a "Return to Slab" button that navigates back

### 4. Disable Page Navigation Controls During Marking Steps

**File: `src/components/estimates/takeoff/PlanViewer.tsx`**

- Accept a new prop `disablePageNavigation?: boolean`
- When true, hide or disable the page navigation arrows
- Pass this prop from `PlanTakeoffStep` when `slabWorkflowActive` is true

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | Add page navigation guard logic, pass props to child components |
| `src/components/estimates/takeoff/PlanViewer.tsx` | Add `disablePageNavigation` prop to control visibility of page arrows |
| `src/components/estimates/takeoff/panels/SlabBeamMarkupPanel.tsx` | Add "wrong page" warning and return button |
| `src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx` | Add "wrong page" warning and return button |

---

## Technical Approach

### Step 1: Modify PlanTakeoffStep.tsx

Add a guard around the `setCurrentPage` call:

```typescript
// Create a guarded page change handler
const handlePageChange = useCallback((newPage: number) => {
  // Block page changes during active slab workflow
  if (slabWorkflowActive && pendingSlabData) {
    toast({
      title: "Workflow in progress",
      description: "Complete or cancel the current slab before navigating pages.",
      variant: "default"
    });
    return;
  }
  setCurrentPage(newPage);
}, [slabWorkflowActive, pendingSlabData, setCurrentPage, toast]);
```

Pass this handler to PlanViewer instead of direct setCurrentPage.

### Step 2: Modify PlanViewer.tsx

Add optional prop to disable navigation:

```typescript
interface PlanViewerProps {
  // ... existing props
  disablePageNavigation?: boolean;
}

// In the JSX, conditionally render page controls:
{planType === 'pdf' && totalPages > 1 && !disablePageNavigation && (
  <div className="absolute top-2 ...">
    {/* Page navigation buttons */}
  </div>
)}
```

### Step 3: Add Warning in Panel/Dialog

Add a warning banner when user is on wrong page:

```typescript
const isOnWrongPage = pendingSlabData && (
  pendingSlabData.fileId !== currentFileId || 
  pendingSlabData.pageNumber !== currentPage
);

// In JSX:
{isOnWrongPage && (
  <Alert variant="warning" className="mb-4">
    <AlertDescription className="flex items-center justify-between">
      <span>Your slab is on a different page.</span>
      <Button size="sm" onClick={handleReturnToSlabPage}>
        Return to Slab
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

## User Experience

**Before Fix:**
- User draws slab → clicks "Yes" for perimeter edge beam → accidentally navigates to Sheet 2 → slab disappears → confusion

**After Fix:**
- User draws slab → clicks "Yes" for perimeter edge beam → tries to navigate to Sheet 2 → toast message explains they need to complete or cancel the workflow first → user stays on correct page and completes workflow smoothly

---

## Alternative Considered

**Auto-cancel workflow on page change**: This was considered but rejected because users might accidentally lose their work if they briefly check another page.

The chosen approach (block + inform) preserves user work while providing clear feedback about the expected workflow.
