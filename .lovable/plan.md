

## Add Month View and Event Detail Sheet to Subcontractor Schedule

### Overview
Add a week/month view toggle and a detail sheet that opens when clicking on a scheduled event, following the same patterns used in the admin schedule.

### Changes

**File: `src/pages/subcontractors/SubcontractorSchedule.tsx`**

1. **View toggle state**: Add `viewMode` state (`"week" | "month"`) and toggle buttons (Week / Month) next to the Today button.

2. **Month view date logic**: Import `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, `isSameMonth` from `date-fns`. Compute a full 6-week month grid (starting Monday) when in month view. Update navigation to step by months instead of weeks.

3. **Month grid layout**: Render a 7-column CSS grid with day-of-week headers (Mon-Sun). Each cell shows the day number, highlights today, dims days outside the current month, and shows compact event indicators (colored dots + count). The `invitesByDate` map will cover all visible days (not just 7).

4. **Week view**: Keep existing week card layout unchanged.

5. **Event click handler**: Add `selectedInvite` state. Clicking any event card (week view) or dot/cell (month view) opens a detail sheet.

6. **Navigation header update**: In month view, show "February 2026" format and navigate by month. In week view, keep existing "MMM d - MMM d, yyyy" format.

**New component: `src/components/subcontractor/SubcontractorEventDetailSheet.tsx`**

A `Sheet` component that displays full details for a selected invite:
- Pour/visit name and role badge
- Business name
- Site address (with MapPin icon)
- Date and time (with Clock/Calendar icons)
- Notes (if any)
- Close button

### UI Behaviour
- Default view: **Week** (matches current behaviour)
- Month view cells: show day number + colored dots for events, "+N more" if many. Clicking a cell with one event opens detail; clicking a cell with multiple shows them listed.
- Week view cards: clicking opens the detail sheet
- Today button works in both views
- Prev/Next navigates by week or month depending on active view

### Technical Notes
- Reuses `SubcontractorInvite` type from the existing hook -- no new data fetching needed
- Follows the admin schedule pattern for view toggle (uses simple Button group, not Tabs)
- Sheet uses existing shadcn Sheet component
- No database changes required

