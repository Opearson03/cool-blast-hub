

## Add Cost and Charge Columns to the Summary Page

### The Problem

Currently the summary step shows a single price per scope -- the internal cost. The markup is applied globally but the user can't see at a glance what each scope will cost the client. This creates confusion about what the numbers mean.

### Solution

Add two clearly labelled columns to each scope row on the summary page:
- **Cost** -- the internal calculated (or overridden) cost (editable, as it is today)
- **Charge** -- the price the client will see (cost + markup percentage, read-only, auto-calculated)

The charge column updates automatically when either the cost or the markup percentage changes.

### Changes

| File | Change |
|---|---|
| `SimplifiedScopeSummary.tsx` | Add a `marginPercent` prop. Display two columns: "Cost" (editable, as today) and "Charge" (read-only, = cost * (1 + margin/100)). Add column headers. |
| `SummaryLineItems.tsx` | Add a `marginPercent` prop. Show both the cost input and a read-only charge value per custom line item. |
| `EstimateFormDialogV2.tsx` | Pass `globalMarginPercent` to `SimplifiedScopeSummary` and `SummaryLineItems`. Add column header labels ("Cost" / "Charge") above the scope list. Update the totals section to show both cost subtotal and charge total clearly. |
| `EstimateFormDialog.tsx` | Mirror the same changes from V2. |

### Detailed Changes

**SimplifiedScopeSummary.tsx**

- Add prop: `marginPercent?: number` (defaults to 0)
- The right side of each row shows two values side by side:
  - The editable cost (existing behavior, labelled internally)
  - A read-only charge amount: `cost * (1 + marginPercent / 100)`, shown in a slightly different style (e.g. bolder, primary color)
- The override/reset UI stays on the cost column

**SummaryLineItems.tsx**

- Add prop: `marginPercent?: number`
- Each custom line item row shows both the cost input and a read-only charge value after it

**EstimateFormDialogV2.tsx and EstimateFormDialog.tsx**

- Above the scope list, add a small header row with "Cost" and "Charge" column labels
- Pass `marginPercent={globalMarginPercent}` to each `SimplifiedScopeSummary` and to `SummaryLineItems`
- The totals section already shows the combined total (which includes margin); add a "Subtotal (cost)" line above it for clarity
- Add the `InternalCostNotice` component to remind the user that cost values are internal only

### Layout

```text
Scope Name          |  Cost (editable)  |  Charge (auto)
------------------------------------------------------------
Small Slab (25m2)   |  $4,623.30  [pen] |  $5,316.80
Footings (12m)      |  $2,100.00  [pen] |  $2,415.00
+ Add Line Item
------------------------------------------------------------
Subtotal (cost)                  $6,723.30
Markup (15%)                     $1,008.50
Total (ex GST)                   $7,731.80
GST (10%)                          $773.18
Total (inc GST)                  $8,504.98
```

### What This Achieves

- Users can see at a glance what each scope costs them vs. what the client pays
- No confusion about which number is internal vs. client-facing
- The charge column updates live as the user adjusts cost overrides or the markup percentage
- Custom line items also show both columns for consistency
