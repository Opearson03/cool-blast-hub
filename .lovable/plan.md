
# Plan: Improve Pour Reschedule Communication (Sub-Trades Only)

## Overview
Enhance the pour reschedule workflow to better communicate schedule changes to sub-trades. Employee/crew management features will be included as commented-out code for future activation.

---

## Current State

The existing implementation already:
- Detects when a pour with active sub-trade invites is dragged to a new date
- Shows `SubbieRescheduleDialog` with affected sub-trades listed
- Allows user to choose "Cancel Invitations" or "Reschedule & Notify"
- Sends SMS and email notifications via the `notify-subtrade-reschedule` edge function

**Gap identified:** The `PourFormDialog` (manual date editing) does NOT trigger this workflow - only drag-and-drop on the calendar does.

---

## Implementation Plan

### 1. Add Date Change Detection to PourFormDialog

When editing a pour and the date changes, check for affected sub-trades and show the reschedule dialog.

**File:** `src/components/jobs/PourFormDialog.tsx`

**Changes:**
- Track the original date when entering edit mode
- On form submit, compare new date to original
- If date changed, fetch sub-trade invites
- If invites exist, show `SubbieRescheduleDialog` before saving
- Handle confirmation flow similar to `AdminSchedule.tsx`

### 2. Add Optional "Don't Notify" Option

Sometimes users may want to reschedule without notifying (e.g., minor time change, already spoke to subbie).

**File:** `src/components/schedule/SubbieRescheduleDialog.tsx`

**Changes:**
- Add a third button: "Move Only" or "Skip Notification"
- This will update the pour date without sending SMS/email
- Useful for when users have already communicated verbally

### 3. Comment Out Crew/Employee Detection (For Future Use)

Include the infrastructure for employee notifications as commented code that can be easily enabled later.

**File:** `src/pages/admin/AdminSchedule.tsx`

**Commented code structure:**
```typescript
// ===== FUTURE: Employee reschedule detection =====
// When employee management is enabled, uncomment this block
// to also check for assigned crew when rescheduling pours
//
// const { data: employees } = await supabase
//   .from("pour_employees")
//   .select(`employee_id, profiles!inner(id, full_name, phone)`)
//   .eq("pour_id", pourId);
//
// if (employees && employees.length > 0) {
//   // Show employee section in reschedule dialog
// }
// ===== END FUTURE =====
```

### 4. Add "Proceed Without Notifying" Flow

**File:** `src/components/schedule/SubbieRescheduleDialog.tsx`

Update dialog to support three actions:
1. **Cancel Invitations** - Revoke all invites, notify via SMS/email
2. **Reschedule & Notify** - Update date, send notifications
3. **Move Only** - Update date silently (no notifications)

**Updated props:**
```typescript
onConfirm: (action: "cancel" | "reschedule" | "silent") => Promise<void>;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/jobs/PourFormDialog.tsx` | Add date change detection and reschedule flow |
| `src/components/schedule/SubbieRescheduleDialog.tsx` | Add "Move Only" option |
| `src/pages/admin/AdminSchedule.tsx` | Handle new "silent" action, add commented crew code |

---

## Technical Details

### PourFormDialog Date Detection
```typescript
// Store original date when editing
const originalDate = useRef(editPour?.pour_date);

// On submit, check if date changed
const handleFormSubmit = async (data: PourFormData) => {
  if (editPour && data.pour_date !== originalDate.current) {
    // Check for active sub-trade invites
    const { data: invites } = await supabase
      .from("external_invites")
      .select("*")
      .eq("job_pour_id", editPour.id)
      .eq("invite_type", "sub_trade")
      .in("status", ["sent", "viewed", "accepted"]);

    if (invites && invites.length > 0) {
      // Show reschedule dialog instead of saving directly
      setPendingDateChange({
        oldDate: originalDate.current,
        newDate: data.pour_date,
        invites
      });
      setShowRescheduleDialog(true);
      return;
    }
  }
  // Continue with normal save
};
```

### Silent Move Handling
```typescript
// In AdminSchedule.tsx handleRescheduleConfirm
const handleRescheduleConfirm = async (action: "cancel" | "reschedule" | "silent") => {
  // Update pour date
  await supabase
    .from("job_pours")
    .update({ pour_date: newDate })
    .eq("id", pourId);

  if (action === "silent") {
    // Skip notifications entirely
    toast({ title: "Pour moved", description: "Sub-trades were not notified" });
  } else {
    // Existing notification logic
    await supabase.functions.invoke("notify-subtrade-reschedule", { ... });
  }
};
```

---

## User Experience

### Drag-and-Drop Reschedule
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
| [Cancel]  [Move Only]  [Notify & Move]   |
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
Same reschedule dialog appears
         ↓
User selects action
         ↓
Pour updated, notifications sent (if selected)
```
