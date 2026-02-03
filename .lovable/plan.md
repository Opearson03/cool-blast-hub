# Plan: Improve Pour Reschedule Communication (Sub-Trades Only)

## Status: ✅ COMPLETED

## Overview
Enhanced the pour reschedule workflow to better communicate schedule changes to sub-trades. Employee/crew management features are included as commented-out code for future activation.

---

## Implementation Summary

### ✅ 1. Added "Move Only" Option to SubbieRescheduleDialog
**File:** `src/components/schedule/SubbieRescheduleDialog.tsx`

- Added third button "Move Only" for silent date moves without notifications
- Updated `onConfirm` prop to accept `"cancel" | "reschedule" | "silent"` action
- Added `MoveRight` icon for the new button

### ✅ 2. Updated AdminSchedule to Handle Silent Action
**File:** `src/pages/admin/AdminSchedule.tsx`

- Updated `handleRescheduleConfirm` to handle new "silent" action
- Added commented-out code for future employee/crew reschedule detection
- Silent moves skip notification edge function and show appropriate toast

### ✅ 3. Added Date Change Detection to PourFormDialog
**File:** `src/components/jobs/PourFormDialog.tsx`

- Added `originalDateRef` to track the pour date when entering edit mode
- `handleFormSubmit` now detects date changes and checks for active sub-trade invites
- If invites exist, shows `SubbieRescheduleDialog` before saving
- Added `handleRescheduleConfirm` and `handleRescheduleCancel` handlers
- Supports all three actions: cancel, reschedule & notify, and move only

---

## User Experience

### Drag-and-Drop Reschedule (Calendar)
```text
User drags pour to new date
         ↓
System detects sub-trade invites exist
         ↓
+------------------------------------------+
| ⚠️ Sub-Trades Affected                   |
+------------------------------------------+
| 📅 Wed, 5 Feb → Fri, 7 Feb               |
|                                          |
| Affected Sub-Trades:                     |
| • John - Pump Operator    [Confirmed]    |
| • Mike - Reo Fixer         [Pending]     |
+------------------------------------------+
| [Cancel Invitations]  [Move Only]  [Reschedule & Notify] |
+------------------------------------------+
```

### Edit Form Date Change
```text
User opens pour edit form
         ↓
Changes date field from Feb 5 → Feb 7
         ↓
Clicks "Update"
         ↓
Same reschedule dialog appears (if invites exist)
         ↓
User selects action
         ↓
Pour updated, notifications sent (if selected)
```

---

## Future Enhancement (Commented Code)

Employee/crew reschedule detection is ready to enable in `AdminSchedule.tsx`:

```typescript
// ===== FUTURE: Employee reschedule detection =====
// When employee management is enabled, uncomment this block
// to also check for assigned crew when rescheduling pours
//
// const { data: employees } = await supabase
//   .from("pour_employees")
//   .select(`employee_id, profiles!inner(id, full_name, phone)`)
//   .eq("pour_id", pendingReschedule.pourId);
//
// if (employees && employees.length > 0) {
//   // Send push notifications to employees
//   await supabase.functions.invoke("notify-crew-reschedule", {
//     body: {
//       pour_id: pendingReschedule.pourId,
//       employee_ids: employees.map(e => e.employee_id),
//       old_date: pendingReschedule.oldDate,
//       new_date: pendingReschedule.newDate,
//     },
//   });
// }
// ===== END FUTURE =====
```
