
# Plan: Add Start Time to Sub-Contractor Invites

## Overview

You want to specify what time a sub-contractor should arrive for a job. Currently, the invite inherits the pour's `scheduled_time`, but sub-contractors (like pump operators) often need to arrive at different times than the main pour starts.

This plan adds a dedicated `start_time` field to the invite itself, allowing you to specify arrival times per sub-contractor.

---

## Changes Required

### 1. Database: Add `start_time` Column to `external_invites`

Add a new `start_time` column (time without time zone, nullable) to store the subbie's expected arrival time. Falls back to the pour's `scheduled_time` if not specified.

```text
ALTER TABLE external_invites ADD COLUMN start_time TIME;
```

---

### 2. UI: Add Time Picker to Invite Dialogs

Update the invite forms to include a time input field:

**Files to modify:**
- `src/components/jobs/SubTradeInviteDialog.tsx` - Add start time field to new subbie form and existing subbie selection
- `src/components/schedule/ScheduleSubbieDialog.tsx` - Add start time field to both tabs

**UI Design:**
- Simple time input field using a text input with type="time" (e.g., "07:30")
- Label: "Start Time (optional)"
- Placed near the notes field
- Pre-populate with pour's scheduled_time if available

---

### 3. Hook: Pass Start Time to Mutation

Update the invite mutation to accept `start_time`:

**File:** `src/hooks/useSubTradeInvites.ts`

Add `start_time?: string` to the mutation function parameters.

---

### 4. Edge Functions: Accept and Store Start Time

Update both edge functions to handle the new field:

**Files:**
- `supabase/functions/send-subtrade-invite/index.ts`
- `supabase/functions/send-batch-subtrade-invite/index.ts`

Changes:
- Add `start_time` to the request interface
- Store `start_time` in the database insert
- Display the invite-specific `start_time` in SMS/email (fallback to pour's `scheduled_time` if not set)

---

### 5. Public Response Page: Display Start Time

Update the subbie-facing response page to show the invite's start time:

**File:** `src/pages/public/RespondInvite.tsx`

Display the `start_time` from the invite (or fall back to pour's `scheduled_time`).

---

### 6. Validate Token Edge Function: Return Start Time

Ensure the token validation returns the `start_time` field:

**File:** `supabase/functions/validate-subtrade-token/index.ts`

Include `start_time` in the response so the public page can display it.

---

## User Flow After Implementation

1. User opens invite dialog for a pour
2. User selects or enters subbie details
3. User optionally sets a "Start Time" (e.g., "6:30 AM" for pump operator)
4. Invite is sent with the specified time
5. Subbie receives SMS/email showing the arrival time
6. Subbie opens invite link and sees the time clearly displayed
7. Calendar download includes the correct start time

---

## Technical Details

### Form Schema Update
```typescript
const formSchema = z.object({
  // ... existing fields
  start_time: z.string().optional(), // Format: "HH:mm"
});
```

### Time Input Component
```tsx
<FormField
  name="start_time"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" />
        Start Time (optional)
      </FormLabel>
      <FormControl>
        <Input type="time" {...field} />
      </FormControl>
    </FormItem>
  )}
/>
```

### SMS Message Update
```text
Before: "You're invited to work as Pump Operator on Monday, 3 Feb."
After:  "You're invited to work as Pump Operator on Monday, 3 Feb at 6:30am."
```

---

## Summary of File Changes

| File | Change |
|------|--------|
| **Migration** | Add `start_time` column to `external_invites` |
| `SubTradeInviteDialog.tsx` | Add time input field |
| `ScheduleSubbieDialog.tsx` | Add time input field |
| `useSubTradeInvites.ts` | Add `start_time` to mutation params |
| `send-subtrade-invite/index.ts` | Accept and store start_time, include in messages |
| `send-batch-subtrade-invite/index.ts` | Accept and store start_time, include in messages |
| `validate-subtrade-token/index.ts` | Return start_time in response |
| `RespondInvite.tsx` | Display invite's start_time |

