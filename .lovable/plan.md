

# Make "Action Required" Card Clickable with Unsigned Quotes List

## What Changes

Tapping the "Action Required" card on the dashboard will open a popup listing quotes that have been sent but not yet signed by the client. Each item will show the client name, site address, and quote amount, with a button to jump directly to that quote.

The pending leave request count will also be removed from the "Action Required" total since that feature isn't active.

## Technical Details (4 files)

### 1. Update `useDashboardData.ts` -- Remove leave requests from count

Remove the `leave_requests` query entirely. The `actionsRequiredCount` will only reflect unsigned quotes:

```typescript
actionsRequiredCount: unsignedQuotes || 0,
```

### 2. New component: `ActionsRequiredDialog.tsx`

Create `src/components/dashboard/ActionsRequiredDialog.tsx`:

- Accepts `businessId`, `open`, and `onOpenChange` props
- When opened, fetches unsigned quotes from `estimates` table (status = "sent", signed_at is null)
- Displays each quote as a card showing:
  - Client name
  - Site address
  - Total amount (formatted as currency)
  - Status badge ("Awaiting Signature")
  - "View Quote" button
- "View Quote" closes the dialog and navigates to `/admin/estimates?edit={id}`
- Shows a loading spinner while fetching
- Shows "No actions required" with a checkmark when the list is empty

### 3. Update `SummaryCards.tsx` -- Make card clickable

- Add optional `onActionRequiredClick` callback prop
- When `actionsRequiredCount > 0` and callback is provided, make the "Action Required" card clickable with cursor-pointer and a subtle hover effect
- Wire the card's `onClick` to call the callback

### 4. Update `AdminDashboard.tsx` -- Wire dialog

- Import `ActionsRequiredDialog`
- Add `actionsDialogOpen` state
- Pass `onActionRequiredClick` to `SummaryCards` to open the dialog
- Render `ActionsRequiredDialog` with `businessId`
