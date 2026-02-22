
## Fix: Numbers Don't Line Up + Custom Items Missing from PDF

### The Problems

1. **Numbers don't match**: The PDF pricing table uses `extractScopeBreakdowns()` which reads the **original** `calculatedTotal` from each scope in `scope_data`. It then applies a uniform markup multiplier to make these add up to `estimate.total_amount`. But when you've overridden a scope total or added custom line items, the multiplier becomes wildly wrong because the base numbers are different from what was actually saved.

2. **Custom line items missing from PDF**: Items stored in `_scopeTotalOverrides` and `_customSummaryLineItems` are never read by the PDF renderer. The `getScopesFromData()` helper skips all keys starting with `_`, so custom line items simply don't appear.

In your example: Small Slab calculated at $4,623.30, overridden to $5,000, plus $2,000 in custom items. The PDF sees only $4,623.30 for "Small Slab" and inflates it to match the $8,855 total -- producing one wrong line item and zero custom items.

### Solution

Make the PDF renderer aware of scope overrides and custom line items by updating `extractScopeBreakdowns()` and the `PrintableEstimate` rendering logic.

### Changes

| File | Change |
|---|---|
| `src/lib/quote-pdf-data.ts` | Update `extractScopeBreakdowns()` to accept and apply `_scopeTotalOverrides` from `scope_data`, overriding `calculatedTotal` per scope. Add a new `extractCustomLineItems()` function that reads `_customSummaryLineItems` from `scope_data`. Update `extractQuotePDFData()` to return custom line items. |
| `src/components/estimates/PrintableEstimate.tsx` | Update both templates (minimal + classic) to render custom line items as additional rows in the pricing table alongside scopes. Use overridden scope totals when computing `markedUpScopes` so the markup multiplier calculation is correct (or becomes unnecessary when overrides are present). |

### Technical Details

**quote-pdf-data.ts**

- In `extractScopeBreakdowns()`, after computing each scope's `calculatedTotal`, check if `scopeData._scopeTotalOverrides[scopeId]` exists and use that value instead
- Add `extractCustomLineItems(scopeData)` that returns `_customSummaryLineItems` array (description + amount)
- Add custom line items to `QuotePDFData` interface

**PrintableEstimate.tsx**

- When building `markedUpScopes`, the scope `calculatedTotal` values already include overrides (from the updated `extractScopeBreakdowns`), so the markup multiplier math works correctly
- After scope rows, render custom line item rows from `quotePDFData.customLineItems`
- Include custom line item amounts in the totals calculation so the sum matches `estimate.total_amount`
- Both minimal and classic templates get the same fix

### Result

- Scope line items in the PDF will show the overridden prices (not the original calculated ones)
- Custom line items (e.g. "crane hire $2,000") will appear as separate rows in the pricing table
- The total in the PDF will match what the user sees in the review step
- No changes needed to the review step UI itself -- the data is already saved correctly, just not read by the PDF
