

## Fix: "cannot insert a non-default total into column total"

### Root Cause

The `estimate_items.total` column is a **generated column** in the database -- Postgres automatically calculates it from `quantity * unit_price`. When the Quick Quote dialog tries to insert rows with an explicit `total` value, Postgres rejects it.

### Fix

Remove `total` from the insert payload in `QuickQuoteDialog.tsx`. Two places need updating:

**File: `src/components/estimates/QuickQuoteDialog.tsx`**

1. **Line 273** -- Remove `total: item.total` from the line item insert mapping
2. **Line 285** -- Remove `total: gstAmount` from the GST line item insert

The insert objects should only include `estimate_id`, `description`, `quantity`, `unit`, `unit_price`, and `sort_order`. Postgres will compute `total` automatically.

### Technical Detail

```text
Before (causes error):
  { estimate_id, description, quantity, unit, unit_price, total, sort_order }

After (works):
  { estimate_id, description, quantity, unit, unit_price, sort_order }
```

This is a one-file, two-line fix. No database changes needed.
