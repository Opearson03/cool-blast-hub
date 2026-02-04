
# Supplier Quote Replies in Inbox

## Overview
This plan adds a new "Quote" category to the inbox system for handling supplier quote replies. When a supplier responds to an RFQ email with their pricing, users can directly action it by converting to a Purchase Order with job allocation, delivery date, and onsite contact details.

## Current Architecture
- Inbox currently supports 4 types: `plan`, `test`, `docket`, `general`
- Each type has its own database table (`pending_plans`, `pending_test_results`, `pending_documents`, `pending_general`)
- Inbound emails are processed by `receive-test-email` edge function which detects document type and routes accordingly
- RFQs are stored in `purchase_orders` table with status `quote_requested`
- When suppliers reply, these need to be linked back to the original RFQ

## Solution Design

### 1. New Database Table: `pending_quotes`
Create a table to store incoming quote responses from suppliers:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| business_id | uuid | Business reference |
| from_email | text | Supplier's email |
| from_name | text | Supplier name (if detected) |
| subject | text | Email subject |
| received_at | timestamp | When received |
| file_url | text | Attached quote PDF |
| file_name | text | Filename |
| email_body | text | Email content |
| status | text | pending/converted |
| linked_rfq_id | uuid | Matched purchase_orders.id |
| linked_job_id | uuid | Job to assign PO to |

### 2. Update Email Routing
Modify `receive-test-email` edge function to detect quote responses:

**Detection Logic:**
- Check if sender email matches any `supplier_email` in `purchase_orders` where `status = 'quote_requested'`
- Look for keywords: "quote", "pricing", "RFQ", "quotation", "price list"
- Match email subject containing RFQ numbers (e.g., "RE: RFQ-0002")
- Auto-link to the matching RFQ record

### 3. Frontend Changes

**InboxHistoryTab.tsx:**
- Add "quote" type to the `InboxItem` interface
- Fetch from new `pending_quotes` table
- Add filter option for "Quotes"
- Add dollar sign icon for quote type

**InboxDetailSheet.tsx:**
- Show quote-specific action button: "Convert to PO"
- Display linked RFQ information if available
- Add reclassify option for quote type

**New Component: ActionQuoteDialog.tsx**
A dialog that allows users to convert a quote into a Purchase Order:
- Job selection (pre-filled if linked RFQ has job_id)
- Delivery date picker
- Onsite contact (employee dropdown or manual entry)
- Delivery address (pre-filled from job site address)
- Notes field
- Shows original RFQ items with ability to update prices from quote

### 4. User Flow

```text
1. Supplier receives RFQ email for materials
2. Supplier replies with quote (PDF attachment with pricing)
3. Email arrives → detected as "quote" → stored in pending_quotes
4. If sender matches existing RFQ supplier email, auto-link to RFQ
5. User sees quote in Inbox with "Pending" status
6. User clicks quote → detail sheet shows quote info + linked RFQ
7. User clicks "Convert to PO" button
8. Dialog opens with:
   - Pre-filled job (from linked RFQ)
   - Items from original RFQ with editable prices
   - Delivery date picker
   - Onsite contact selector
   - Delivery address
9. User confirms → PO created and sent to supplier
10. Quote marked as "converted"
```

---

## Technical Implementation

### Database Migration

```sql
-- Create pending_quotes table
CREATE TABLE pending_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_url TEXT,
  file_name TEXT,
  email_body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  linked_rfq_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  linked_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE pending_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pending quotes" ON pending_quotes
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND business_id = get_user_business_id(auth.uid())
  );

CREATE POLICY "Users can view pending quotes for their business" ON pending_quotes
  FOR SELECT USING (business_id = get_user_business_id(auth.uid()));
```

### Edge Function Updates

**receive-test-email/index.ts:**

Add quote detection keywords:
```typescript
const QUOTE_RESPONSE_KEYWORDS = [
  'quote', 'quotation', 'pricing', 'price list', 
  'rfq', 'request for quote', 'attached quote',
  'here is our quote', 'please find attached', 'as requested'
];
```

Add RFQ matching logic:
```typescript
async function matchQuoteToRFQ(
  supabase: any,
  businessId: string,
  fromEmail: string,
  subject: string
): Promise<{ rfqId: string | null; jobId: string | null }> {
  // Try to match by supplier email
  const { data: rfqs } = await supabase
    .from('purchase_orders')
    .select('id, job_id, po_number, supplier_email')
    .eq('business_id', businessId)
    .eq('status', 'quote_requested')
    .ilike('supplier_email', fromEmail);

  if (rfqs && rfqs.length > 0) {
    // Check if subject contains RFQ number
    const subjectLower = subject?.toLowerCase() || '';
    const matchedRfq = rfqs.find(rfq => 
      subjectLower.includes(rfq.po_number.toLowerCase())
    ) || rfqs[0];
    
    return { rfqId: matchedRfq.id, jobId: matchedRfq.job_id };
  }
  
  return { rfqId: null, jobId: null };
}
```

### Frontend Components

**Files to modify:**
1. `src/components/contacts/InboxHistoryTab.tsx` - Add quote type handling
2. `src/components/contacts/InboxDetailSheet.tsx` - Add quote action button

**New files:**
1. `src/components/contacts/ActionQuoteDialog.tsx` - Convert quote to PO dialog

**ActionQuoteDialog.tsx structure:**
- Pre-fetch linked RFQ details
- Display original RFQ items with editable unit prices
- Job selector (disabled if linked to RFQ)
- Delivery date picker (required)
- Onsite contact selector (employees from the business)
- Delivery address input (pre-filled from job)
- Notes textarea
- Submit creates new PO via `send-purchase-order` function

---

## Visual Changes

**Inbox List:**
- New icon: `DollarSign` from lucide-react
- Badge: "Quote" in green color
- Shows supplier name and linked RFQ number if available

**Quote Detail Sheet:**
- Shows email body and attached PDF
- Displays linked RFQ info box if matched
- "Convert to PO" primary action button
- Reclassify options include quote type

**Action Quote Dialog:**
- Two-column layout on desktop
- Left: Quote preview (PDF)
- Right: PO form fields
- Items table with editable prices
- Calculate totals dynamically
