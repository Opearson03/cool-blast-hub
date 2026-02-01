
# Fix Takeoff Marking Save and Return Flow for Control & Expansion Joints

## Problem Summary

When a user clicks "Mark on Plans" for control joints or expansion joints:
1. The polyline markups are saved to the database, but the measured length isn't being populated back into the specific joint configuration
2. The user isn't automatically returned to the configure step after marking
3. The LinearDimensionsDialog shows width/depth fields which aren't needed for joints

## Root Causes

1. **No automatic return flow**: After saving polyline markups for joints, the user must manually click "Continue" - there's no callback to auto-navigate back
2. **Missing length injection**: When returning to the configure step, the code doesn't look up the measured joint lengths from takeoff and inject them into the specific joint config
3. **Wrong dialog shown**: The LinearDimensionsDialog is shown for all LINEAR_SCOPES, but joints only need a length confirmation (no width/depth)

---

## Technical Changes

### 1. Create JointDimensionsDialog Component

**New File:** `src/components/estimates/takeoff/JointDimensionsDialog.tsx`

A simplified dialog for joint measurements that only shows:
- Total length measured
- Number of segments drawn
- Confirm button that saves and triggers auto-return

This dialog will be shown instead of LinearDimensionsDialog for expansion_joints and control_joints scopes.

### 2. Update PlanTakeoffStep to Handle Joint Scopes Differently

**File:** `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Changes:
1. Add state for the new JointDimensionsDialog: `showJointDimensions`
2. In `handleDoneMarkingPolyline`, check if activeScope is `expansion_joints` or `control_joints` and show JointDimensionsDialog instead of LinearDimensionsDialog
3. Add `onJointMarkupComplete` callback prop that gets called after joint markup is saved
4. The callback passes the measured length and scope info back to EstimateFormDialog

```typescript
// New prop
onJointMarkupComplete?: (scopeId: string, lengthMeters: number) => void;

// In handleDoneMarkingPolyline
if (activeScope === 'expansion_joints' || activeScope === 'control_joints') {
  setShowJointDimensions(true);
  return;
}
```

### 3. Update EstimateFormDialog to Handle Joint Return Flow

**File:** `src/components/estimates/EstimateFormDialog.tsx`

Changes:
1. Add a new handler `handleJointMarkupComplete` that:
   - Parses the `pendingTakeoffScope` to extract the joint ID (format: `expansion_joints:joint:{jointId}`)
   - Updates the specific joint's `total_length_m` and `measured_on_plans` fields in the modular state
   - Automatically navigates back to the configure step
   - Sets the active scope index to show the correct module

2. Pass this handler to PlanTakeoffStep as `onJointMarkupComplete`

```typescript
const handleJointMarkupComplete = useCallback(async (scopeId: string, lengthMeters: number) => {
  const markedScope = markedTakeoffScopeRef.current;
  
  if (markedScope && typeof markedScope === 'string' && markedScope.includes(':joint:')) {
    // Parse: "expansion_joints:joint:{jointId}" or "control_joints:joint:{jointId}"
    const parts = markedScope.split(':');
    const jointModuleType = parts[0]; // 'expansion_joints' or 'control_joints'
    const jointId = parts[2];
    
    // Update the specific joint's total_length_m in the module answers
    // Navigate to configure step and open the relevant module
  }
  
  // Clear ref and navigate
  markedTakeoffScopeRef.current = null;
  setPendingTakeoffScope(null);
  await refetchMarkups();
  setCurrentStep('configure');
}, [...]);
```

### 4. Auto-Save and Auto-Return Workflow

When user clicks "Done" in JointDimensionsDialog:
1. Save the polyline markup to the database (via `addPolylineMarkup` with scope_id = 'expansion_joints' or 'control_joints')
2. Call `onJointMarkupComplete` callback with the measured length
3. EstimateFormDialog updates the module state and navigates back to configure step
4. The specific module accordion is opened so user can continue editing

---

## UI Flow (Updated)

```text
User Journey:
1. User adds expansion joint in Connections & Joints module
2. Clicks "Mark on Plans" button → navigates to takeoff step
3. Draws polyline(s) on plan
4. Clicks "Done" or presses Enter
5. JointDimensionsDialog appears showing "45.2m total measured"
6. User clicks "Confirm" 
7. → Markup is saved to database
8. → User is AUTO-RETURNED to configure step
9. → Joint's total_length_m is set to 45.2m
10. → Joint's measured_on_plans is set to true
11. → Quantity auto-recalculates from the measured length
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/estimates/takeoff/JointDimensionsDialog.tsx` | Simple dialog for confirming joint length measurements |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/takeoff/PlanTakeoffStep.tsx` | Add JointDimensionsDialog, add `onJointMarkupComplete` callback, handle joint scopes separately |
| `src/components/estimates/EstimateFormDialog.tsx` | Add `handleJointMarkupComplete` handler, update module state with measured length, auto-return to configure |

---

## JointDimensionsDialog Design

```text
┌──────────────────────────────────────────────────────┐
│ 📏 Joint Length Measured                             │
│                                                      │
│ Total Length:  45.2m                                 │
│ Segments:      3 lines drawn                         │
│                                                      │
│           [Cancel]     [✓ Confirm & Return]          │
└──────────────────────────────────────────────────────┘
```

---

## Edge Cases Handled

1. **Multiple segments**: All polyline segments are summed into total length
2. **User cancels**: Returns to drawing mode without saving or navigating
3. **Add another joint**: After returning, user can click "Mark on Plans" again for a different joint
4. **Manual override**: User can still manually edit total_length_m after marking (clears measured_on_plans flag)
5. **No joint ID in scope**: If user marks via scope checklist (not via specific joint), save the markup but don't auto-populate any joint config

---

## Benefits

1. **Seamless workflow**: User marks → confirms → auto-returns to continue configuring
2. **Accurate measurements**: Length from takeoff is automatically populated into the joint config
3. **Clear UI**: Joints get a simple confirmation dialog without irrelevant dimension fields
4. **Data persistence**: Markups are saved to database and survive page refreshes
5. **Quantity auto-calculation**: Joint piece quantity recalculates from measured length
