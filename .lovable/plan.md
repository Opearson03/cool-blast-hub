# ✅ COMPLETED

## Goal
Distribute the markup proportionally into each scope line item so that:
- Each line item already includes its share of the global margin
- No separate "Markup" row appears on the quote
- Line items naturally sum to the grand total

---

## Implementation Summary

### File: `src/components/estimates/PrintableEstimate.tsx`

**Changes made to the Minimal template section:**

1. **Calculate the markup multiplier** from `_globalMargin`:
   ```tsx
   const globalMargin = scopeData?._globalMargin || 0;
   const markupMultiplier = 1 + (Number(globalMargin) / 100);
   ```

2. **For each scope row**, apply the markup to the displayed price:
   - Created `markedUpScopes` array with `markedUpTotal = internalCost * markupMultiplier`
   - **Price (ex GST)** = `markedUpTotal / 1.1`
   - **Total Inc GST** = `markedUpTotal`

3. **Removed the "Markup / Adjustment" row** entirely since markup is now baked into each line item.

4. **Rounding adjustment** - Applied rounding difference to the largest scope item to ensure perfect summation with `estimate.total_amount`.

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
