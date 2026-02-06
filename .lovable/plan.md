
# Fix: Concrete Total Quantities Not Showing for Slab on Ground and Raft Slab

## Problem

The concrete volume for Slab on Ground and Raft Slab scopes is never displayed on the quote PDF because the extraction functions look for volume in fields that don't exist in the saved data.

## Root Cause

The concrete volume is calculated on-the-fly by the estimator (`ModularCalculator`) but is never stored directly in `scopeAnswers`. Instead, it gets saved in `moduleAnswers['concrete-supply'].calculated_volume`. However, the PDF data extraction functions (`extractProjectSummary` and `extractScopeBreakdowns` in `quote-pdf-data.ts`) only look for volume in three places that are never populated:

- `scopeAnswers.concreteVolume` -- never set
- `scopeAnswers.total_volume` -- never set
- `scopeAnswers.volume` -- never set

As confirmed by the database, these fields are always null for slab scopes, while `moduleAnswers['concrete-supply'].calculated_volume` correctly stores the value (e.g., 19.72 m3 for a raft slab, 38.67 m3 for a slab on ground).

Additionally, the area calculation for takeoff-based scopes uses `length x width` instead of the more accurate `_actualArea` value from plan takeoff.

## Fix

Update `src/lib/quote-pdf-data.ts` in two functions to read volume from where it's actually stored, and use accurate takeoff areas.

### Changes to `extractProjectSummary` (lines 209-226)

1. After the existing volume checks (lines 210-218), add a fallback to `moduleAnswers['concrete-supply'].calculated_volume`
2. Update the area calculation (lines 221-226) to prefer `_actualArea` from takeoff data before falling back to `length x width`

### Changes to `extractScopeBreakdowns` (lines 381-401)

1. Line 381: Add `moduleAnswers['concrete-supply']?.calculated_volume` as a fallback for the volume extraction
2. Lines 393-400: Update individual area extraction to use `_actualArea` when available, and fix the filter to include areas that have `_actualArea` (not just `length x width`)

### Concrete strength extraction

Also add `moduleAnswers['concrete-supply']?.concrete_type` as a fallback for concrete strength extraction (line 404-407), since the concrete type is stored in the module answers, not in scope answers.

### No database changes needed

All the correct data is already stored in the database. This is purely a read-side fix in the PDF data extraction logic.
