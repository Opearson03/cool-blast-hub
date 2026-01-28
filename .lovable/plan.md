

# Plan: Delivery Docket Ingestion & Document Folders

## Overview

Extend the email ingestion system to handle delivery dockets (from concrete suppliers) and add a folder-based organization to the Job Documents tab.

## Current System Explanation

### How the system identifies which user receives a test docket:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                    EMAIL ROUTING FLOW                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Lab sends email to: democrete@pourhub.au                            │
│                          ↓                                               │
│  2. Resend webhook fires → Edge function receives payload                │
│                          ↓                                               │
│  3. Extract alias from "to" address:                                     │
│     "democrete@pourhub.au" → alias = "democrete"                        │
│                          ↓                                               │
│  4. Database lookup:                                                     │
│     SELECT * FROM businesses WHERE inbound_email_alias = 'democrete'    │
│                          ↓                                               │
│  5. Found: Demo Concrete business (ID: abc-123)                          │
│     → All documents are now linked to this business_id                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### How does the system know which pour to assign it to?

Currently, this is a **manual approval step**:
1. PDF is uploaded and AI extracts data (test ID, MPa values, dates, supplier)
2. Business admin reviews the pending result
3. Admin manually selects the correct **Job** and **Pour** from dropdowns
4. Upon approval, the test result is linked and moved to `concrete_tests`

This is intentional because labs rarely include structured job identifiers that would allow automatic matching.

---

## Changes for Delivery Dockets & Document Folders

### 1. Database Changes

**Add `subfolder` column to `documents` table:**
```sql
ALTER TABLE documents 
ADD COLUMN subfolder TEXT DEFAULT 'general';
```

This allows categorizing documents within a job into folders like:
- `delivery_dockets`
- `plans`
- `quotes_retentions`
- `site_photos`
- `general`

**Create `pending_documents` table for delivery docket review:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `business_id` | uuid | FK to businesses |
| `from_email` | text | Sender's email |
| `subject` | text | Email subject |
| `received_at` | timestamptz | When received |
| `file_url` | text | Storage URL for PDF |
| `file_name` | text | Original filename |
| `extracted_data` | jsonb | AI-extracted fields (docket #, m³, supplier, date) |
| `document_type` | text | 'delivery_docket', 'invoice', etc. |
| `status` | text | pending, approved, rejected |
| `linked_job_id` | uuid | Set on approval |
| `linked_pour_id` | uuid | Optional pour link |

### 2. Update Edge Function

Modify `receive-test-email` to:
1. Detect document type from email subject/sender/filename:
   - Keywords like "docket", "delivery", "cartage" → delivery docket
   - Keywords like "test", "lab", "results" → test result
2. Route to appropriate table (`pending_test_results` or `pending_documents`)
3. Use appropriate AI extraction for each type

**Detection Logic:**
```text
Subject: "Delivery Docket #12345 - 123 Smith St"
        → Type: delivery_docket
        → Extract: docket_number, volume_m3, supplier, delivery_date

Subject: "Test Results - Project ABC - 28 Day"
        → Type: test_result
        → Extract: test_id, mpa_values, test_date, pour_date
```

### 3. Document Folders UI

**Update `JobDocumentsTab.tsx` to show folder tabs:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  Documents & Photos                              [+ Upload]     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┬─────────────┬─────────────────┬──────────┐   │
│  │ All (12)     │ Dockets (5) │ Plans (3)       │ Other(4) │   │
│  └──────────────┴─────────────┴─────────────────┴──────────┘   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 📄           │  │ 📄           │  │ 📄           │          │
│  │ Docket-001   │  │ Docket-002   │  │ Site Plan    │          │
│  │ 28 Jan 2026  │  │ 28 Jan 2026  │  │ 15 Jan 2026  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

**Folder Categories:**
- **All** - Shows all documents
- **Delivery Dockets** - `subfolder = 'delivery_dockets'`
- **Plans** - `subfolder = 'plans'`
- **Quotes & Retentions** - `subfolder = 'quotes_retentions'`
- **Site Photos** - `subfolder = 'site_photos'`
- **Other** - `subfolder = 'general'`

### 4. Pending Documents Review

Create a new `PendingDocumentsSheet` component (similar to `PendingTestResultsSheet`) where admins can:
1. See incoming delivery dockets
2. View AI-extracted data (docket #, m³, supplier, date)
3. Select which Job and Pour to assign
4. Choose the subfolder
5. Approve → moves to `documents` table with correct job/pour/subfolder

### 5. AI Extraction for Delivery Dockets

Use the existing `scan-test-document` function pattern to extract:
- **Docket Number** (e.g., "D-123456")
- **Delivery Date/Time**
- **Volume** (m³)
- **Supplier Name** (Boral, Holcim, etc.)
- **Mix Code** (N32/20/80)
- **Truck Rego**
- **Site Address** (for smart job matching)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| SQL Migration | Add `subfolder` to documents, create `pending_documents` table |
| `supabase/functions/receive-test-email/index.ts` | Add document type detection and routing |
| `src/components/jobs/tabs/JobDocumentsTab.tsx` | Add folder tabs/filtering UI |
| `src/components/jobs/PendingDocumentsSheet.tsx` | New review component for delivery dockets |
| `supabase/functions/scan-delivery-docket/index.ts` | Optional: dedicated AI extraction for dockets |

---

## User Flow

### Receiving a Delivery Docket:

1. Concrete supplier emails delivery docket PDF to `democrete@pourhub.au`
2. System detects "delivery docket" from keywords
3. Uploads PDF, extracts data (docket #, m³, supplier)
4. Creates pending document record
5. Admin sees notification "1 pending delivery docket"
6. Admin reviews, selects Job/Pour, approves
7. Document appears in Job's Documents tab → "Delivery Dockets" folder

### Uploading Manually:

1. Admin clicks "Upload" in Documents tab
2. Selects file and folder category
3. Document is saved to the chosen folder

