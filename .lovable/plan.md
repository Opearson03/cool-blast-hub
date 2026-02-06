

# Remove $0.00 from Unused Line Items in Quote Template

## Problem
The **Simple quote template** displays empty placeholder rows with `0.00` in the "Total Inc GST" column. These rows are meant to fill visual space but show misleading currency values that could confuse customers.

```text
Current behavior (Simple template):
┌────────────────────────────────┬──────────┬─────┬───────┬─────────────┐
│ Description                    │ Price    │ Qty │ GST % │ Total Inc   │
├────────────────────────────────┼──────────┼─────┼───────┼─────────────┤
│ Raft Slab                      │ $8,500   │ 1   │ 10%   │ $9,350.00   │
│ Driveway                       │ $2,727   │ 1   │ 10%   │ $3,000.00   │
│                                │          │     │       │ 0.00        │  ← Problem
│                                │          │     │       │ 0.00        │  ← Problem
│                                │          │     │       │ 0.00        │  ← Problem
└────────────────────────────────┴──────────┴─────┴───────┴─────────────┘
```

## Solution
Remove the `0.00` text from empty placeholder rows while keeping the rows themselves for visual consistency.

## Technical Details

**File:** `src/components/estimates/PrintableEstimate.tsx`

**Location:** Lines 944-956 (Simple/minimal template empty rows loop)

**Current code:**
```tsx
{Array.from({ length: Math.max(0, 8 - dataRowCount) }).map((_, index) => {
  const rowIndex = dataRowCount + index;
  return (
    <tr key={`empty-${index}`} style={{ backgroundColor: rowIndex % 2 === 0 ? "#f3f4f6" : "white" }}>
      <td className="py-2 px-2">&nbsp;</td>
      <td className="py-2 px-2"></td>
      <td className="py-2 px-2"></td>
      <td className="py-2 px-2"></td>
      <td className="py-2 px-2 text-right text-gray-400">0.00</td>  {/* ← Remove this */}
    </tr>
  );
})}
```

**Change:**
- Replace `0.00` with `&nbsp;` or an empty string to maintain the row structure without displaying a misleading value

**Expected Result:**
```text
┌────────────────────────────────┬──────────┬─────┬───────┬─────────────┐
│ Description                    │ Price    │ Qty │ GST % │ Total Inc   │
├────────────────────────────────┼──────────┼─────┼───────┼─────────────┤
│ Raft Slab                      │ $8,500   │ 1   │ 10%   │ $9,350.00   │
│ Driveway                       │ $2,727   │ 1   │ 10%   │ $3,000.00   │
│                                │          │     │       │             │  ← Clean
│                                │          │     │       │             │  ← Clean
│                                │          │     │       │             │  ← Clean
└────────────────────────────────┴──────────┴─────┴───────┴─────────────┘
```

## Files to Change

| File | Change |
|------|--------|
| `src/components/estimates/PrintableEstimate.tsx` | Remove `0.00` from empty placeholder row cells |

## Impact
- **Simple template only** — the Classic template doesn't render empty placeholder rows
- No functional changes to totals or calculations
- Cleaner, more professional appearance on quotes

