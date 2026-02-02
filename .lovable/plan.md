
# URGENT FIX: Scope Breakdown in Terms Page + jsPDF.scale Error

## Status: Plan NOT Implemented

The previous plan was approved but **never executed**. The code still passes `estimate.notes` directly to `TermsAndExclusionsPage`, which renders the entire notes field (including SCOPE BREAKDOWN) under "Payment Terms".

---

## Root Cause (Verified in Code)

### Problem 1: Notes Not Being Parsed
**Lines 854, 1030, 1242** in `PrintableEstimate.tsx`:
```tsx
<TermsAndExclusionsPage
  ...
  customNotes={estimate.notes}  // ← Passes FULL notes including scope breakdown
```

**Lines 364, 394, 421** in `TermsAndExclusionsPage`:
```tsx
{customNotes ? (
  <p className="whitespace-pre-wrap">{customNotes}</p>  // ← Renders everything!
) : paymentTerms ? (
```

### Problem 2: jsPDF.scale Error
No validation exists for empty canvas in `generate-quote-pdf.ts`. When a section has no visible content, `html2canvas` returns a 0x0 canvas causing `jsPDF.scale` to fail.

---

## Implementation Plan

### Step 1: Create Notes Parser Function

Add a helper to extract components from the notes field:

```typescript
interface ParsedNotes {
  userNotes: string | null;
  scopeBreakdownFromNotes: { name: string; amount: string }[];
  inclusionsFromNotes: string[];
  exclusionsFromNotes: string[];
}

function parseNotesContent(notes: string | null): ParsedNotes {
  if (!notes) return { 
    userNotes: null, 
    scopeBreakdownFromNotes: [], 
    inclusionsFromNotes: [], 
    exclusionsFromNotes: [] 
  };
  
  // Find markers
  const scopeIdx = notes.indexOf('SCOPE BREAKDOWN:');
  const inclIdx = notes.indexOf('INCLUSIONS:');
  const exclIdx = notes.indexOf('EXCLUSIONS:');
  
  // Extract user notes (everything before first marker)
  const firstMarker = Math.min(
    scopeIdx === -1 ? Infinity : scopeIdx,
    inclIdx === -1 ? Infinity : inclIdx,
    exclIdx === -1 ? Infinity : exclIdx
  );
  const userNotes = firstMarker === Infinity 
    ? notes.trim() 
    : notes.substring(0, firstMarker).trim() || null;
  
  // Parse scope breakdown
  let scopeBreakdownFromNotes: { name: string; amount: string }[] = [];
  if (scopeIdx !== -1) {
    const endIdx = Math.min(
      inclIdx === -1 ? notes.length : inclIdx,
      exclIdx === -1 ? notes.length : exclIdx
    );
    const scopeBlock = notes.substring(scopeIdx + 16, endIdx);
    const lines = scopeBlock.split('\n').filter(l => l.trim().startsWith('•'));
    scopeBreakdownFromNotes = lines.map(line => {
      const match = line.match(/•\s*(.+?):\s*(\$[\d,.]+)/);
      return match ? { name: match[1].trim(), amount: match[2] } : null;
    }).filter(Boolean) as { name: string; amount: string }[];
  }
  
  // Parse inclusions
  let inclusionsFromNotes: string[] = [];
  if (inclIdx !== -1) {
    const endIdx = exclIdx === -1 ? notes.length : exclIdx;
    const inclBlock = notes.substring(inclIdx + 11, endIdx);
    inclusionsFromNotes = inclBlock.split('\n')
      .filter(l => l.trim().startsWith('•'))
      .map(l => l.replace(/^•\s*/, '').trim());
  }
  
  // Parse exclusions (if not already in quotePDFData)
  let exclusionsFromNotes: string[] = [];
  if (exclIdx !== -1) {
    const exclBlock = notes.substring(exclIdx + 11);
    exclusionsFromNotes = exclBlock.split('\n')
      .filter(l => l.trim().startsWith('•'))
      .map(l => l.replace(/^•\s*/, '').trim());
  }
  
  return { userNotes, scopeBreakdownFromNotes, inclusionsFromNotes, exclusionsFromNotes };
}
```

### Step 2: Update PrintableEstimate Component

1. Parse notes at the top of the component render
2. Pass only `parsedNotes.userNotes` to `TermsAndExclusionsPage`
3. If `quotePDFData.scopeBreakdowns` is empty, use `parsedNotes.scopeBreakdownFromNotes` as fallback on Page 1

```tsx
// Inside PrintableEstimate, before return:
const parsedNotes = parseNotesContent(estimate.notes);

// Pass to TermsAndExclusionsPage:
<TermsAndExclusionsPage
  exclusions={quotePDFData.exclusions}
  paymentTerms={paymentTerms}
  customNotes={parsedNotes.userNotes}  // ← Only user notes, not full string
  ...
/>
```

### Step 3: Add Fallback Scope Breakdown for Page 1

Create a component to render scope breakdown from parsed notes:

```tsx
const NotesBasedScopeBreakdown = ({ 
  items, 
  template, 
  primaryColor, 
  secondaryColor 
}: { 
  items: { name: string; amount: string }[];
  template: string;
  primaryColor: string;
  secondaryColor: string;
}) => {
  if (items.length === 0) return null;
  
  // Similar table structure to ScopeLineItemsSection
  // but renders the name and amount from parsed notes
  ...
};
```

In each template, add conditional rendering:
```tsx
{/* Scope of Works */}
{quotePDFData.scopeBreakdowns.length > 0 ? (
  <ScopeLineItemsSection ... />
) : parsedNotes.scopeBreakdownFromNotes.length > 0 ? (
  <NotesBasedScopeBreakdown items={parsedNotes.scopeBreakdownFromNotes} ... />
) : null}
```

### Step 4: Fix jsPDF Canvas Validation

Add validation in `generate-quote-pdf.ts` after capturing each section:

```typescript
// Line ~165, after html2canvas call:
const canvas = await html2canvas(sectionElement, { ... });

// Add validation
if (canvas.width === 0 || canvas.height === 0) {
  console.warn(`Skipping empty section: ${sectionType}`);
  continue; // Skip to next section
}

// Calculate the section height in mm
const sectionHeightMM = (canvas.height * CONTENT_WIDTH_MM) / canvas.width;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/PrintableEstimate.tsx` | Add `parseNotesContent()` function, add `NotesBasedScopeBreakdown` component, update all 3 templates to pass parsed user notes and use fallback scope breakdown |
| `src/lib/generate-quote-pdf.ts` | Add canvas dimension validation to prevent jsPDF.scale error |

---

## Expected Result

**Page 1 (Quote):**
- Header, client info, dates
- Project summary (if data exists)
- Scope breakdown table (from scopeData OR parsed notes fallback)
- Totals, signature area

**Page 2 (Terms & Conditions):**
- Header
- Payment terms (generated from `payment_terms_type` or defaults)
- Exclusions (from `quotePDFData.exclusions`)
- Acceptance block
- **NO scope breakdown** (the fix)

---

## Fixes Applied To

1. **Print Estimate** (browser print) - renders PrintableEstimate
2. **Email to Client PDF** - uses generate-quote-pdf.ts → PrintableEstimate
3. **Client signing page** - if it uses the same component
