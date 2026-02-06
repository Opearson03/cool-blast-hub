
# Plan: Fix Site Visit Rescheduling Flow

## Problems Identified

1. **No email notification on reschedule**: When dragging a site visit to a new date on the schedule calendar, the date is updated but no confirmation email is sent to the client with the new details.

2. **Wrong action button shown**: The EstimateDetailSheet shows "Accept & Create Job" for site visits, but for draft estimates (which is what site visits are), the appropriate action is "Start/Edit Estimate" to continue building the quote.

3. **Missing Edit functionality**: The AdminSchedule page doesn't pass the `onEdit` prop to EstimateDetailSheet, so there's no way to start/continue the estimate from the schedule.

---

## Solution Overview

### 1. Add Email Notification on Site Visit Reschedule
When an estimate is dragged to a new date on the schedule, show a confirmation dialog (similar to pour reschedule) asking if the user wants to notify the client of the change.

### 2. Replace "Convert to Job" with "Start/Edit Estimate"
For draft estimates (site visits), show "Start Estimate" or "Edit Estimate" instead of "Accept & Create Job". This navigates to the estimates page and opens the estimate form.

### 3. Pass `onEdit` handler from AdminSchedule
Enable the edit functionality in the schedule's estimate sheet.

---

## Technical Changes

### File: `src/pages/admin/AdminSchedule.tsx`

**Add state for reschedule confirmation dialog:**
```typescript
const [pendingEstimateReschedule, setPendingEstimateReschedule] = useState<{
  estimateId: string;
  estimate: ScheduleEstimate;
  field: "site_visit_date" | "follow_up_date";
  newDate: string;
} | null>(null);
const [estimateRescheduleDialogOpen, setEstimateRescheduleDialogOpen] = useState(false);
```

**Modify `handleDragEnd` for estimates:**
Instead of immediately updating, check if client has email and show confirmation dialog offering to send updated details.

**Add `handleEditEstimate` function:**
Navigate to estimates page with the estimate ID to open it for editing.

**Pass `onEdit` prop to EstimateDetailSheet:**
```tsx
<EstimateDetailSheet
  estimate={selectedEstimate}
  open={estimateSheetOpen}
  onOpenChange={setEstimateSheetOpen}
  onEdit={handleEditEstimate}  // Add this
/>
```

**Remove `onConvertToJob` for draft estimates:**
Don't pass `onConvertToJob` or make the button conditional based on estimate completeness.

---

### File: `src/components/estimates/EstimateDetailSheet.tsx`

**Update the action button logic:**
- For draft estimates: Show "Start Estimate" or "Edit Estimate" button that triggers `onEdit`
- For sent/pending estimates: Show "Accept & Create Job" (existing behavior)

**Current logic (line ~605):**
```tsx
{onConvertToJob && estimate.status !== "accepted" && (
  <Button onClick={() => onConvertToJob(estimate)} ...>
    Accept & Create Job
  </Button>
)}
```

**New logic:**
```tsx
{/* For draft estimates - show Edit/Start Estimate */}
{onEdit && estimate.status === "draft" && (
  <Button onClick={() => { onEdit(estimate); onOpenChange(false); }} ...>
    <Pencil className="w-4 h-4" />
    {hasSubstantialContent ? "Edit Estimate" : "Start Estimate"}
  </Button>
)}

{/* For sent/pending estimates - show Accept & Create Job */}
{onConvertToJob && ["pending", "sent"].includes(estimate.status) && (
  <Button onClick={() => onConvertToJob(estimate)} ...>
    Accept & Create Job
  </Button>
)}
```

Where `hasSubstantialContent` checks if `total_amount > 0` or `scope_data` has content.

---

### New Component: `src/components/schedule/SiteVisitRescheduleDialog.tsx`

Create a simple dialog for site visit reschedule confirmation:

```tsx
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientEmail: string | null;
  oldDate: string;
  newDate: string;
  eventType: "site_visit" | "follow_up";
  onConfirm: (sendEmail: boolean) => void;
  onCancel: () => void;
}
```

Dialog offers two options:
- "Move & Notify Client" - Updates date and sends confirmation email
- "Move Only" - Updates date without notification

---

## Flow After Changes

1. **User drags site visit to new date**
2. **Dialog appears**: "Reschedule Site Visit?"
   - Shows old date → new date
   - If client has email: Shows "Move & Notify" and "Move Only" buttons
   - If no email: Just shows "Move" button
3. **If "Move & Notify"**: Updates date, then calls `send-site-visit-email` edge function with new date
4. **If "Move Only"**: Just updates the date

5. **User clicks on site visit card**
6. **Sheet opens** with "Start Estimate" button (not "Create Job")
7. **Clicking "Start Estimate"** navigates to `/admin/estimates?edit={id}` and opens the form

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/AdminSchedule.tsx` | Add reschedule dialog, edit handler, update EstimateDetailSheet props |
| `src/components/estimates/EstimateDetailSheet.tsx` | Conditional action buttons based on estimate status |
| `src/components/schedule/SiteVisitRescheduleDialog.tsx` | New dialog component |

---

## Testing Checklist

1. Drag a site visit (with client email) to a new date → should show reschedule dialog
2. Choose "Move & Notify" → date updates, email sent with new date
3. Choose "Move Only" → date updates, no email
4. Click on a site visit card → sheet opens
5. For draft estimate → should show "Start Estimate" button
6. Click "Start Estimate" → navigates to estimates page with form open
7. For sent estimate → should show "Accept & Create Job" button
