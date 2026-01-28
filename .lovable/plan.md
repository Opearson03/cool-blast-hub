

# Plan: Smart Auto-Assignment for Emailed Documents

## Overview

Implement intelligent auto-assignment of emailed test results and delivery dockets by matching extracted address/date data against jobs and pours. Add a dashboard widget for unassigned documents.

## Assignment Logic

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTO-ASSIGNMENT FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Email received → AI extracts: address + date                               │
│                          ↓                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ MATCH LOGIC:                                                         │   │
│  │                                                                      │   │
│  │ 1. Address + Date match?                                            │   │
│  │    → Auto-assign to Job + Pour (status: 'auto_matched')             │   │
│  │                                                                      │   │
│  │ 2. Address only match?                                              │   │
│  │    → Pre-link to Job, show in Job's Test Results tab as             │   │
│  │      "Unassigned to Pour" (status: 'job_matched')                   │   │
│  │                                                                      │   │
│  │ 3. No match?                                                        │   │
│  │    → Show in Dashboard "Assign Dockets" widget                      │   │
│  │      (status: 'pending')                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Changes

### Update `pending_test_results` and `pending_documents` tables

Add columns to track matching status:

```sql
-- Add status options for better tracking
-- Current: 'pending', 'approved', 'rejected'
-- New: 'pending' (no match), 'job_matched' (address matched), 
--      'auto_matched' (address+date matched), 'approved', 'rejected'

ALTER TABLE pending_test_results 
  ADD COLUMN match_status TEXT DEFAULT 'pending',
  ADD COLUMN matched_job_id UUID REFERENCES jobs(id),
  ADD COLUMN matched_pour_id UUID REFERENCES job_pours(id),
  ADD COLUMN match_confidence NUMERIC;

ALTER TABLE pending_documents 
  ADD COLUMN match_status TEXT DEFAULT 'pending',
  ADD COLUMN matched_job_id UUID REFERENCES jobs(id),
  ADD COLUMN matched_pour_id UUID REFERENCES job_pours(id),
  ADD COLUMN match_confidence NUMERIC;
```

### Update AI extraction prompts

Modify `scan-test-document` to extract addresses:

For **Test Results**:
- Add `site_address` to extracted fields
- Continue extracting `pour_date`

For **Delivery Dockets**:
- Already extracts `site_address` and `delivery_date`

## Edge Function Changes

### Update `receive-test-email`

After AI extraction, attempt auto-matching:

```text
1. Extract site_address from document
2. Fuzzy match against all jobs for this business:
   - Normalize addresses (lowercase, remove punctuation)
   - Check if extracted address contains job address or vice versa
   - Calculate match confidence (0-100%)

3. If address matches (confidence > 70%):
   - Set matched_job_id
   - Try to match date against job's pours:
     - Compare extracted date to pour_date within ±2 days
   - If pour matches:
     - Set matched_pour_id
     - Set match_status = 'auto_matched'
   - Else:
     - Set match_status = 'job_matched'

4. If no address match:
   - Set match_status = 'pending'
```

## Frontend Changes

### 1. Dashboard Widget: "Assign Dockets"

Add new widget to `AdminDashboard.tsx`:

```text
┌─────────────────────────────────────────────────────────────────┐
│  📬 Assign Dockets                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐ │
│  │ 🧪 Test Results                 │  │ 🚚 Delivery Dockets  │ │
│  │        3 unassigned             │  │      2 unassigned    │ │
│  └─────────────────────────────────┘  └──────────────────────┘ │
│                                                                 │
│  Recent:                                                        │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ 📄 Test Report - CT-1234         28 Jan 2026    [Assign]  ││
│  │ 📄 Delivery Docket #56789        28 Jan 2026    [Assign]  ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

Clicking a document opens the assignment sheet.

### 2. Update `JobTestResultsTab.tsx`

Show job-matched (but pour-unassigned) test results:

```text
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Unassigned to Pour (2)                                     │
├─────────────────────────────────────────────────────────────────┤
│  These test results match this job but haven't been linked     │
│  to a specific pour.                                            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ 🧪 CT-1234 - 28 Day      Target: 32 MPa   [Assign Pour]   ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 3. Update `JobDocumentsTab.tsx`

Show job-matched delivery dockets awaiting pour assignment:

Similar section for documents that matched the job but need pour assignment.

## Files to Create/Modify

| File | Action |
|------|--------|
| SQL Migration | Add match columns to pending tables |
| `supabase/functions/scan-test-document/index.ts` | Extract site_address for test results |
| `supabase/functions/receive-test-email/index.ts` | Add auto-matching logic after extraction |
| `src/pages/admin/AdminDashboard.tsx` | Add "Assign Dockets" widget |
| `src/components/dashboard/UnassignedDocketsWidget.tsx` | New widget component |
| `src/components/jobs/tabs/JobTestResultsTab.tsx` | Show job-matched pending results |
| `src/components/jobs/tabs/JobDocumentsTab.tsx` | Show job-matched pending dockets |
| `src/components/jobs/PendingTestResultsSheet.tsx` | Update to handle job-matched items |
| `src/components/jobs/PendingDocumentsSheet.tsx` | Update to handle job-matched items |

## Address Matching Algorithm

```typescript
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/street|st\b/gi, 'st')
    .replace(/road|rd\b/gi, 'rd')
    .replace(/avenue|ave\b/gi, 'ave')
    .replace(/drive|dr\b/gi, 'dr')
    .trim();
}

function matchAddresses(extracted: string, jobAddress: string): number {
  const a = normalizeAddress(extracted);
  const b = normalizeAddress(jobAddress);
  
  // Exact match
  if (a === b) return 100;
  
  // One contains the other
  if (a.includes(b) || b.includes(a)) return 85;
  
  // Word overlap calculation
  const aWords = a.split(' ').filter(w => w.length > 2);
  const bWords = b.split(' ').filter(w => w.length > 2);
  const overlap = aWords.filter(w => bWords.includes(w)).length;
  const score = (overlap / Math.max(aWords.length, bWords.length)) * 100;
  
  return score;
}
```

## User Experience

### Scenario 1: Full Auto-Match
1. Lab emails test result for "123 Smith Street"
2. AI extracts address + pour date (28 Jan 2026)
3. System matches to Job #PH-2601-0015 at "123 Smith St" 
4. System matches date to "Slab Pour 1" scheduled 28 Jan
5. Document appears directly in Job's Test Results tab
6. Badge shows "Auto-matched" - user can verify/edit

### Scenario 2: Job Match Only
1. Supplier emails docket for "45 Jones Road"
2. AI extracts address but date doesn't match any pour
3. System matches to Job #PH-2601-0020 at "45 Jones Rd"
4. Document appears in that Job's Test Results tab
5. Section shows "Unassigned to Pour" with button to assign

### Scenario 3: No Match
1. Email arrives with unclear/no address
2. System can't match to any job
3. Document appears in Dashboard "Assign Dockets" widget
4. User clicks to open, manually selects job/pour

