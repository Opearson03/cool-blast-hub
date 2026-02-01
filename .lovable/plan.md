
# Expand PourHub Inbox with Plans to Quote Support

## Overview

Transform the inbound email system from separate docket widgets into a unified **Inbox** with AI-powered document categorization. Users will be able to email building plans to get quotes, alongside existing test results and delivery dockets.

---

## User Flow

1. User shares their PourHub email address (e.g., `mybusiness@pourhub.au`) with:
   - Builders/clients (for sending plans to quote)
   - Testing labs (for test results)
   - Concrete suppliers (for delivery dockets)

2. When email arrives:
   - AI analyzes the PDF attachment to determine document type
   - Document is categorized into one of three tabs: Plans to Quote, Test Results, Delivery Dockets
   - User is notified on dashboard

3. Dashboard shows unified **Inbox** widget with tabbed interface:
   - **Plans to Quote**: Building plans from clients needing estimates
   - **Test Results**: Concrete test reports from labs
   - **Delivery Dockets**: Concrete delivery dockets from suppliers

---

## Technical Changes

### 1. Database: Add `pending_plans` Table

Create a new table to store incoming building plans that need quoting:

```sql
CREATE TABLE pending_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, converted, rejected
  linked_estimate_id UUID REFERENCES estimates(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE pending_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage pending plans"
ON pending_plans FOR ALL
USING (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin') AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can view pending plans for their business"
ON pending_plans FOR SELECT
USING (business_id = get_user_business_id(auth.uid()));
```

### 2. Update Edge Function: `receive-test-email`

Enhance the document type detection to include building plans:

**New Document Types:**
- `building_plan` - Construction plans, drawings, architectural documents
- `test_result` - Lab test results (existing)
- `delivery_docket` - Concrete delivery dockets (existing)

**Enhanced AI Classification:**
Add a preliminary classification step using AI to determine document type based on:
- Email subject keywords
- Sender email patterns
- PDF content analysis (drawings vs data tables)

**New Keywords for Plans:**
```typescript
const PLAN_KEYWORDS = [
  'plan', 'plans', 'drawing', 'drawings', 'quote', 'quote request',
  'estimate', 'pricing', 'price', 'architectural', 'engineering',
  'structural', 'floor plan', 'site plan', 'blueprint', 'specs',
  'specification', 'tender', 'rfq', 'request for quote'
];
```

**Processing Flow:**
```text
Email Received
     |
     v
[AI Document Classifier]
     |
     +-- building_plan --> pending_plans table
     |
     +-- test_result --> pending_test_results table
     |
     +-- delivery_docket --> pending_documents table
```

**AI System Prompt for Classification:**
```
Analyze this PDF document and classify it into one of these categories:
1. "building_plan" - Construction/architectural drawings, floor plans, site plans, engineering drawings
2. "test_result" - Concrete test reports, lab results, strength tests, cylinder tests
3. "delivery_docket" - Concrete delivery dockets, cartage notes, batch tickets

Return JSON: {"document_type": "building_plan|test_result|delivery_docket", "confidence": 0.0-1.0}
```

### 3. New Component: `InboxWidget`

Replace `UnassignedDocketsWidget` with a new unified inbox widget.

**File:** `src/components/dashboard/InboxWidget.tsx`

**Features:**
- Three tabs: Plans to Quote, Test Results, Delivery Dockets
- Badge showing unread count per tab
- Click to open respective sheet for processing
- Unified empty state when no pending items

**UI Layout:**
```text
+------------------------------------------+
| 📥 Inbox                     12 new      |
+------------------------------------------+
| [Plans (3)] [Tests (5)] [Dockets (4)]    |
+------------------------------------------+
| Recent items based on active tab...      |
|                                          |
| > Floor Plans - John Smith   5 min ago   |
| > Site Plan - ABC Builders   1 hr ago    |
|                                          |
| [View All]                               |
+------------------------------------------+
```

### 4. New Component: `PendingPlansSheet`

**File:** `src/components/jobs/PendingPlansSheet.tsx`

Sheet for reviewing and processing incoming building plans:

**Features:**
- View PDF inline
- AI-extracted data preview (client name, site address if detected)
- Actions:
  - "Start Estimate" - Creates new estimate with plan attached, opens estimate form
  - "Reject" - Mark as spam/irrelevant with reason
- Client details form (name, email, phone, site address)

**UI Flow:**
1. User views plan PDF
2. AI shows any extracted details (client name, address, project type)
3. User can edit/add client details
4. Click "Start Estimate" creates estimate and attaches the plan file

### 5. Update Settings: Unified Email Description

**File:** `src/pages/admin/AdminSettings.tsx`

Rename from "Test Result Email" to "Business Inbox Email"

**Updated Description:**
```
Share this email address with clients, testing labs, and suppliers:

• Builders & Clients - Send plans for quoting
• Testing Labs - Send concrete test results  
• Concrete Suppliers - Send delivery dockets

All documents are automatically sorted and processed by AI.
```

**Updated "How it works" list:**
1. Share your email address with clients, labs, and suppliers
2. They email PDFs (plans, test results, dockets) to your address
3. AI automatically categorizes and extracts key information
4. Review items in your Inbox on the dashboard

### 6. AI Extraction for Building Plans

Add new extraction prompts for building plans in `scan-test-document`:

**System Prompt for Plans:**
```
You are a building plan analyzer. Extract available information from construction/architectural plans.

Extract these fields:
- project_name: The project or job name if visible
- site_address: The site/project address
- client_name: Client or builder name if visible
- architect: Architect or designer name if visible
- plan_type: Type of plan (floor plan, site plan, structural, etc.)
- drawing_number: Drawing/plan number if visible
- revision: Revision number or date
- scale: Drawing scale if shown
- notes: Any relevant notes or special requirements

Return ONLY valid JSON...
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/InboxWidget.tsx` | Unified inbox widget with tabs |
| `src/components/jobs/PendingPlansSheet.tsx` | Sheet for reviewing/converting plans to estimates |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/receive-test-email/index.ts` | Add plan detection, AI classification step, route to pending_plans |
| `supabase/functions/scan-test-document/index.ts` | Add building_plan document type with extraction prompts |
| `src/pages/admin/AdminDashboard.tsx` | Replace UnassignedDocketsWidget with InboxWidget |
| `src/pages/admin/AdminSettings.tsx` | Update email section title and description |
| `src/components/settings/TestResultEmailSection.tsx` | Rename and update description |

## Database Migration

| Change | Description |
|--------|-------------|
| Create `pending_plans` table | Store incoming building plans |
| Add RLS policies | Admin full access, staff read access |

---

## Implementation Sequence

1. **Database**: Create `pending_plans` table with RLS
2. **Edge Function**: Update `receive-test-email` with AI classification
3. **Edge Function**: Add building_plan support to `scan-test-document`
4. **Component**: Create `PendingPlansSheet` for plan review
5. **Component**: Create `InboxWidget` with tabbed interface
6. **Dashboard**: Replace old widget with new InboxWidget
7. **Settings**: Update email section copy and description

---

## Benefits

1. **Unified Experience**: One inbox for all incoming documents
2. **Faster Quoting**: Clients can email plans directly, reducing back-and-forth
3. **AI-Powered Sorting**: No manual categorization needed
4. **Streamlined Workflow**: Plans flow directly into estimate creation
5. **Clear Communication**: Settings explain all email use cases

