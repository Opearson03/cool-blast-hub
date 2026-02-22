

## Quick Quote Feature

A new "Quick Quote" dialog on the Quotes page that lets users rapidly create and send a simple quote -- similar in UX to the "Quick Add - Misc Job" popup. Works on all devices including mobile (no takeoff required).

### How It Works

1. User clicks a **"Quick Quote"** button next to the existing "New Estimate" button on the Quotes page.
2. A dialog opens with a simple form:
   - **Client details**: Name, email, phone, company (optional), site address
   - **Line items**: Add rows with description, quantity, unit, unit price -- total auto-calculated per row
   - **Notes** (optional)
   - **GST toggle** (default on, adds 10%)
3. On submit:
   - Creates a new `estimates` row with `estimate_type: 'quick_quote'`, status `'pending'`, and the line items stored in `estimate_items`.
   - Auto-generates the next estimate number.
   - Generates the PDF client-side using the existing `PrintableEstimate` / `generateQuotePDF` pipeline.
   - Sends via the existing `send-estimate-email` edge function.
   - If no client email is provided, saves as a pending estimate without sending.

### What Changes

| File | Change |
|---|---|
| `src/components/estimates/QuickQuoteDialog.tsx` | **New file** -- the dialog component with the form, line items table, and send logic |
| `src/pages/admin/AdminEstimates.tsx` | Add "Quick Quote" button next to "New Estimate", import and render the new dialog. Not gated by `isMobile`. |

### Technical Details

**QuickQuoteDialog.tsx** -- New Component

- **Pattern**: Mirrors `MiscJobFormDialog` structure (Dialog, scrollable form, state reset on close, mutation for save).
- **Line items state**: Array of `{ id, description, quantity, unit, unitPrice, total }` managed with add/update/remove helpers (similar to `ExtraItemsInput` pattern).
- **Estimate number**: Generated using the same pattern as existing estimates -- query max estimate_number, increment.
- **Save flow**:
  1. Insert into `estimates` table (client_name, site_address, client_email, client_phone, company_name, total_amount, status, estimate_type='quick_quote', notes).
  2. Insert line items into `estimate_items` table.
  3. If client email is provided, generate PDF via `generateQuotePDF` and invoke `send-estimate-email`, setting status to `'sent'`.
  4. If no email, save as `'pending'` for later sending from the detail sheet.
- **GST**: Subtotal calculated from line items, GST = subtotal * 0.10, total = subtotal + GST (when enabled). Stored `total_amount` includes GST.
- **Mobile friendly**: Simple inputs, no canvas/takeoff -- works on all screen sizes.

**AdminEstimates.tsx** -- Button Addition

- Add a secondary/outline "Quick Quote" button that opens `QuickQuoteDialog`.
- This button is NOT blocked by the mobile check.
- Still respects the estimate quota check before opening.

**Reuses existing infrastructure**:
- `generateQuotePDF` for PDF generation
- `send-estimate-email` edge function for delivery
- `PrintableEstimate` for consistent quote formatting
- `formatCurrency` for display
- Business branding fetched the same way as `EstimateDetailSheet`
