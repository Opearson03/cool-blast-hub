
# Fix: Minimal Template Price and Amount Pre-filling

## Problem Summary
The Minimal quote template has the following issues:
1. **Price column showing "-"** instead of actual unit price
2. **Amount column showing "Included"** instead of the calculated total for each scope
3. **Tables at top** - The user reports these aren't showing (needs verification, but code shows they exist)

## Root Cause
Looking at the database data for EST-2026-0218, each scope has a `calculatedTotal` field:
- `raft_slab.calculatedTotal: 4039.31`
- `retaining_wall_footings.calculatedTotal: 1293.27`

However:
1. The `ScopeBreakdown` interface in `quote-pdf-data.ts` doesn't include a `calculatedTotal` field
2. The `extractScopeBreakdowns()` function doesn't extract this value
3. The Minimal template code (lines 1229-1235) hardcodes "-" for Price and "Included" for Amount

## Solution

### 1. Update `ScopeBreakdown` Interface
Add `calculatedTotal` to the interface:
```typescript
export interface ScopeBreakdown {
  scopeName: string;
  volume: number;
  area?: number;
  details: string;
  areas?: Array<{ name: string; length: number; width: number; area: number }>;
  concreteStrength?: string;
  reinforcement?: string;
  surfaceFinish?: string;
  thickness?: number;
  calculatedTotal?: number;  // NEW - The total cost for this scope
}
```

### 2. Update `extractScopeBreakdowns()` Function
Extract `calculatedTotal` from each scope:
```typescript
// Inside the for loop, after extracting other values:
const calculatedTotal = Number(scope.calculatedTotal) || 0;

breakdowns.push({
  scopeName: formatScopeName(scopeId),
  volume,
  area: area > 0 ? area : undefined,
  details: thickness ? `${thickness}mm thick` : '',
  areas: individualAreas,
  concreteStrength: concreteStrength ? ... : undefined,
  reinforcement,
  surfaceFinish,
  thickness: thickness > 0 ? thickness : undefined,
  calculatedTotal: calculatedTotal > 0 ? calculatedTotal : undefined,  // NEW
});
```

### 3. Update Minimal Template Line Items Table
Update the rendering to use actual values:

**Current (broken):**
```tsx
<td className="py-2 px-2 text-right text-gray-700">-</td>          {/* Price */}
<td className="py-2 px-2 text-right text-gray-700">1</td>          {/* Qty */}
<td className="py-2 px-2 text-right text-gray-700">10%</td>        {/* GST */}
<td className="py-2 px-2 text-right text-gray-900 font-medium">Included</td>  {/* Amount */}
```

**Fixed:**
```tsx
<td className="py-2 px-2 text-right text-gray-700">
  {scope.calculatedTotal ? formatCurrency(scope.calculatedTotal) : "-"}
</td>
<td className="py-2 px-2 text-right text-gray-700">1</td>
<td className="py-2 px-2 text-right text-gray-700">10%</td>
<td className="py-2 px-2 text-right text-gray-900 font-medium">
  {scope.calculatedTotal ? formatCurrency(scope.calculatedTotal) : "-"}
</td>
```

Since Price = Amount when Qty = 1, both will show the same value.

### 4. Verify Info Tables Are Displaying
The code for the two-column info tables at the top (lines 1149-1198) appears correct:
- Left table: Customer name, Quote number, Date, Quote valid until
- Right table: Business name, Email, Phone, Address, ABN

If tables aren't showing, it may be a data issue. Ensure `business` object is passed correctly.

## Files to Modify
1. `src/lib/quote-pdf-data.ts` - Add `calculatedTotal` to interface and extraction
2. `src/components/estimates/PrintableEstimate.tsx` - Update Minimal template to use actual values

## Expected Result
After this fix:
- **PRICE column**: Shows the scope's calculated total (e.g., "$4,039.31")
- **AMOUNT column**: Shows the same value since Qty = 1
- **Info tables**: Will continue to display (verify data is passed correctly)
