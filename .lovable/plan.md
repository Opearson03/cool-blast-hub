
# URGENT FIX: Scope Breakdown Appearing in Terms Page + jsPDF.scale Error

## Problems Identified

### Problem 1: Scope Breakdown in Terms Page
The `estimate.notes` field contains generated content in this format:
```
SCOPE BREAKDOWN:
• Waffle Pod Slab: $220.00

INCLUSIONS:
• Supply of concrete to site
...

EXCLUSIONS:
• Excavation and site preparation
...
```

This entire string is passed as `customNotes` to `TermsAndExclusionsPage`, which renders it directly under "Payment Terms". This causes the scope breakdown to incorrectly appear on Page 2.

### Problem 2: jsPDF.scale Error
The error "invalid argument passed to jsPDF.scale" occurs when `html2canvas` returns an empty or invalid canvas (width/height of 0). This happens when a section has no visible content or is hidden.

---

## Solution Overview

1. **Parse notes to extract only user notes** (strip SCOPE BREAKDOWN, INCLUSIONS, EXCLUSIONS)
2. **Move scope breakdown rendering to Page 1** using the notes fallback when `scopeData` is empty
3. **Fix jsPDF error** by adding canvas validation before calling `addImage`
4. **Clean up Terms page** to show only payment terms + exclusions (no scope breakdown)

---

## Implementation Steps

### Step 1: Create Notes Parser Utility
Add a helper function to parse the notes field and extract components separately:

```typescript
// In PrintableEstimate.tsx
function parseNotesContent(notes: string | null): {
  userNotes: string | null;
  scopeBreakdownFromNotes: { name: string; amount: string }[];
  inclusionsFromNotes: string[];
  exclusionsFromNotes: string[];
} {
  // Extract each section from notes
  // Return user-entered notes separately from generated content
}
```

### Step 2: Update PrintableEstimate.tsx
- Parse `estimate.notes` using the new helper
- Pass only **user-entered notes** to `TermsAndExclusionsPage` (not the full notes field)
- If `scopeData` is empty but notes contains scope breakdown, render it on Page 1 as a fallback

### Step 3: Update TermsAndExclusionsPage Component
- Remove scope breakdown from the Terms page entirely
- Only show: Payment terms + Exclusions + Acceptance
- Use `exclusions` prop (from `quotePDFData.exclusions`) for exclusions display
- For inclusions, either show from parsed notes or remove entirely

### Step 4: Fix jsPDF Canvas Validation
Add validation in `generate-quote-pdf.ts`:
```typescript
// Before adding image to PDF
if (canvas.width === 0 || canvas.height === 0) {
  console.warn(`Skipping empty section: ${sectionType}`);
  continue; // Skip empty sections
}
```

---

## Technical Details

### Notes Parsing Logic
The notes field follows a predictable format:
```
[User notes if any]

SCOPE BREAKDOWN:
• Scope Name: $X.XX
...

INCLUSIONS:
• Item 1
...

EXCLUSIONS:
• Item 1
...
```

Parsing approach:
1. Find index of "SCOPE BREAKDOWN:", "INCLUSIONS:", "EXCLUSIONS:"
2. Extract user notes = everything before the first marker
3. Extract scope breakdown = content between "SCOPE BREAKDOWN:" and next marker
4. Extract inclusions = content between "INCLUSIONS:" and "EXCLUSIONS:"
5. Extract exclusions = content after "EXCLUSIONS:"

### Fallback Scope Breakdown on Page 1
When `quotePDFData.scopeBreakdowns` is empty (no scope_data), check if notes contains a scope breakdown:
- If yes, render a simple fallback table on Page 1 showing scope names and amounts
- This ensures quotes created before the new system still display correctly

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/PrintableEstimate.tsx` | Add notes parser, update TermsAndExclusionsPage to receive parsed user notes only, add fallback scope breakdown for Page 1 |
| `src/lib/generate-quote-pdf.ts` | Add canvas validation to prevent jsPDF.scale error on empty sections |

---

## Expected Outcome

**Page 1 (Quote):**
- Header, client info, project summary
- **Scope breakdown table** (from scopeData OR notes fallback)
- Totals, signature area

**Page 2 (Terms & Conditions):**
- Header
- Payment terms (dynamically generated based on payment_terms_type)
- Exclusions (from quotePDFData.exclusions)
- Acceptance block
- **NO scope breakdown** (this is the fix)

---

## Affected Flows
All three will be fixed with these changes:
1. **Print Estimate** - uses PrintableEstimate via browser print
2. **Email to Client PDF** - uses generate-quote-pdf.ts → PrintableEstimate
3. **Client signing page** - uses the same notes parsing (separate fix if needed)
