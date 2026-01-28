

# Pour Reschedule Notification System for Sub-Trades

## Overview

When a user changes a pour's date (via drag-and-drop or any date update), the system will detect if any sub-trades are currently invited to that pour and prompt the user to either **cancel** or **reschedule** those invites. The chosen action will trigger appropriate SMS and/or email notifications to the affected sub-trades.

---

## User Flow

```text
+---------------------------+
| User drags pour to new    |
| date in schedule          |
+-------------+-------------+
              |
              v
+---------------------------+
| System checks for existing|
| sub-trade invites         |
+-------------+-------------+
              |
     +--------+--------+
     |                 |
     v                 v
+----------+     +-----------+
| No       |     | Has       |
| Subbies  |     | Subbies   |
+----+-----+     +-----+-----+
     |                 |
     v                 v
+----------+     +------------------+
| Show     |     | Show Dialog:     |
| "Add     |     | Cancel or        |
| Subbie"  |     | Reschedule?      |
| toast    |     +--------+---------+
+----------+              |
                 +--------+--------+
                 |                 |
                 v                 v
          +-----------+    +-------------+
          | CANCEL    |    | RESCHEDULE  |
          +-----------+    +-------------+
                 |                 |
                 v                 v
          +-----------+    +---------------+
          | Update    |    | Update pour   |
          | status to |    | date, keep    |
          | "revoked" |    | invites active|
          +-----------+    +---------------+
                 |                 |
                 v                 v
          +-----------+    +---------------+
          | Send      |    | Send          |
          | cancel    |    | reschedule    |
          | notice    |    | notification  |
          +-----------+    +---------------+
```

---

## Components to Create/Modify

### 1. New Dialog Component: `SubbieRescheduleDialog.tsx`

A dialog that appears when a pour with existing sub-trade invites is rescheduled.

**Features:**
- Shows the list of affected subbies (name, role, status)
- Displays the old date and new date
- Two action buttons: "Cancel Invitations" and "Reschedule Subbies"
- Confirmation states with loading indicators

**Props:**
- `open`: boolean
- `onOpenChange`: function
- `pourId`: string
- `pourName`: string
- `oldDate`: string
- `newDate`: string
- `invites`: array of invite objects
- `onConfirm`: function(action: "cancel" | "reschedule")

---

### 2. New Edge Function: `notify-subtrade-reschedule/index.ts`

Handles sending notifications to sub-trades when a pour is rescheduled or cancelled.

**Request Body:**
```typescript
{
  pour_id: string;
  action: "cancel" | "reschedule";
  new_date?: string; // Required if action is "reschedule"
}
```

**Logic:**
1. Fetch all active invites for the pour (status: sent, viewed, accepted)
2. For each invite:
   - If action is "cancel": Update status to "revoked", send cancellation notice
   - If action is "reschedule": Keep status, send reschedule notification with new date + re-confirmation link

**Cancellation SMS Template:**
```
{BusinessName}: Your work invite for {OldDate} has been cancelled. Sorry for any inconvenience.
```

**Reschedule SMS Template:**
```
{BusinessName}: Your work invite has been rescheduled to {NewDate}. Can you still make it? View details: {inviteUrl}
```

**Reschedule Email:** Similar to the original invite email but with a "RESCHEDULED" banner and the new date prominently displayed. Includes the same response link so they can confirm/decline for the new date.

---

### 3. Modify: `AdminSchedule.tsx`

Update the `updatePourDate` mutation to:

1. Before updating the date, fetch existing invites for the pour
2. If invites exist with status in ("sent", "viewed", "accepted"):
   - Store the old date
   - Open the `SubbieRescheduleDialog` instead of immediately updating
   - Wait for user decision
3. After user confirms:
   - Update the pour date in database
   - Call `notify-subtrade-reschedule` edge function with chosen action
   - Invalidate queries and show success toast

**State additions:**
- `rescheduleDialogOpen`: boolean
- `pendingReschedule`: { pourId, pourName, oldDate, newDate, invites }

---

### 4. Database Updates

**Update invite statuses on reschedule:**
- When "cancel" is chosen: Set status = "revoked" for all affected invites
- When "reschedule" is chosen: 
  - For invites with status "accepted", optionally reset to "sent" so subbie must re-confirm
  - Or keep status and just notify (simpler approach)

**Audit logging:**
- Add event to `external_invite_events` table with event_type "reschedule_notified" or "cancelled_by_reschedule"

---

## Technical Details

### Edge Function: `notify-subtrade-reschedule`

```typescript
interface NotifyRescheduleRequest {
  pour_id: string;
  action: "cancel" | "reschedule";
  new_date?: string;
}

// Flow:
// 1. Validate JWT
// 2. Fetch pour details with job/business info
// 3. Fetch active invites for pour
// 4. For each invite:
//    - If cancelling: update status to "revoked"
//    - Send SMS (if phone exists) and email (if email exists)
// 5. Log events
// 6. Return success with count of notifications sent
```

### Reschedule Email Template

The email will have:
- Orange "RESCHEDULED" banner at top
- Clear indication of the NEW date (highlighted)
- Same job details as original invite
- "Confirm Availability" button linking to the same response page
- For already-accepted invites: "You previously accepted. Please confirm you can still make the new date."

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/schedule/SubbieRescheduleDialog.tsx` | Create | New dialog for cancel/reschedule choice |
| `supabase/functions/notify-subtrade-reschedule/index.ts` | Create | Edge function for sending notifications |
| `supabase/config.toml` | Modify | Add new edge function config |
| `src/pages/admin/AdminSchedule.tsx` | Modify | Integrate dialog into drag-and-drop flow |

---

## Edge Cases Handled

1. **No subbies invited**: Show existing "Add Subbie" toast (current behavior)
2. **All invites already declined/revoked**: Treat as no active subbies
3. **Mixed statuses**: Only notify subbies with active invites (sent, viewed, accepted)
4. **Notification failure**: Log error but don't block the reschedule; show partial success message
5. **User cancels dialog**: Revert the pour date change (don't update)

---

## Security Considerations

- Edge function validates JWT to ensure only authenticated users can trigger notifications
- Service role used to update invite statuses
- Token-based links remain valid for reschedule (no new tokens generated)
- RLS policies already in place for external_invites table

