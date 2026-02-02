

# BOQ Ordering and Purchase Orders

## Overview

Enhance the Bill of Quantities feature to:
1. Track items as "ordered" (checklist functionality)
2. Send Purchase Orders to suppliers via Email or SMS
3. Include delivery address based on job site address

---

## Current State

- **BOQ Items** are stored in `job_boq.items` as a JSONB array
- Each item has: `id`, `category`, `description`, `quantity`, `unit`, `unitPrice`, `totalPrice`, `notes`
- **Business suppliers** are stored as simple strings in `businesses.preferred_suppliers[]`
- Twilio (SMS) and Resend (Email) are already configured

---

## Technical Changes

### 1. Update BOQItem Type

Add `ordered` status and optional `supplier` field to track ordering:

**File: `src/components/jobs/boq/BOQTypes.ts`**

```typescript
export interface BOQItem {
  id: string;
  category: 'concrete' | 'reinforcement' | 'formwork' | 'finishing' | 'other';
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  ordered?: boolean;      // NEW: Track if item has been ordered
  orderedAt?: string;     // NEW: When it was marked ordered
}
```

### 2. Create Supplier Contacts Table

Store supplier contact details for sending POs:

```sql
CREATE TABLE supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  category TEXT DEFAULT 'general',  -- concrete, reinforcement, formwork, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage supplier contacts for their business"
ON supplier_contacts FOR ALL
USING (business_id = get_user_business_id(auth.uid()))
WITH CHECK (business_id = get_user_business_id(auth.uid()));
```

### 3. Create Purchase Orders Table

Track sent POs for history:

```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  boq_id UUID NOT NULL REFERENCES job_boq(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_contact_id UUID REFERENCES supplier_contacts(id),
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  supplier_phone TEXT,
  delivery_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',  -- Selected BOQ items
  notes TEXT,
  sent_via TEXT,  -- 'email', 'sms', 'both'
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage POs for their business"
ON purchase_orders FOR ALL
USING (business_id = get_user_business_id(auth.uid()))
WITH CHECK (business_id = get_user_business_id(auth.uid()));
```

---

## UI Components

### 4. Update BOQCard - Add Ordered Checkboxes

**File: `src/components/jobs/boq/BOQCard.tsx`**

Add checkbox column to mark items as ordered:

- Add checkbox column before Description
- Toggle updates `ordered` flag in items array
- Show visual indicator (strikethrough or checkmark) for ordered items
- Add "Send PO" button to header actions

```text
[ ] Description | Qty | Unit | Price | Total
[x] N32 Concrete | 45 | m³ | $250 | $11,250 ← Ordered items shown with checkmark
[ ] SL82 Mesh | 120 | m² | $18 | $2,160
```

### 5. Create SendPurchaseOrderDialog

**New file: `src/components/jobs/boq/SendPurchaseOrderDialog.tsx`**

Dialog for creating and sending purchase orders:

1. **Item Selection**
   - Show unordered BOQ items with checkboxes
   - Select which items to include in PO
   - Show quantities and descriptions

2. **Supplier Selection**
   - Dropdown to select from saved supplier contacts
   - Option to enter new supplier details manually
   - Save new supplier for future use checkbox

3. **Delivery Details**
   - Pre-fill with job site address
   - Allow editing if needed
   - Add delivery notes field

4. **Send Method**
   - Radio buttons: Email / SMS / Both
   - Show recipient email/phone based on selection
   - Validate required fields

5. **Send Action**
   - Generate PO number (e.g., "PO-001")
   - Call edge function to send
   - Mark selected items as "ordered" in BOQ
   - Save PO record for history

### 6. Create Edge Function: send-purchase-order

**New file: `supabase/functions/send-purchase-order/index.ts`**

Handles sending PO via email and/or SMS:

**Email Content:**
- Business branding (logo, colors)
- PO number and date
- Delivery address
- Line items table: Description | Qty | Unit
- Notes
- Business contact details

**SMS Content:**
```
PO {po_number} from {business_name}
Deliver to: {delivery_address}
Items: {item_count} items
View details: {link} (optional)
Reply to confirm
```

### 7. Update BOQEditDialog

**File: `src/components/jobs/boq/BOQEditDialog.tsx`**

- No changes needed - ordered status is managed from the card view, not the edit dialog

### 8. Add Supplier Contact Management

**New file: `src/components/jobs/boq/SupplierContactDialog.tsx`**

Simple dialog to add/edit supplier contacts:
- Name, Company, Phone, Email
- Category dropdown (Concrete, Reinforcement, Formwork, etc.)
- Notes field
- Accessed from Settings or quick-add in PO dialog

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/jobs/boq/BOQTypes.ts` | Modify | Add `ordered`, `orderedAt` fields |
| `src/components/jobs/boq/BOQCard.tsx` | Modify | Add checkboxes, Send PO button, ordered toggle |
| `src/components/jobs/boq/SendPurchaseOrderDialog.tsx` | Create | PO creation and sending dialog |
| `src/components/jobs/boq/SupplierContactDialog.tsx` | Create | Add/edit supplier contacts |
| `supabase/functions/send-purchase-order/index.ts` | Create | Send PO via email/SMS |
| Database migration | Create | `supplier_contacts` and `purchase_orders` tables |

---

## User Flow

### Marking Items as Ordered
1. View BOQ on job page
2. Click checkbox next to an item
3. Item is marked as ordered with timestamp
4. Visual feedback (checkmark, subtle styling)

### Sending a Purchase Order
1. Click "Send PO" button on BOQ card
2. Dialog opens showing unordered items
3. Select items to include in PO
4. Choose or enter supplier details
5. Confirm delivery address (pre-filled from job)
6. Select send method (Email/SMS/Both)
7. Click "Send Purchase Order"
8. Selected items automatically marked as ordered
9. PO saved to history

---

## Data Flow

```text
User clicks "Send PO"
       ↓
SendPurchaseOrderDialog opens
       ↓
User selects items + supplier + send method
       ↓
Frontend calls send-purchase-order edge function
       ↓
Edge function:
  - Generates PO number
  - Creates PO record in database
  - Sends email via Resend (if selected)
  - Sends SMS via Twilio (if selected)
  - Returns success
       ↓
Frontend:
  - Updates BOQ items as "ordered"
  - Shows success toast
  - Closes dialog
```

