
## Goal
Ensure the Customer Details and Business Details tables in the Minimal quote template have identical dimensions and align perfectly horizontally (row-for-row).

---

## Current Issue
From the screenshot, both tables have 4 rows but they don't align horizontally because:
1. **Text wrapping** - Labels like "Quote valid until" wrap to two lines while "ABN" stays on one line
2. **No fixed row heights** - Rows expand based on content, causing misalignment
3. **Cell content overflow** - Long values can push row heights inconsistently

---

## Implementation Plan

### File: `src/components/estimates/PrintableEstimate.tsx`

**Changes to the Minimal template header section (lines ~1148-1207):**

1. **Add fixed row heights to all table cells**
   - Add explicit height and vertical alignment to ensure all rows match
   - Use `h-[36px]` or similar fixed height on each `<td>`
   - Add `align-top` to keep content aligned at top of cell

2. **Prevent text wrapping in label cells**
   - Add `whitespace-nowrap` to the label (first column) cells
   - This ensures "Quote valid until" stays on one line

3. **Add truncation for long values**
   - Ensure value cells have `truncate` class to prevent overflow

4. **Apply consistent styling to both tables**
   - Both tables use identical cell classes
   - Both have matching `colgroup` widths (already 40%/60%)

### Code Changes

**Left table (Customer Details) - update each row's cells:**
```tsx
<tr>
  <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Customer name</td>
  <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">...</td>
</tr>
```

**Right table (Business Details) - update each row's cells:**
```tsx
<tr>
  <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap align-top h-[36px]">Email</td>
  <td className="border border-gray-300 px-3 py-2 text-gray-900 truncate align-top h-[36px]">...</td>
</tr>
```

---

## Result
- Both tables will have exactly 4 rows
- Each row will be exactly 36px tall
- Labels won't wrap (preventing "Quote valid until" from becoming two lines)
- Long values will truncate with ellipsis instead of wrapping
- Tables will align perfectly side-by-side, row-for-row

---

## Files to Change
- `src/components/estimates/PrintableEstimate.tsx`
  - Add fixed heights and `whitespace-nowrap` to all 8 rows (4 per table)
  - Ensure `truncate` is on all value cells

No backend changes required.
