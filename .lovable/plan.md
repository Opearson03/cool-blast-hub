# URGENT FIX: Scope Breakdown in Terms Page + jsPDF.scale Error

## Status: ✅ IMPLEMENTED

---

## Changes Made

### 1. Notes Parser Added (PrintableEstimate.tsx)
Added `parseNotesContent()` function that extracts:
- `userNotes`: Only the user-entered notes (before any auto-generated markers)
- `scopeBreakdownFromNotes`: Parsed scope items (for potential fallback)
- `inclusionsFromNotes`: Parsed inclusions
- `exclusionsFromNotes`: Parsed exclusions

### 2. TermsAndExclusionsPage Updated
All 3 templates (Modern, Minimal, Classic) now pass:
```tsx
customNotes={parsedNotes.userNotes}  // ← Only user notes, NOT full string
```

Instead of the previous:
```tsx
customNotes={estimate.notes}  // ← This included SCOPE BREAKDOWN!
```

### 3. Payment Terms Logic Fixed
Updated `getPaymentTermsText()` to check for user notes instead of raw notes:
```tsx
const getPaymentTermsText = (estimate, hasUserNotes: boolean) => {
  if (hasUserNotes) return null;  // Use user's custom notes
  // Otherwise generate from payment_terms_type
}
```

### 4. Canvas Validation Added (generate-quote-pdf.ts)
Added validation to skip empty sections and prevent jsPDF.scale error:
```typescript
if (canvas.width === 0 || canvas.height === 0) {
  console.warn(`Skipping empty section: ${sectionType}`);
  continue;
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/estimates/PrintableEstimate.tsx` | Added `parseNotesContent()` helper, updated all 3 template `TermsAndExclusionsPage` calls to use `parsedNotes.userNotes` |
| `src/lib/generate-quote-pdf.ts` | Added canvas dimension validation to prevent jsPDF.scale error |

---

## Expected Result

**Page 1 (Quote):**
- Header, client info, dates
- Project summary (if data exists)
- Scope breakdown table (from scopeData)
- Totals, signature area

**Page 2 (Terms & Conditions):**
- Header
- Payment terms (generated from `payment_terms_type` OR user notes)
- Exclusions (from `quotePDFData.exclusions`)
- Acceptance block
- **NO scope breakdown** ✅

---

## Flows Fixed

1. ✅ **Print Estimate** (browser print)
2. ✅ **Email to Client PDF** (generate-quote-pdf.ts)
3. ✅ **Client signing page** (uses same PrintableEstimate component)
