

# Project Plan Tab & Auto-Create Works from Quote

## Overview

This plan addresses three connected changes:
1. Rename the "Pours" tab to "Project Plan" for clarity
2. Change "Add Pour" button to "Schedule Works" (same UX flow after clicking)
3. Automatically create prep days and pour entries when a job is created from a quote, based on the labour-prep and labour-place module data in the estimate

## Current State

- The `JobPoursTab.tsx` component displays a "Pours" tab with an "Add Pour" button
- The `PourFormDialog.tsx` already supports multiple visit types including: pour, earthworks, formwork_place, formwork_strip, cure, seal, other
- Jobs created from estimates currently only extract pour info from `raft_slab.pours` array (legacy format)
- The `labour-place` module stores placement data as a `placements` array with: name, hourly_rate, crew_size, hours
- The `labour-prep` module stores single-day prep config with: hourly_rate, crew_size, hours_per_day, number_of_days

## Changes Required

### 1. Tab and Button Renaming (Simple Text Changes)

| File | Current | New |
|------|---------|-----|
| `AdminJobDetail.tsx` | Tab label: "Pours" | Tab label: "Project Plan" |
| `JobPoursTab.tsx` | Button: "Add Pour" | Button: "Schedule Works" |
| `JobPoursTab.tsx` | Header: "Scheduled Pours" | Header: "Project Plan" |
| `JobPoursTab.tsx` | Empty state: "No Pours Scheduled" | Empty state: "No Works Scheduled" |

### 2. Auto-Create Works from Quote Labour Data

When a job is created from an estimate (in `JobFormDialog.tsx`), the system will automatically create `job_pours` entries based on:

**From `labour-place` module (placements array):**
- Each placement becomes a pour visit with `visit_type = 'pour'`
- Uses the placement name (e.g., "Pour 1", "Slab Pour")
- Notes include crew size and hours for reference

**From `labour-prep` module:**
- Creates prep day entries with `visit_type = 'formwork_place'` (represents general prep work)
- Number of entries = `number_of_days` value
- Names like "Prep Day 1", "Prep Day 2", etc.
- Notes include crew size and hours per day

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminJobDetail.tsx` | Change tab label "Pours" to "Project Plan" |
| `src/components/jobs/tabs/JobPoursTab.tsx` | Change button text, header, and empty state messaging |
| `src/components/jobs/JobFormDialog.tsx` | Add logic to extract placements and prep days from scope_data |
| `src/pages/admin/AdminEstimates.tsx` | Update `parseEstimateForJob` to include prep_days and placements |
| `src/pages/admin/AdminSchedule.tsx` | Update drag-drop conversion to include prep_days and placements |

### Data Flow

```text
Estimate scope_data structure:
{
  "driveway": {
    "moduleAnswers": {
      "labour-place": {
        "placements": [
          { id: "...", name: "Pour 1", crew_size: 4, hours: 8, hourly_rate: 75 },
          { id: "...", name: "Pour 2", crew_size: 3, hours: 6, hourly_rate: 75 }
        ]
      },
      "labour-prep": {
        "crew_size": 3,
        "hours_per_day": 8,
        "number_of_days": 2,
        "hourly_rate": 70
      }
    }
  }
}
```

This will be converted to job_pours entries:

| pour_name | visit_type | notes |
|-----------|------------|-------|
| Prep Day 1 | formwork_place | Crew: 3, 8 hrs/day |
| Prep Day 2 | formwork_place | Crew: 3, 8 hrs/day |
| Pour 1 | pour | Crew: 4, 8 hrs |
| Pour 2 | pour | Crew: 3, 6 hrs |

### Technical Implementation Notes

1. **Extraction Logic in `parseEstimateForJob`**:
   - Iterate through all selected scopes in `scope_data`
   - For each scope, check `moduleAnswers['labour-place'].placements` array
   - For each scope, check `moduleAnswers['labour-prep']` for prep day config
   - Combine all extracted works into a unified `pours` array

2. **JobFormDialog.tsx changes**:
   - The existing `initialData.pours` handling already creates `job_pours` entries
   - Just need to ensure the extracted data includes `visit_type` for each entry

3. **Backward Compatibility**:
   - Keep existing `raft_slab.pours` extraction logic as fallback
   - New labour module extraction runs first, only falls back if no data found

4. **Empty State Handling**:
   - If no labour modules configured in quote, no works auto-created
   - User can still manually add works via "Schedule Works" button

