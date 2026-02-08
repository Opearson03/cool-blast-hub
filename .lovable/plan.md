

# Fix: Preset Fixed Profit Off by a Few Dollars

## Problem

When you click a preset profit button (e.g. $5,000), the displayed fixed profit shows a slightly different number (e.g. $5,005 or $4,997). This is because:

1. Clicking $5,000 reverse-calculates the margin percentage, rounding to **1 decimal place**
2. The displayed profit re-calculates from that rounded percentage, producing a slightly different dollar amount

For example, with a subtotal of $38,500:
- $5,000 / $38,500 = 12.987...% --> rounds to **13.0%**
- 13.0% x $38,500 = **$5,005** (off by $5)

## Fix

Increase the margin percentage precision from 1 decimal place to 2 decimal places. This reduces the maximum drift from ~$50 to ~$5 on typical estimates, and in most cases eliminates visible discrepancy entirely.

### File: `src/components/estimates/EstimateFormDialog.tsx`

**Change 1 -- Preset profit buttons (line 2438):**

Round to 2 decimal places instead of 1:

```
// Before
setGlobalMarginPercent(Math.round((preset / combinedSubtotal) * 100 * 10) / 10);

// After
setGlobalMarginPercent(Math.round((preset / combinedSubtotal) * 100 * 100) / 100);
```

**Change 2 -- Manual profit input (line 2420):**

Same precision increase for consistency when typing a custom dollar amount:

```
// Before
setGlobalMarginPercent(Math.round((amount / combinedSubtotal) * 100 * 10) / 10);

// After
setGlobalMarginPercent(Math.round((amount / combinedSubtotal) * 100 * 100) / 100);
```

## Impact

- Two lines changed in one file
- The margin percentage will now store up to 2 decimal places (e.g. 12.99% instead of 13.0%)
- The displayed fixed profit will match the preset much more closely
- No effect on existing saved estimates -- margin percentage is already stored as a number
