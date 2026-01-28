

# Plan: Delivery Docket Ingestion & Document Folders

## Status: ✅ IMPLEMENTED

## Overview

Extended the email ingestion system to handle delivery dockets (from concrete suppliers) and added folder-based organization to the Job Documents tab.

## Implementation Summary

### 1. Database Changes ✅

- Added `subfolder` column to `documents` table (default: 'general')
- Created `pending_documents` table for delivery docket review workflow
- Added proper RLS policies for business-level access control
- Created indexes for efficient querying

### 2. Edge Function Updates ✅

Modified `receive-test-email` to:
- Detect document type from subject/filename using keyword matching
- Route delivery dockets to `pending_documents` table
- Route test results to `pending_test_results` table (existing behavior)
- Organize storage by document type (dockets/ vs tests/)

### 3. Document Folders UI ✅

Updated `JobDocumentsTab.tsx` with:
- Folder tabs: All, Dockets, Plans, Quotes, Photos, Other
- Document counts per folder
- Folder selection dialog when uploading
- Subfolder badge on document cards

### 4. Pending Documents Review ✅

Created `PendingDocumentsSheet.tsx` for admins to:
- View incoming delivery dockets
- See AI-extracted data (docket #, m³, supplier, date, mix code)
- Select Job and Pour to assign
- Choose destination folder
- Approve → moves to documents table

---

## Files Modified

| File | Changes |
|------|---------|
| SQL Migration | Added `subfolder` column, `pending_documents` table with RLS |
| `supabase/functions/receive-test-email/index.ts` | Document type detection and routing |
| `src/components/jobs/tabs/JobDocumentsTab.tsx` | Folder tabs, upload with folder selection |
| `src/components/jobs/PendingDocumentsSheet.tsx` | New review component for delivery dockets |

---

## Keyword Detection Logic

**Delivery Dockets** (triggers routing to pending_documents):
- docket, delivery, cartage, truck, load, batch, dispatch, concrete delivery

**Test Results** (triggers routing to pending_test_results):
- test, lab, result, mpa, strength, cylinder, slump, 7 day, 28 day, compressive

---

## User Flow

### Receiving a Delivery Docket:
1. Supplier emails PDF to `alias@pourhub.au`
2. Edge function detects "delivery docket" from keywords
3. PDF uploaded, pending_documents record created
4. Admin opens PendingDocumentsSheet, reviews extracted data
5. Admin selects Job, Pour, and folder → Approve
6. Document appears in Job's Documents tab under chosen folder

### Manual Upload:
1. Admin clicks Upload in Documents tab
2. Selects file(s)
3. Dialog prompts for folder selection
4. Document saved with chosen subfolder
