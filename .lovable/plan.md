

# Fix: Fixed Profit Amount Showing Stale/Wrong Values

## Problem

The "Fixed Profit" field on the Markup step shows incorrect dollar amounts ($4126, $6709) that don't match the 15% auto markup. Two bugs are causing this:

### Bug 1: No sync between percentage and dollar amount

`fixedProfitAmount` is initialized to `0` and only updated when the user manually interacts with the markup inputs. There is no effect or derived calculation that keeps it in sync with `combinedSubtotal * globalMarginPercent / 100`.

So when you open an estimate:
- `globalMarginPercent` loads correctly as 15%
- `combinedSubtotal` computes correctly from scope totals
- But `fixedProfitAmount` stays at `0` (shows as empty) until you click something

### Bug 2: Stale state between estimates

When creating a new estimate, the reset block resets `globalMarginPercent` to 15 but **never resets** `fixedProfitAmount`. So if you set a fixed profit of $4126 on one estimate, close, and open a new estimate, the $4126 carries over.

## Solution

### 1. Make `fixedProfitAmount` a derived value (not independent state)

Replace the independent `fixedProfitAmount` state with a `useMemo` that always derives from `combinedSubtotal * globalMarginPercent / 100`. This eliminates any desync.

The percentage input remains the "source of truth". The fixed profit field becomes a convenience input that reverse-calculates the percentage when edited.

### 2. Add reset on dialog close/new estimate

Add `setFixedProfitAmount(0)` to the reset block so stale values don't carry over between estimates.

Since we're making `fixedProfitAmount` derived, the reset is handled automatically -- no stale state possible.

---

## Technical Changes

**File: `src/components/estimates/EstimateFormDialog.tsx`**

| Change | Location | Detail |
|--------|----------|--------|
| Replace `fixedProfitAmount` state with derived memo | Line 446 | Remove `useState`, add `useMemo` that computes `Math.round(combinedSubtotal * (globalMarginPercent / 100))` |
| Remove `setFixedProfitAmount` calls from percentage input | Line 2375 | No longer needed -- the memo auto-derives |
| Remove `setFixedProfitAmount` calls from preset buttons | Lines 2393, 2438 | Same reason |
| Update fixed profit `onChange` handler | Line 2416 | Keep the reverse-calc: user types a dollar amount, it sets `globalMarginPercent` accordingly, and the memo re-derives the display value |
| Fix the `value` binding | Line 2415 | Change from `fixedProfitAmount \|\| ''` to the derived value (which will always be a number, never 0 unless subtotal is 0) |
| Remove fixed profit preset `variant` check | Line 2435 | The preset highlight check `fixedProfitAmount === preset` still works with the derived value |

### Derived value logic

```text
fixedProfitAmount = Math.round(combinedSubtotal * (globalMarginPercent / 100))
```

This ensures:
- Opening an estimate with 15% margin and $27,510 subtotal immediately shows $4,127 in the fixed profit field
- Changing scope totals automatically updates the fixed profit display
- The percentage always remains the source of truth
- No stale state possible between estimates

### Fixed profit input behavior (unchanged UX)

When the user types into the fixed profit field:
1. The typed amount reverse-calculates the percentage: `globalMarginPercent = (amount / combinedSubtotal) * 100`
2. The memo immediately re-derives the displayed fixed profit from the new percentage
3. Both fields stay in sync

### Fixed profit preset buttons

When clicking a preset like $5,000:
1. Reverse-calculate: `globalMarginPercent = (5000 / combinedSubtotal) * 100`
2. The memo derives the display value (which will be exactly $5,000 since it's derived from the same math)
