

## Goal
Update the **Classic** quote template to match the core features of the **Minimal** template:
1. Use secondary color as header (already done)
2. Add properly structured client details with aligned tables
3. Show pricing broken into line items with markup distributed (not just checkmarks)

---

## Current State Analysis

### Classic Template Issues
| Feature | Current Classic | Target (Match Minimal) |
|---------|-----------------|------------------------|
| Header | Uses secondary color banner | Keep as-is (already matches) |
| Client/Business Info | Side-by-side free-form text | Structured tables with fixed heights |
| Line Items | Shows "Scope of Works" with checkmarks only | Table with Price, Qty, GST%, Total Inc GST |
| Markup | Not distributed - only shows "Included" checkmarks | Distribute markup into each line item |
| Grand Total | Shows at bottom when no parsedItems | Show in table footer |

---

## Implementation Plan

### File: `src/components/estimates/PrintableEstimate.tsx`

### 1. Replace the FROM/TO free-form section with structured tables (like Minimal)

**Current (lines 1419-1464):**
- Two columns with free-form `<p>` tags for FROM (business) and TO (client)
- Quote meta shown separately below

**New approach:**
- Two side-by-side `<table>` elements matching Minimal's structure
- Left table: Customer Details (4 rows: Name, Quote #, Date, Valid Until)
- Right table: Business Details (4 rows: Email, Phone, Address, ABN)
- Use fixed row heights (`h-[36px]`), `whitespace-nowrap` on labels, `truncate` on values
- Title headers with fixed height (`h-5`)

### 2. Replace ScopeLineItemsSection with a pricing table (like Minimal)

**Current behavior:**
The Classic template calls `ScopeLineItemsSection` which renders scopes with just a checkmark ("Included") - no pricing

**New behavior:**
Replace with a custom table that:
- Calculates `markupMultiplier = 1 + (globalMargin / 100)`
- Shows each scope as a row with:
  - Description: scope name
  - Price (ex GST): `(calculatedTotal * markupMultiplier) / 1.1`
  - Qty: 1
  - GST %: 10%
  - Total Inc GST: `calculatedTotal * markupMultiplier`
- Applies rounding adjustment to largest item
- Alternating row colors
- Summary rows for Subtotal, GST, Grand Total at bottom

### 3. Update table styling to match Classic aesthetic

- Header row uses `secondaryColor` background
- Grand total row uses `primaryColor` background
- Border styling consistent with Classic template

---

## Code Changes Summary

### Section 1: Header Tables (replaces lines 1419-1464)

Replace the FROM/TO divs with structured tables:

```tsx
{/* Two-column info boxes - aligned at top with matching structure */}
<div className="page-break-avoid grid grid-cols-2 gap-8 mb-6 items-start px-4">
  {/* Left - Customer/Quote Info (4 rows) */}
  <div>
    <p className="text-sm font-bold text-gray-900 mb-2 uppercase truncate whitespace-nowrap h-5 leading-5">Customer Details</p>
    <table className="w-full text-sm border border-gray-300 table-fixed">
      <colgroup>
        <col style={{ width: "40%" }} />
        <col style={{ width: "60%" }} />
      </colgroup>
      <tbody>
        <tr>
          <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Customer name</td>
          <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">{estimate.client_name}</td>
        </tr>
        {/* ... 3 more rows for Quote #, Date, Valid Until */}
      </tbody>
    </table>
  </div>

  {/* Right - Business Info (4 rows) */}
  <div>
    <p className="text-sm font-bold text-gray-900 mb-2 uppercase truncate whitespace-nowrap h-5 leading-5">{business?.name}</p>
    <table className="w-full text-sm border border-gray-300 table-fixed">
      {/* ... matching structure with Email, Phone, Address, ABN */}
    </table>
  </div>
</div>
```

### Section 2: Line Items Table with Markup (replaces ScopeLineItemsSection call ~lines 1477-1494)

Replace the `ScopeLineItemsSection` call with inline table logic matching Minimal:

```tsx
{(() => {
  // Calculate markup multiplier from global margin
  const globalMargin = scopeData?._globalMargin || 0;
  const markupMultiplier = 1 + (Number(globalMargin) / 100);
  
  // Calculate marked-up totals for each scope
  const markedUpScopes = quotePDFData.scopeBreakdowns.map(scope => ({
    ...scope,
    markedUpTotal: (scope.calculatedTotal || 0) * markupMultiplier
  }));
  
  // Apply rounding adjustment to largest item
  const markedUpSum = markedUpScopes.reduce((sum, s) => sum + s.markedUpTotal, 0);
  const roundingDiff = estimate.total_amount - markedUpSum;
  
  if (markedUpScopes.length > 0 && Math.abs(roundingDiff) > 0.001) {
    const largestIdx = markedUpScopes.reduce(
      (maxIdx, scope, idx, arr) => scope.markedUpTotal > arr[maxIdx].markedUpTotal ? idx : maxIdx, 
      0
    );
    markedUpScopes[largestIdx].markedUpTotal += roundingDiff;
  }

  return markedUpScopes.length > 0 ? (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr style={{ backgroundColor: secondaryColor, color: "white" }}>
          <th>Description</th>
          <th>Price</th>
          <th>Qty</th>
          <th>GST %</th>
          <th>Total Inc GST</th>
        </tr>
      </thead>
      <tbody>
        {markedUpScopes.map((scope, index) => {
          const totalIncGst = scope.markedUpTotal;
          const priceExGst = totalIncGst / 1.1;
          return (
            <tr key={index}>
              <td>{scope.scopeName}</td>
              <td>{formatCurrency(priceExGst)}</td>
              <td>1</td>
              <td>10%</td>
              <td>{formatCurrency(totalIncGst)}</td>
            </tr>
          );
        })}
        {/* Subtotal, GST, Grand Total rows */}
        <tr>
          <td colSpan={4}>Subtotal (ex GST)</td>
          <td>{formatCurrency(estimate.total_amount / 1.1)}</td>
        </tr>
        <tr>
          <td colSpan={4}>GST (10%)</td>
          <td>{formatCurrency(estimate.total_amount - estimate.total_amount / 1.1)}</td>
        </tr>
        <tr style={{ backgroundColor: primaryColor, color: "white" }}>
          <td colSpan={4}>GRAND TOTAL</td>
          <td>{formatCurrency(estimate.total_amount)}</td>
        </tr>
      </tbody>
    </table>
  ) : null;
})()}
```

### Section 3: Remove duplicate totals section

Since the pricing table now includes Subtotal/GST/Grand Total rows, remove the standalone totals section at lines 1531-1558 (the "If no line items, show total separately" block).

---

## Result

The Classic template will now display:

| Before | After |
|--------|-------|
| Free-form FROM/TO text blocks | Structured aligned tables (matching Minimal) |
| Scope of Works with checkmarks | Pricing table with ex-GST price, Qty, GST%, Total Inc GST |
| Markup hidden/not visible | Markup distributed into each line item |
| Separate totals section | Integrated Subtotal/GST/Total in table footer |

---

## Files to Change

- `src/components/estimates/PrintableEstimate.tsx`
  - Lines ~1419-1464: Replace FROM/TO section with structured tables
  - Lines ~1477-1525: Replace ScopeLineItemsSection with pricing table including markup
  - Lines ~1531-1558: Remove redundant totals section (now in table)

No backend changes required.

