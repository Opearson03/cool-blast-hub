
## Goal
Distribute the markup proportionally into each scope line item so that:
- Each line item already includes its share of the global margin
- No separate "Markup" row appears on the quote
- Line items naturally sum to the grand total

---

## How the data works (for context)

| Field | Meaning | Example |
|-------|---------|---------|
| `scope.calculatedTotal` | Internal cost (your cost) | $4,039.31 |
| `_globalMargin` | Markup percentage | 15% |
| `estimate.total_amount` | Final quoted price to client | $6,132.47 |

**Current formula:**
```
estimate.total_amount = sum(calculatedTotal) + (sum(calculatedTotal) × margin%)
```

**Current display (wrong):**
- Raft Slab: $4,039.31 (internal cost)
- Markup (15%): $800.00
- Total: $6,132.47

**Desired display (correct):**
- Raft Slab: $4,645.21 (internal cost + proportional markup)
- Retaining Wall Footings: $1,487.26 (internal cost + proportional markup)
- Total: $6,132.47

---

## Implementation

### File: `src/components/estimates/PrintableEstimate.tsx`

**In the Minimal template section (lines ~1220-1330):**

1. **Calculate the markup multiplier** from `_globalMargin`:
   ```tsx
   const globalMargin = scopeData?._globalMargin || 0;
   const markupMultiplier = 1 + (Number(globalMargin) / 100);
   ```

2. **For each scope row**, apply the markup to the displayed price:
   - **Price with markup** = `scope.calculatedTotal × markupMultiplier`
   - **Price (ex GST)** = `priceWithMarkup / 1.1`
   - **Total Inc GST** = `priceWithMarkup`

3. **Remove the "Markup / Adjustment" row** entirely (lines 1270-1283) since markup is now baked into each line item.

4. **Handle rounding differences** - If there's a small rounding variance between the sum of marked-up line items and `estimate.total_amount`, apply the difference to the largest scope (or last scope) to ensure perfect summation.

---

## Code Changes Summary

### Line item calculation (updated):
```tsx
// Current (internal cost only):
const totalIncGst = scope.calculatedTotal || 0;
const priceExGst = totalIncGst / 1.1;

// New (with markup baked in):
const internalCost = scope.calculatedTotal || 0;
const markedUpTotal = internalCost * markupMultiplier;
const priceExGst = markedUpTotal / 1.1;
const totalIncGst = markedUpTotal;
```

### Remove "Markup" row:
Delete the conditional block that renders the "Markup (X%)" row.

### Rounding adjustment:
After calculating all marked-up totals, check if sum equals `estimate.total_amount`. If there's a small difference (due to rounding), add/subtract it from the largest line item.

---

## Result

| Scope | Internal Cost | + 15% Markup | Displayed Price |
|-------|---------------|--------------|-----------------|
| Raft Slab | $4,039.31 | +$605.90 | $4,645.21 |
| Retaining Wall | $1,293.27 | +$193.99 | $1,487.26 |
| **Total** | | | **$6,132.47** |

Line items now:
- Show the customer price (not internal costs)
- Sum exactly to the grand total
- Hide the markup from the client (as intended)

---

## Files to Change
- `src/components/estimates/PrintableEstimate.tsx`
  - Apply markup multiplier to each scope line item
  - Remove the separate "Markup / Adjustment" row
  - Add rounding adjustment logic

No database changes required.
