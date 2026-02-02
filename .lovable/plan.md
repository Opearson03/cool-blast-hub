
# Fix: Scope Breakdown Appearing in Payment Terms Section

## Problem Summary
The scope breakdown table is incorrectly appearing in the payment terms section (Page 2) instead of staying on Page 1 where it belongs. This happens for all scopes and all quote templates.

## Root Cause Analysis
The current PDF generation in `generate-quote-pdf.ts` uses a **single-canvas slicing approach**:

1. Renders the entire `PrintableEstimate` component as one tall HTML element
2. Captures it as a single canvas image using html2canvas
3. Slices the image at fixed A4 height intervals (297mm)

**Why this fails:**
- CSS `page-break-before` and `page-break-avoid` classes work for browser printing but are **completely ignored by html2canvas**
- Content gets cut at arbitrary pixel positions, causing sections to overflow across page boundaries
- If Page 1 content is tall, the scope breakdown table gets pushed into the Page 2 slice

```text
Current Behavior (Broken):
┌────────────────────────────┐
│ Header & Client Info       │
│ Project Summary            │
│ Scope Breakdown Table      │ ← Starts here...
├────────────────────────────┤ ← Arbitrary cut at 297mm
│ (table continues here)     │ ← ...ends up on "Page 2"
│ Payment Terms              │
│ Exclusions                 │
└────────────────────────────┘
```

---

## Solution Strategy
Implement **section-aware PDF generation** that:

1. Marks logical sections in the HTML with data attributes
2. Captures each section individually with html2canvas
3. Places sections on pages intelligently, adding page breaks when a section won't fit

```text
Fixed Behavior:
┌─────────── Page 1 ───────────┐
│ [Section: header]            │
│ [Section: client-info]       │
│ [Section: project-summary]   │
│ [Section: scope-breakdown]   │ ← Stays complete on Page 1
│ [Section: totals]            │
│ [Section: signature]         │
└──────────────────────────────┘

┌─────────── Page 2 ───────────┐
│ [Section: terms-header]      │ ← Starts fresh on Page 2
│ [Section: payment-terms]     │
│ [Section: exclusions]        │
│ [Section: acceptance]        │
└──────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add Section Markers to PrintableEstimate
Add `data-pdf-section` attributes to key content blocks so they can be identified and captured separately:

- `data-pdf-section="header"` - Company header/banner
- `data-pdf-section="client-info"` - Client & company info cards
- `data-pdf-section="project-summary"` - Technical specs cards
- `data-pdf-section="scope-breakdown"` - Scope of works table
- `data-pdf-section="totals"` - Pricing totals
- `data-pdf-section="page-1-footer"` - Signature area on page 1
- `data-pdf-section="page-2"` - Entire Terms & Exclusions page (forced to new page)

### Step 2: Update generate-quote-pdf.ts
Rewrite the PDF generation logic:

1. Render the component as before
2. Query all `[data-pdf-section]` elements
3. For each section:
   - Calculate its height in mm
   - Check if it fits on the current page
   - If not, add a new page first
   - Capture with html2canvas and add to PDF
4. Handle "page-2" sections by always starting a new page

**Pseudocode:**
```text
sections = querySelectorAll('[data-pdf-section]')
currentY = margin
pageHeight = 297mm - (2 * margin)

for each section:
  capture section with html2canvas
  calculate heightMM = (canvas.height * contentWidth) / canvas.width
  
  if section.dataset.pdfSection === 'page-2':
    addPage()
    currentY = margin
  else if heightMM > (pageHeight - currentY):
    addPage()
    currentY = margin
  
  addImage(canvas, x=margin, y=currentY, width=contentWidth, height=heightMM)
  currentY += heightMM + gap
```

### Step 3: Handle Edge Cases
- **Very tall sections**: If a single section is taller than a page, allow it to overflow (rare edge case)
- **Small gaps**: Add 2-4mm between sections for visual breathing room
- **Image quality**: Maintain scale: 2 for crisp rendering

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/PrintableEstimate.tsx` | Add `data-pdf-section` attributes to major content blocks in all 3 templates (Modern, Minimal, Classic) |
| `src/lib/generate-quote-pdf.ts` | Rewrite to capture sections individually and intelligently place on pages |

---

## Technical Details

### Section Markers (PrintableEstimate.tsx)
Each template (modern, minimal, classic) will have markers like:

```tsx
{/* Header */}
<div data-pdf-section="header" className="page-break-avoid" ...>

{/* Client Info Cards */}  
<div data-pdf-section="client-info" className="page-break-avoid grid ...">

{/* Scope Breakdown - CRITICAL: must stay on Page 1 */}
<div data-pdf-section="scope-breakdown">
  <ScopeLineItemsSection ... />
</div>

{/* Terms Page - Force new page */}
<div data-pdf-section="page-2">
  <TermsAndExclusionsPage ... />
</div>
```

### PDF Generation Logic (generate-quote-pdf.ts)
Key changes:
- Query sections: `container.querySelectorAll('[data-pdf-section]')`
- Capture each individually: `html2canvas(section, { ... })`
- Track currentY position per page
- Force page break for `page-2` sections
- Calculate remaining space before placing each section

---

## Why This Will Fix the Issue

1. **Section Boundaries Respected**: Each logical section is captured as its own canvas, preventing arbitrary slicing
2. **Scope Stays on Page 1**: The scope breakdown section will never be split or pushed to Page 2
3. **Terms Start on Page 2**: The `page-2` marker forces a new page for contractual content
4. **Template Agnostic**: Works for all 3 templates (Modern, Minimal, Classic)
5. **Both Flows Fixed**: Print and email PDFs use the same component, so both are fixed

---

## Acceptance Criteria

- Scope breakdown table appears completely on Page 1 for all scope types
- Payment Terms and Exclusions start on Page 2
- No content is arbitrarily split across pages
- All three templates (Modern, Minimal, Classic) work correctly
- Email PDF attachments match printed quotes exactly
