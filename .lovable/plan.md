
# Plan: Fix Minimal Quote PDF Layout Issues

## Problems Identified

1. **Blank first page** - The section-based PDF capture may be creating an empty first page before content renders
2. **Labels cut off with overlap** - The "CUSTOMER DETAILS" and business name labels have `h-5` height constraints combined with `truncate` which clips text when rendered at PDF scale
3. **0-margin causing edge issues** - Content captures at 0mm margins cause visual artifacts and print problems

## Root Cause Analysis

The current PDF generation:
- Uses `MARGIN_MM = 0` for edge-to-edge capture
- But the minimal template adds internal `padding: 40px` 
- The `h-5 leading-5` on labels (20px height) combined with uppercase bold text gets clipped during canvas capture at 2x scale
- The `html2canvas` capture starts at `x: 0, y: 0` without accounting for the container's actual rendered position

## Solution

### 1. Fix Label Clipping in Minimal Template
**File:** `src/components/estimates/PrintableEstimate.tsx`

Remove the restrictive `h-5 leading-5` height from the Customer Details and Business Name labels that causes text clipping:

```diff
- <p className="text-sm font-bold text-gray-900 mb-2 uppercase truncate whitespace-nowrap h-5 leading-5">Customer Details</p>
+ <p className="text-sm font-bold text-gray-900 mb-2 uppercase">CUSTOMER DETAILS</p>

- <p className="text-sm font-bold text-gray-900 mb-2 uppercase truncate whitespace-nowrap h-5 leading-5">{business?.name || "Your Business Name"}</p>
+ <p className="text-sm font-bold text-gray-900 mb-2 uppercase">{business?.name || "Your Business Name"}</p>
```

### 2. Add Safe Print Margins to PDF Generation
**File:** `src/lib/generate-quote-pdf.ts`

Restore reasonable margins for proper printing while keeping the full-page look:

```typescript
// A4 dimensions in mm - small margin for print safety
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10; // Safe print margin
const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);
```

### 3. Fix Template Container Padding
**File:** `src/components/estimates/PrintableEstimate.tsx`

Ensure consistent padding that works with the new margins:

```typescript
// Update print styles for minimal template
const printStyles = `
  @media screen {
    .print-container {
      width: 190mm;        // 210mm - 20mm margins
      max-width: 190mm;
      margin: 0;
      padding: 0;          // Remove padding, let PDF margins handle it
      background: #ffffff !important;
    }
  }
`;
```

### 4. Fix Page 1 Section Structure
Ensure the `data-pdf-section="page-1"` div renders properly without blank space before it.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/PrintableEstimate.tsx` | Fix label height constraints, adjust container styling |
| `src/lib/generate-quote-pdf.ts` | Restore safe print margins (10mm) |

## Technical Details

### Label Fix (Lines 795-796 and 824-825)
The current code:
```typescript
<p className="text-sm font-bold text-gray-900 mb-2 uppercase truncate whitespace-nowrap h-5 leading-5">Customer Details</p>
```

The `h-5` (20px) combined with `uppercase font-bold` text gets clipped when html2canvas renders at 2x scale. Removing the fixed height allows natural text flow.

### Margin Restoration
Current (problematic):
```typescript
const MARGIN_MM = 0; // No margin - causes edge clipping
```

Fixed:
```typescript
const MARGIN_MM = 10; // 10mm = ~0.4 inches - standard safe print zone
const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2); // 190mm content area
```

This ensures:
- Content doesn't get cut off at page edges when printing
- Labels render with proper spacing from edges
- Professional appearance with consistent margins

### Container Width Adjustment
The render container width should match content area:
```typescript
container.style.cssText = `
  position: fixed;
  left: -9999px;
  top: 0;
  width: ${CONTENT_WIDTH_MM}mm;  // Was A4_WIDTH_MM, now content width
  background: #ffffff;
`;
```

## Expected Outcome

After these changes:
- No blank first page
- "CUSTOMER DETAILS" and business name labels display fully without clipping
- PDF prints properly with safe margins on all printers
- Content remains visually consistent with current design
