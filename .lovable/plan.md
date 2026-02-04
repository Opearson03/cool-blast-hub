
# Plan: Make Finalized Quotes Editable

## Overview
Your boss is right - customers frequently need to revise and resend quotes. The current system technically allows editing through the dropdown menu, but the user experience is hidden and clunky. This plan improves the workflow to make quote revisions obvious and streamlined.

## Changes

### 1. Add "Revise Quote" Button to Detail Sheet
Add a prominent button in the `EstimateDetailSheet` that opens the full editing wizard, making it obvious that quotes can be revised.

**Location:** Below the "Accept & Create Job" button or alongside the Print/Email buttons

**Button text:** "Revise Quote" with a pencil/edit icon

### 2. Pass Edit Handler to Detail Sheet
Currently `EstimateDetailSheet` only receives an `onConvertToJob` callback. We need to add an `onEdit` callback so clicking "Revise Quote" can trigger the edit form dialog.

**Files affected:**
- `src/components/estimates/EstimateDetailSheet.tsx` - Add `onEdit` prop and "Revise Quote" button
- `src/pages/admin/AdminEstimates.tsx` - Pass the edit handler to the detail sheet

### 3. Ensure Status Preservation on Update
The current implementation already preserves the quote status when updating (uses `saveEstimate('pending')`), which is correct behavior. A finalized quote that gets edited remains finalized and ready to resend.

---

## Technical Details

### EstimateDetailSheet.tsx
```text
Changes:
1. Add new prop: onEdit?: (estimate: Estimate) => void
2. Add "Revise Quote" button in the actions area for non-draft quotes
3. Button calls onEdit(estimate) and closes the sheet
```

### AdminEstimates.tsx
```text
Changes:
1. Add handleEditFromSheet function that:
   - Sets editingEstimate
   - Opens formOpen
   - Closes the detail sheet (setViewingEstimate(null))
2. Pass onEdit={handleEditFromSheet} to EstimateDetailSheet
```

---

## User Flow After Implementation

1. User clicks on a finalized/sent quote → Detail sheet opens
2. User sees prominent "Revise Quote" button alongside Print/Email buttons
3. Clicking "Revise Quote" opens the full estimator wizard
4. User makes changes to pricing, scopes, terms, etc.
5. User clicks "Update Quote" → Quote is updated (stays in finalized state)
6. User can then resend via "Email to Client" from the detail sheet

---

## Summary of File Changes

| File | Change |
|------|--------|
| `EstimateDetailSheet.tsx` | Add `onEdit` prop and "Revise Quote" button |
| `AdminEstimates.tsx` | Add edit handler and pass to detail sheet |
