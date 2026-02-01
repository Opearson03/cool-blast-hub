
# Fix Takeoff Marking Save and Return Flow for Control & Expansion Joints

## STATUS: ✅ COMPLETED

## Summary

Implemented a seamless workflow for marking joints on plans with automatic return to the configure step.

---

## Changes Made

### 1. Created JointDimensionsDialog Component

**New File:** `src/components/estimates/takeoff/JointDimensionsDialog.tsx`

A simplified dialog for joint measurements that shows:
- Total length measured
- Number of segments drawn
- Confirm button that saves and triggers auto-return

### 2. Updated PlanTakeoffStep

**File:** `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Changes:
- Added `showJointDimensions` and `pendingJointType` state
- Added `JOINT_SCOPES` constant and `isJointScope` check
- Updated `handleDoneMarkingPolyline` and `handlePolylineComplete` to show JointDimensionsDialog for joint scopes
- Added `onJointMarkupComplete` callback prop
- Rendered JointDimensionsDialog with confirm/cancel handlers

### 3. Updated EstimateFormDialog

**File:** `src/components/estimates/EstimateFormDialog.tsx`

Changes:
- Added `handleJointMarkupComplete` callback that:
  - Parses the `markedTakeoffScopeRef` to extract joint ID
  - Updates the specific joint's `total_length_m` and `measured_on_plans` fields
  - Sets active scope index to show the correct module
  - Navigates back to configure step
- Passed the callback to PlanTakeoffStep as `onJointMarkupComplete`

---

## User Flow

```text
1. User adds expansion/control joint in module
2. Clicks "Mark on Plans" button → navigates to takeoff step
3. Draws polyline(s) on plan
4. Clicks "Done" or presses Enter
5. JointDimensionsDialog appears showing "45.2m total measured"
6. User clicks "Confirm & Return"
7. → Markup is saved to database
8. → User is AUTO-RETURNED to configure step
9. → Joint's total_length_m is set to 45.2m
10. → Joint's measured_on_plans is set to true
```
