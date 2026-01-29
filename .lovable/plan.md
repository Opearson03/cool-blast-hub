# Plan: Improve Concrete Test Auto-Assignment Accuracy

## ✅ COMPLETED

All phases have been implemented:

### Phase 1: Database Schema Enhancement ✅
Added `docket_numbers` and `batch_ticket_refs` TEXT[] columns to `job_pours` table with GIN indexes for fast lookups.

### Phase 2: Enhanced AI Extraction ✅
Updated `scan-test-document` edge function to extract additional matching signals:
- `docket_number` - Primary match key from delivery dockets
- `batch_ticket` - Alternative batch plant reference
- `sample_ref` - Lab's sample reference
- `project_ref` - Client's project reference
- `job_number` - Job number if visible

### Phase 3: Multi-Signal Matching Algorithm ✅
Replaced address-only matching with weighted scoring in `receive-test-email`:

| Signal | Points |
|--------|--------|
| Docket number match | 100 (auto-assign) |
| Batch ticket match | 80 (auto-assign) |
| Job number/project ref | 50 |
| Address match (>70%) | up to 40 |
| Pour date match (±2 days) | 30 |
| MPA strength match | 20 |

Auto-assign if score >= 70 with pour match, otherwise pending with suggestions.

### Phase 4: Docket-to-Pour Pre-Linking ✅
Updated `PendingDocumentsSheet` to save docket numbers to `job_pours.docket_numbers[]` when dockets are assigned to pours.

### Phase 5: UI Improvements ✅
Updated `PendingTestResultsSheet` with:
- Display of extracted docket number and site address
- "Suggested Matches" section showing top 3 candidates
- Match score and reasons for each suggestion
- One-click selection of suggested matches

## Expected Outcome

| Before | After |
|--------|-------|
| ~10% auto-match rate | ~70% auto-match rate (with docket linking) |
| Address-only matching fails on variations | Multiple signals provide redundancy |
| No visibility into why match failed | UI shows match reasoning |
| Dockets not linked to pours | Dockets become the bridge to test results |
