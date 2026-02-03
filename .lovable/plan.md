
## Goal
Fix the **Minimal (simple) quote template** so the **line items sum to the displayed total** (which you’ve confirmed is correct) and make the **two header tables align perfectly**.

---

## What’s happening (root cause)
From the saved estimate data:
- Each scope has a `calculatedTotal` stored in `scope_data` (e.g. Raft Slab, Retaining Wall Footings).
- The estimate also stores a **global markup** percentage in `scope_data._globalMargin` (e.g. 15%).
- `estimate.total_amount` is effectively:
  - **(sum of scope calculatedTotal)** + **global markup amount**
- In the Minimal template right now, the table:
  - treats each scope `calculatedTotal` as “ex GST” and then multiplies by `1.1` for “Total inc GST”
  - but the grand total is coming from `estimate.total_amount` (which already includes the markup effect)
  - so the scope rows won’t add up unless we also show the markup line item (or distribute it across scopes)

Net effect: **you aren’t missing “scope” line items — you’re missing the “markup/adjustment” line item** that bridges scope totals to the final quote total.

---

## Implementation plan (no backend changes)

### 1) Make the scope rows mathematically consistent
In `src/components/estimates/PrintableEstimate.tsx` (Minimal template table):

For each scope row:
- **Total Inc GST** should display: `scope.calculatedTotal` (not `* 1.1`)
- **Price** should display as ex-GST: `scope.calculatedTotal / 1.1`
- Keep **GST %** as `10%`
- Qty stays `1`

This makes each scope row internally consistent:
- ex-GST price + 10% GST = total inc-GST

### 2) Add the missing “Markup / Adjustment” line item so rows sum to the grand total
Still inside the Minimal template table:

- Compute:
  - `scopesTotalIncGst = sum(scopeBreakdowns[].calculatedTotal)`
  - `adjustmentIncGst = estimate.total_amount - scopesTotalIncGst`
- If `adjustmentIncGst` is meaningfully non-zero (e.g. absolute value > $0.01), add a row after scopes:
  - **Description**:
    - If `scopeData?._globalMargin` exists: `Markup (${_globalMargin}%)`
    - Otherwise: `Adjustment`
  - **Price (ex GST)**: `adjustmentIncGst / 1.1`
  - **GST %**: `10%`
  - **Total Inc GST**: `adjustmentIncGst`

This guarantees:
- (sum of “Total Inc GST” column for all rows) == `estimate.total_amount` (within rounding)

Edge cases handled:
- If markup is 0% (or no difference), the row won’t appear.
- If it’s negative (discount), it will show as a negative line item.

### 3) Ensure the bottom Subtotal / GST / Total summary matches the table
Keep the bottom totals driven by `estimate.total_amount`, but ensure they remain consistent:
- Subtotal (ex GST): `estimate.total_amount / 1.1`
- GST (10%): `estimate.total_amount - (estimate.total_amount / 1.1)`
- Total (inc GST): `estimate.total_amount`

After step (2), the **sum of the table** will match this **Total (inc GST)**.

### 4) Fix the header tables alignment (the two top tables)
In the Minimal template header section:

- Prevent the business name header from wrapping and pushing the table down:
  - add `whitespace-nowrap` + `truncate` + a fixed height line container so both sides have identical header height
- Make both tables use the same column sizing:
  - add `table-fixed` and a matching `<colgroup>` (same first-column width) to both tables

This will align:
- the top of both tables
- each row height
- label/value columns visually

### 5) Quick verification checklist (important)
1. Open an estimate that has a non-zero markup (e.g. _globalMargin = 15%).
2. Confirm:
   - Scope rows show different values for **Price** vs **Total Inc GST**
   - The table includes a **Markup (15%)** row
   - The **sum of Total Inc GST** column equals the grand total shown at the bottom
3. Check a 0% markup estimate:
   - Markup row should not appear
4. Confirm the two header tables align on desktop and when printing.

---

## Files to change
- `src/components/estimates/PrintableEstimate.tsx`
  - Minimal template line item calculations
  - Add “Markup/Adjustment” row
  - Header table alignment improvements

(No database migrations, no backend changes required.)

---

## Notes / options (if you prefer a different look)
If you don’t want to show a separate “Markup” line, we can alternatively **distribute the markup proportionally across scope totals** so the table still sums perfectly without an extra row. Defaulting to a separate row is the clearest accounting-wise and matches the “missing line item” issue you’re seeing.
