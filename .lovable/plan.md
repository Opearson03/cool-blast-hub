
# Plan: Improve Concrete Test Auto-Assignment Accuracy

## Current Problem

The current matching system is failing because it relies on:
1. **Address matching** - Fuzzy string matching between extracted `site_address` and job `site_address`
2. **Date matching** - Comparing extracted `pour_date` with `job_pours.pour_date` within a ±2 day window

### Why This Fails

| Issue | Example |
|-------|---------|
| **Date format errors** | Pour stored as `0005-11-12` instead of `2025-11-12` |
| **Address variations** | Test says "3 Government Rd Weston" but job might be "3 Government Road, Weston NSW 2326" |
| **No unique identifier** | No docket number or batch reference linking test to pour |
| **Multiple pours same day** | Can't distinguish which pour at the same address |
| **Test date vs Pour date confusion** | AI extracts test_date (when tested) but may not find pour_date (when placed) |

---

## Proposed Solution: Multi-Signal Matching with Delivery Docket Bridge

The most reliable way to match test results to pours is through **delivery dockets** - they contain:
- Docket number (unique identifier)
- Site address
- Delivery date (= pour date)
- Volume and mix code

### Architecture

```text
[Delivery Docket]                    [Test Result]
 ├─ docket_number ◄──────────────────► sample_ref / docket_number
 ├─ delivery_date                      ├─ pour_date
 ├─ site_address                       ├─ site_address  
 ├─ volume_m3                          ├─ test_id
 └─ mix_code                           └─ target_mpa

     │                                      │
     ▼                                      ▼
          [job_pours] ◄── Linked via ──►
              ├─ pour_date
              ├─ docket_numbers[] (new)
              └─ mpa_strength
```

---

## Implementation Plan

### Phase 1: Database Schema Enhancement

Add fields to `job_pours` to store linked docket references:

```sql
ALTER TABLE job_pours ADD COLUMN docket_numbers TEXT[] DEFAULT '{}';
ALTER TABLE job_pours ADD COLUMN batch_ticket_refs TEXT[] DEFAULT '{}';
```

When delivery dockets are assigned to pours, store their reference numbers.

### Phase 2: Enhanced AI Extraction

Update `scan-test-document` to extract additional matching signals:

| Field | Purpose |
|-------|---------|
| `docket_number` | Primary match key (often printed on test reports) |
| `batch_ticket` | Alternative reference from batch plant |
| `sample_ref` | Lab's sample reference (may contain docket number) |
| `project_ref` | Client's project reference number |
| `job_number` | If visible on the report |

### Phase 3: Multi-Signal Matching Algorithm

Replace the current address-only matching with a **weighted scoring system**:

```text
Match Score = 
  + 100 if docket_number matches (definitive)
  + 80  if batch_ticket matches
  + 50  if job_number/project_ref matches
  + 40  if address matches (>70% confidence)
  + 30  if pour_date matches (±2 days)
  + 20  if MPA strength matches
  + 10  if volume roughly matches

Auto-assign if score >= 100 (docket match)
Job-match if score >= 70 (high confidence)
Pending if score < 70 (needs manual review)
```

### Phase 4: Docket-to-Pour Pre-Linking

When a delivery docket is assigned to a pour:
1. Store the `docket_number` in `job_pours.docket_numbers[]`
2. Future test results with that docket number auto-match to that pour

### Phase 5: UI Improvements

Add "Suggested Matches" to the pending test results sheet:
- Show top 3 candidate pours with match reasons
- Display what signals matched/didn't match
- One-click assign to suggested pour

---

## Technical Changes

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/scan-test-document/index.ts` | Extract docket_number, batch_ticket, job_number from test PDFs |
| `supabase/functions/receive-test-email/index.ts` | Replace `findBestMatch()` with new multi-signal algorithm |
| `src/components/jobs/PendingTestResultsSheet.tsx` | Add "Suggested Matches" with match reasoning |
| `src/components/jobs/PendingDocumentsSheet.tsx` | When assigning docket to pour, save docket_number to pour |

### Database Migration

```sql
-- Add docket tracking to pours
ALTER TABLE job_pours 
  ADD COLUMN docket_numbers TEXT[] DEFAULT '{}',
  ADD COLUMN batch_ticket_refs TEXT[] DEFAULT '{}';

-- Index for fast docket lookup
CREATE INDEX idx_job_pours_docket_numbers ON job_pours USING GIN (docket_numbers);
```

### New Matching Function

```typescript
async function findBestMatchMultiSignal(
  supabase: any,
  businessId: string,
  extractedData: {
    docket_number?: string;
    batch_ticket?: string;
    site_address?: string;
    pour_date?: string;
    target_mpa?: number;
    job_number?: string;
  }
): Promise<MatchResult> {
  // 1. Try docket number match first (definitive)
  if (extractedData.docket_number) {
    const { data: pourByDocket } = await supabase
      .from('job_pours')
      .select('id, job_id, pour_name')
      .contains('docket_numbers', [extractedData.docket_number])
      .single();
    
    if (pourByDocket) {
      return { 
        matchStatus: 'auto_matched', 
        matchedPourId: pourByDocket.id,
        matchedJobId: pourByDocket.job_id,
        matchConfidence: 100,
        matchReason: 'Docket number matched'
      };
    }
  }

  // 2. Fall back to weighted scoring for other signals
  // ... (address, date, MPA matching with scores)
}
```

---

## Expected Outcome

| Before | After |
|--------|-------|
| ~10% auto-match rate | ~70% auto-match rate (with docket linking) |
| Address-only matching fails on variations | Multiple signals provide redundancy |
| No visibility into why match failed | UI shows match reasoning |
| Dockets not linked to pours | Dockets become the bridge to test results |

---

## Implementation Order

1. **Database migration** - Add docket tracking columns
2. **Update docket assignment** - Save docket numbers when dockets are assigned to pours
3. **Enhance AI extraction** - Extract more matching signals from test PDFs
4. **Implement multi-signal matching** - New weighted algorithm
5. **UI improvements** - Show suggested matches with reasoning
