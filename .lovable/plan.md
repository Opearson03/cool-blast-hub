# Quote PDF Line Items Fix

## Status: ✅ COMPLETED

## Summary of Changes

### Problem 1: Missing Line Items in Quote Body
**Root Cause:** The `extractScopeBreakdowns` function in `quote-pdf-data.ts` was looking for a `.scopes` wrapper that doesn't exist in the actual database structure. The database stores scope IDs (e.g., `raft_slab`, `retaining_wall_footings`) as top-level keys.

**Solution:** Added `getScopesFromData()` helper function that correctly identifies scope keys by:
1. Checking for an explicit `.scopes` wrapper (legacy format)
2. Filtering to find scope-like keys that have `scopeAnswers`, `moduleAnswers`, `calculatedTotal`, or `doneModules`
3. Skipping non-scope keys like `_globalMargin`, `exclusions`, etc.

### Problem 2: Scope Breakdown Appearing in Terms Page
**Root Cause:** The full `estimate.notes` field (containing auto-generated SCOPE BREAKDOWN) was being passed to `TermsAndExclusionsPage`.

**Solution:** Added `parseNotesContent()` function that extracts user notes separately from auto-generated content, so only genuine user notes appear on Page 2.

### Problem 3: jsPDF.scale Error
**Root Cause:** Empty canvas from hidden sections causing scale calculation to fail.

**Solution:** Added canvas dimension validation in `generate-quote-pdf.ts` to skip empty sections.

### Problem 4: Fallback for Legacy Estimates
**Solution:** Added `NotesBasedScopeBreakdown` component that renders scope breakdown from parsed notes when `scope_data` is empty or doesn't contain valid scopes.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/quote-pdf-data.ts` | Added `getScopesFromData()` helper, updated all extraction functions to use it |
| `src/components/estimates/PrintableEstimate.tsx` | Added `parseNotesContent()`, `NotesBasedScopeBreakdown`, updated templates with fallback logic |
| `src/lib/generate-quote-pdf.ts` | Added canvas dimension validation |

---

## Expected Result

**Page 1 (Quote):**
- Header, client info, dates
- Project summary (if data exists)
- Scope breakdown table (from scope_data OR parsed notes fallback)
- Totals, signature area

**Page 2 (Terms & Conditions):**
- Header
- Payment terms (generated from `payment_terms_type`)
- Exclusions
- Acceptance block
- **NO scope breakdown**

---

## Verification

Test with:
1. **Print Estimate** - should show scopes on Page 1
2. **Email to Client** - PDF attachment should show scopes on Page 1
3. **Estimates with empty scope_data** - should use notes fallback if available
4. **Old estimates** - notes-based fallback ensures they still display correctly
