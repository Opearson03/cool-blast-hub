
# Plan: Fix Slab Workflow Page Navigation Issue ✅ COMPLETED

## Problem Summary

When using the "Use Perimeter as Edge Beam" shortcut during slab takeoff, if users navigate to a different page (sheet), they lose sight of their pending slab and the workflow becomes confusing. The slab workflow remains active but the visual context disappears, leaving users unable to complete the workflow properly.

## Solution Implemented

Implemented a **page navigation guard** during active slab workflows that:
1. Hides page navigation controls when slab workflow is active
2. Shows a toast message if the user somehow tries to change pages
3. Displays a "wrong page" warning in the panel/dialog with a "Return" button

---

## Changes Made

### 1. PlanViewer.tsx
- Added `disablePageNavigation` prop that hides page controls when true

### 2. PlanTakeoffStep.tsx
- Added `useToast` hook
- Created `handlePageChange` guarded function that blocks page changes during active slab workflow with a toast message
- Passed `disablePageNavigation={slabWorkflowActive && !!pendingSlabData}` to PlanViewer
- Added `currentPage`, `slabPage`, and `onReturnToSlabPage` props to both panel and dialog

### 3. SlabBeamMarkupPanel.tsx
- Added props for page tracking (`currentPage`, `slabPage`, `onReturnToSlabPage`)
- Added "wrong page" detection logic
- Added warning banner with "Return" button when user is on different page

### 4. SlabBeamMarkupDialog.tsx (mobile)
- Same changes as panel for mobile consistency

---

## User Experience After Fix

- User draws slab → clicks "Yes" for perimeter edge beam → page navigation controls are hidden
- If somehow on wrong page, panel shows "Your slab is on Sheet X" with Return button
- User stays focused on correct page and completes workflow smoothly
