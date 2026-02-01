
# Professional Quote Template Redesign

## Overview

Redesigning all three quote templates (`Modern`, `Minimal`, `Classic`) in `QuoteTemplatePreview.tsx` to look more professional based on the provided reference images. The changes will apply to both the small preview thumbnails in the onboarding wizard AND the full-size `PrintableEstimate.tsx` used for actual PDF generation.

---

## Design Analysis from References

| Template | Reference Inspiration | Key Design Elements |
|----------|----------------------|---------------------|
| **Modern** | Image 1 (Orange/Coral) | Bold colored header banner, two-column info cards with left border accents, itemized table with colored header row, project description section, signature area |
| **Minimal** | Image 2 (Blue/Navy) | Clean white space, large bold document title, company info top-left, estimate meta on right, simple table with subtle header, terms section, signature line at bottom |
| **Classic** | Image 3 (Brown/Gold) | Traditional form-style layout with labeled fields, professional color scheme, boxed sections, material table with colored header/total rows, dual signature/date fields |

---

## Changes to QuoteTemplatePreview.tsx

### Modern Template

```text
+--------------------------------------------------+
| [Logo] BUSINESS NAME           CONCRETE WORK     |
|        ABN: XX XXX XXX XXX     ESTIMATE          |
|                                #Q-0001           |
+--------------------------------------------------+
| Client Information        | Company Information  |
|---------------------------|----------------------|
| Name: John Smith          | Company: Your Biz    |
| Address: 123 Example St   | Phone: 0400 000 000  |
| Phone: 0400 000 000       | Email: email@biz.com |
+--------------------------------------------------+
| Project Description                              |
| Concrete work for driveway and footpath...       |
+--------------------------------------------------+
| No | Description    | Qty | Unit Price | Total  |
|----|----------------|-----|------------|--------|
| 01 | Site Prep      | 1   | $1,500     | $1,500 |
| 02 | Concrete       | 18m³| $120/m³    | $2,160 |
+--------------------------------------------------+
|                     Subtotal    |    $11,363.64  |
|                     GST (10%)   |     $1,136.36  |
|                     TOTAL       |    $12,500.00  |
+--------------------------------------------------+
| Notes: Valid 14 days        | Signature:________ |
+--------------------------------------------------+
```

**Key Visual Changes:**
- Bold header banner using `secondaryColor` with logo + business name on left, "CONCRETE WORK ESTIMATE" on right
- Two-column "Client Information" / "Company Information" sections with labeled fields
- Project Description section with left accent bar
- Itemized table with numbered rows, colored header using `secondaryColor`
- Subtotal/GST/Total breakdown aligned right
- Notes + Signature area at bottom

### Minimal Template

```text
Your Business Name                    [Upload Logo]
123 Company Street
Sydney NSW 2000

                    CONCRETE
                    ESTIMATE

Bill To                          Estimate #    0001
Customer Name                    Estimate Date 11-04
123 Customer St                  Due Date      25-04
Sydney NSW 2000

+--------------------------------------------------+
| QTY | Description              | Unit    | Amount|
|-----|--------------------------|---------|-------|
| 1   | Site Preparation         | $1,500  | $1,500|
| 18  | Concrete (m³)            | $120    | $2,160|
+--------------------------------------------------+
                                 Subtotal   $11,364
                                 GST (10%)   $1,136
                                 Total      $12,500

Terms & Conditions
Payment due in 14 days
                                 ___________________
                                 Customer Signature
```

**Key Visual Changes:**
- Company details top-left (name, address)
- Logo placeholder top-right with dashed border
- Large, bold, centered "CONCRETE ESTIMATE" title
- Two-column layout: Bill To on left, estimate metadata on right
- Clean table with minimal styling, blue header
- Right-aligned totals
- Terms section and signature line at bottom

### Classic Template

```text
+--------------------------------------------------+
| [Logo] HOUSE CONSTRUCTION QUOTE                  |
|        (Your Company Name)                       |
+--------------------------------------------------+
| Company Address:   | 123 Business Street         |
| Contact Number:    | 0400 000 000                |
| Email Address:     | email@company.com           |
+--------------------------------------------------+
| TO:                                              |
| Owner Name:        | John Smith                  |
| Address:           | 123 Example Street          |
| Contact Number:    | 0400 000 000                |
| Email Address:     | john@email.com              |
| Date:              | 10 Jan 2026                 |
| Quote Number:      | Q-0001                      |
+--------------------------------------------------+
| MATERIAL DESCRIPTION     | COST  | TAX  | AMOUNT |
|--------------------------|-------|------|--------|
| Site Preparation         | $1,500| 10%  | $1,650 |
| Concrete Supply          | $2,000| 10%  | $2,200 |
|--------------------------|-------|------|--------|
| GRAND TOTAL              |       |      |$12,500 |
+--------------------------------------------------+
|    (Signature)           |         (Date)        |
+--------------------------------------------------+
```

**Key Visual Changes:**
- Header with logo + bold document title + company name subtitle
- Form-style labeled fields in rows using primary color for labels
- "TO:" section with client details in same labeled format
- Material table with 4 columns including separate TAX column
- Grand Total row with colored background
- Dual signature/date fields at bottom

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/onboarding/QuoteTemplatePreview.tsx` | Complete redesign of all three templates to match professional reference images |
| `src/components/estimates/PrintableEstimate.tsx` | Update full-size PDF templates to match the new preview designs |

---

## Technical Details

### Color Usage
- `primaryColor`: Accent color (totals, highlights, checkmarks)
- `secondaryColor`: Header backgrounds, section headers, table headers
- Maintain proper contrast for text readability

### Typography
- Use the user's selected `font` consistently
- Clear hierarchy: document title largest, section headers medium, body text smallest
- All caps for headers/labels where appropriate

### Layout Improvements
- Better use of whitespace and padding
- Clear visual separation between sections
- Consistent alignment (left-aligned labels, right-aligned numbers)
- Professional table formatting with alternating row colors where applicable

### Preview Scale
- Maintain the miniature preview scale (`text-[6px]`, `text-[7px]`)
- Ensure all elements are visible and legible at thumbnail size

---

## Implementation Approach

1. **QuoteTemplatePreview.tsx** - Update all three template previews with the new professional designs
2. **PrintableEstimate.tsx** - Update the full-size PDF templates to match the preview designs while maintaining print-friendly formatting

The new designs will be more visually consistent with industry-standard quote templates while preserving the customization options (colors, fonts, logos) that users have configured.
