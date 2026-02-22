

## Fix: PDF Subtotal and Total Calculations

### Root Cause

The estimate form saves `total_amount: combinedTotal` to the database, where `combinedTotal` is the **ex-GST** value (the summary step shows it as "Total (ex GST)").

However, the PDF renderer assumes `total_amount` is **inc-GST** and divides by 1.1 to derive the subtotal. This creates a cascading error:

- Subtotal shown as `total_amount / 1.1` (wrong -- should be `total_amount`)
- GST shown as `total_amount - total_amount / 1.1` (wrong -- should be `total_amount * 0.1`)
- Total shown as `total_amount` (wrong -- should be `total_amount * 1.1`)
- Each line item's unit price is divided by 1.1 when it shouldn't be

### Fix

Update `PrintableEstimate.tsx` to treat `estimate.total_amount` as ex-GST:

| Location | Current (wrong) | Corrected |
|---|---|---|
| Subtotal (ex GST) | `total_amount / 1.1` | `total_amount` |
| GST (10%) | `total_amount - total_amount / 1.1` | `total_amount * 0.1` |
| Total (inc GST) | `total_amount` | `total_amount * 1.1` |
| Line item unit price | `markedUpTotal / 1.1` | `markedUpTotal` (already ex-GST) |
| Line item total inc GST | `markedUpTotal` | `markedUpTotal * 1.1` |
| Custom item unit price | `item.amount / 1.1` | `item.amount` |
| Custom item total inc GST | `item.amount` | `item.amount * 1.1` |

### Files Changed

Only one file: `src/components/estimates/PrintableEstimate.tsx`

Both the **Minimal** template (lines ~960-1032) and **Classic** template (lines ~1229-1293) need the same corrections. No changes to data extraction, component structure, or visual styling -- only the arithmetic.

