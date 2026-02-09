

# Make All Summary Cards Clickable with Dialog Popups

## What Changes

All three summary cards on the dashboard will become interactive with a consistent click-to-open-dialog pattern, matching the existing "Action Required" behavior:

1. **"Today's Tasks"** -- tapping opens a dialog showing today's scheduled pours/visits with key details (time, job name, site address, visit type). Each item links to its job page.

2. **"Pending Responses"** renamed to **"Pending Subbie Responses"** -- tapping opens a dialog listing sub-contractor invites that haven't been confirmed yet. Each item opens the existing action sheet (Send/Resend, Call, Reschedule) without leaving the dashboard.

3. **"Action Required"** -- no changes, already works as a dialog.

## Technical Details (4 files)

### 1. `src/components/dashboard/SummaryCards.tsx` -- Make all cards clickable

- Rename "Pending Responses" to "Pending Subbie Responses"
- Add `onTodayTasksClick` and `onPendingResponsesClick` callback props
- Apply the same clickable styling (cursor-pointer, hover effect) to all cards when their count is greater than 0 and they have an onClick handler

### 2. New: `src/components/dashboard/TodayTasksDialog.tsx`

- Accepts `businessId`, `open`, `onOpenChange` props
- When opened, fetches today's pours from `job_pours` with joined `jobs` data (same query pattern as `DailyScheduleWidget`)
- Also fetches subbie confirmation stats per pour (same as `DailyScheduleWidget`)
- Displays each pour in a card showing:
  - Pour name and visit type badge
  - Job name and job number
  - Scheduled time and site address
  - Subbie confirmation count (e.g. "2/3 confirmed")
  - Status badge (scheduled, in_progress, etc.)
- Clicking a pour item closes the dialog and navigates to `/admin/jobs/{jobId}`
- Shows loading spinner while fetching
- Shows "No tasks scheduled for today" with a calendar icon when empty

### 3. New: `src/components/dashboard/PendingResponsesDialog.tsx`

- Accepts `businessId`, `open`, `onOpenChange` props
- When opened, fetches pending sub-contractor invites for the next 7 days from `external_invites` (same query pattern as `PendingSubbieInvitesWidget`)
- Groups invites by date with "Tomorrow" highlighted urgently
- Each invite shows:
  - Recipient name and trade/role badge
  - Pour name and job name
  - Status badge (Sent, Viewed, Draft)
- Clicking an invite opens the existing `PendingInviteActionSheet` (Send/Resend, Call, Reschedule) keeping the user on the dashboard
- Shows loading spinner while fetching
- Shows "All sub-contractors have responded" with a checkmark when empty

### 4. `src/pages/admin/AdminDashboard.tsx` -- Wire new dialogs

- Import `TodayTasksDialog` and `PendingResponsesDialog`
- Add `todayTasksDialogOpen` and `pendingResponsesDialogOpen` state variables
- Pass `onTodayTasksClick` and `onPendingResponsesClick` to `SummaryCards`
- Render both new dialogs with `businessId`

