

# BOQ Click-to-Select and Inline Editing Improvements

## Overview
This plan transforms the Bill of Quantities (BOQ) interface from a dialog-based editing model to a more intuitive click-to-interact pattern. Users will be able to click items directly to add them to orders, click totals for inline editing, and add new items without opening a separate dialog.

## Current Issues
1. **Order Selection**: Users must open a separate dialog and check boxes to select items for ordering
2. **Editing**: The edit popup requires navigating through many form fields for each item - overly complex for quick edits
3. **Adding Items**: No way to add items directly from the main BOQ view

## Proposed Changes

### 1. Click-to-Select for Ordering
Transform table rows into selectable items that can be added to the order list with a simple click:

- Add a checkbox column (leftmost) to each row
- Clicking anywhere on the row toggles selection
- Selected items get a highlight/border style
- "Order" button count updates in real-time based on selection
- Clicking "Order" opens the dialog with pre-selected items

**Visual feedback:**
- Selected rows: Left border highlight + subtle background color
- Hover state: Row highlights to indicate clickability

### 2. Inline Editing for Unit Price and Total
Replace the dialog-based editing with click-to-edit functionality on price columns:

- **Unit Price column**: Clicking reveals an inline input field
- **Total column**: Clicking reveals an inline input field (auto-calculates if unit price x qty)
- Use the existing inline edit pattern from `PriceListTable.tsx` (edit icon appears on hover, Enter to save, Escape to cancel)
- Changes save immediately to the database on confirm

**Edit mode UI:**
- Small input field replaces the text
- Check/X buttons for confirm/cancel
- Enter key to save, Escape to cancel

### 3. Quick Add Item
Add an "Add Item" row at the bottom of each category or at the table footer:

- A persistent "+" button or "Add Item" row at the bottom of the BOQ
- Clicking opens an inline row with empty fields for:
  - Category dropdown
  - Description input
  - Quantity input
  - Unit dropdown
  - Unit Price input
- Pressing Enter or clicking a confirm button adds the item
- Total auto-calculates from Qty x Unit Price

### 4. Simplified Edit Button
The "Edit" button will now only open a simplified dialog for:
- General notes editing
- Bulk delete functionality
- Re-ordering items (if needed in future)

---

## Technical Implementation

### File Changes

**1. `src/components/jobs/boq/BOQCard.tsx`**
- Add `selectedForOrder` state: `useState<string[]>([])` to track selected item IDs
- Add `editingItemId` state: `useState<string | null>(null)` to track inline editing
- Add `editingField` state to track which field is being edited (unitPrice or totalPrice)
- Modify `TableRow` to be clickable for selection toggle
- Add checkbox column to table
- Add click handler on price/total cells to enable inline edit mode
- Add inline input components for editing (following PriceListTable pattern)
- Pass `selectedForOrder` to `SendPurchaseOrderDialog` as initial selection
- Add mutation for updating individual items in-place

**2. `src/components/jobs/boq/BOQInlineItemRow.tsx` (new file)**
A reusable component for inline item editing/creation:
- Category dropdown
- Description text input
- Quantity number input
- Unit dropdown
- Unit Price number input
- Total (auto-calculated or manual override)
- Save/Cancel action buttons

**3. `src/components/jobs/boq/SendPurchaseOrderDialog.tsx`**
- Accept optional `preSelectedItems` prop for items already selected from BOQCard
- Initialize `selectedItems` from this prop if provided

**4. `src/components/jobs/boq/BOQEditDialog.tsx`**
- Simplify to focus on general notes and bulk operations
- Remove individual item editing (now handled inline)
- Keep item deletion and reordering if needed

---

## User Flow

### Selecting Items for Order
```text
1. User views BOQ card
2. Clicks on row(s) they want to order
3. Checkbox toggles, row highlights, Order button count updates
4. Clicks "Order (3)" button
5. Dialog opens with those 3 items pre-selected
```

### Editing a Price
```text
1. User hovers over Unit Price or Total column
2. Cell shows edit indicator (pencil icon or cursor change)
3. User clicks the cell
4. Inline input appears with current value
5. User types new value
6. Presses Enter or clicks checkmark
7. Value saves immediately, input reverts to text display
```

### Adding a New Item
```text
1. User clicks "+ Add Item" row at bottom
2. New inline row appears with empty fields
3. User fills in Description, Qty, Unit, Unit Price
4. Presses Enter or clicks Save
5. Item appears in the BOQ list
```

---

## UI/UX Considerations

- **Selection visual**: Use a left border accent color + subtle background tint for selected rows
- **Ordered items**: Keep current styling (opacity-60, line-through) and disable selection
- **Mobile-friendly**: Ensure touch targets are adequate; consider swipe-to-select on mobile
- **Keyboard navigation**: Support Tab to move between inline fields, Enter to save
- **Error handling**: Show toast for save errors, keep edit mode open on failure

---

## Database Interaction

All inline edits will update the `job_boq` table's `items` JSONB column:

```typescript
// Update single item inline
const updatedItems = boq.items.map(item => 
  item.id === editingItemId ? { ...item, unitPrice: newPrice, totalPrice: newTotal } : item
);
await supabase.from("job_boq").update({ items: updatedItems }).eq("id", boq.id);
```

For adding new items:
```typescript
const newItem: BOQItem = { id: Date.now().toString(), category, description, quantity, unit, unitPrice, totalPrice };
await supabase.from("job_boq").update({ items: [...boq.items, newItem] }).eq("id", boq.id);
```

