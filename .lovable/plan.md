

## Editable Scope Line Items at Review Stage

### Problem

Users complete the takeoff and calculator steps, arrive at the summary/review page, and want to make quick adjustments -- either tweaking an individual scope's total price, or adding extra line items. Currently the summary step is read-only, forcing them to navigate back through the calculator to make changes.

### Solution

Replace the read-only `SimplifiedScopeSummary` rows on the summary step with **editable scope line items**. Each scope becomes a row where the user can:

1. **Override the scope total** by clicking the price and typing a new value (inline edit)
2. **Add custom line items** below the scope list (e.g., "crane hire", "extra labour") with description, quantity, unit, rate, and total
3. See the grand total update in real-time as they make changes

The internal calculated cost is preserved as a reference -- the override is purely for the client-facing quote total.

### User Experience

On the summary step, each scope row will show:
- Scope name + key metrics (area, length, etc.) as today
- An **editable price field** (click to edit, shows a pencil icon on hover)
- If edited, a small "reset" link to revert to the calculated value, plus a subtle indicator showing the original calculated cost

Below the scope rows:
- An **"Add Line Item"** button to add custom rows (description + amount)
- Custom line items appear as editable rows that can be deleted

The totals section updates to reflect any overrides and custom items.

### Changes

| File | Change |
|---|---|
| `src/components/estimates/SimplifiedScopeSummary.tsx` | Add `onTotalChange` callback prop and inline-editable price field. Show original calculated total as reference when overridden. |
| `src/components/estimates/EstimateFormDialogV2.tsx` | Add `scopeTotalOverrides` state (`Record<string, number>`), `customLineItems` state, pass callbacks to `SimplifiedScopeSummary`, update `combinedSubtotal` to use overrides, include custom line items in total, persist overrides in `scope_data`, and add "Add Line Item" UI on summary step. |
| `src/components/estimates/EstimateFormDialog.tsx` | Mirror the same changes (V1 wizard). |

### Technical Details

**New state in EstimateFormDialogV2:**

```
scopeTotalOverrides: Record<ScopeType, number | null>
// null = use calculated total, number = user override

customSummaryLineItems: Array<{
  id: string;
  description: string;
  amount: number;
}>
```

**Updated `combinedSubtotal` calculation:**

```typescript
const combinedSubtotal = useMemo(() => {
  const scopeSum = selectedScopesArray.reduce((sum, scope) => {
    const override = scopeTotalOverrides[scope];
    return sum + (override !== null && override !== undefined
      ? override
      : scopeTotals[scope].total);
  }, 0);
  const customSum = customSummaryLineItems.reduce((sum, item) => sum + item.amount, 0);
  return scopeSum + customSum;
}, [selectedScopesArray, scopeTotals, scopeTotalOverrides, customSummaryLineItems]);
```

**SimplifiedScopeSummary changes:**

- New props: `onTotalChange?: (newTotal: number) => void`, `isOverridden?: boolean`, `originalTotal?: number`, `onReset?: () => void`
- Price becomes a clickable `Input` (type=number) in edit mode
- When overridden, shows original value struck through or as a small label below

**Persistence:**

Overrides and custom line items are stored in `scope_data` under `_scopeTotalOverrides` and `_customSummaryLineItems`, and restored when reopening the estimate for revision.

**Scope breakdown in notes:**

The `SCOPE BREAKDOWN` section in notes will use the overridden values (if any) so the client-facing quote reflects the adjusted prices.

### What This Achieves

- Users can quickly adjust any scope's price at the final review step without navigating back
- Custom one-off costs (crane hire, travel, etc.) can be added without going through a calculator module
- The original calculated costs are preserved as a reference
- All changes are persisted and restored on re-open

