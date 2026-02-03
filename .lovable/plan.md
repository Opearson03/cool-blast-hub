

## Goal
Fix the black vertical lines appearing on either side of the PDF quote preview. These lines are caused by the `box-shadow` in the print container styles being captured by html2canvas during PDF generation.

---

## Root Cause

In `src/components/estimates/PrintableEstimate.tsx`, the `printStyles` includes a `box-shadow`:

```tsx
const printStyles = `
  @media screen {
    .print-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: white !important;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);  // ← This causes the dark edges
    }
  }
`;
```

When the PDF is generated off-screen, html2canvas still applies these screen styles and captures the box-shadow as part of the image, resulting in dark vertical lines at the page edges.

---

## Solution

Remove the `box-shadow` from the print container styles. The shadow was intended for on-screen preview aesthetics, but it interferes with PDF generation.

---

## Technical Changes

### File: `src/components/estimates/PrintableEstimate.tsx`

**Lines 732-750**: Remove `box-shadow` from `printStyles`

Change from:
```tsx
const printStyles = `
  @media screen {
    .print-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: white !important;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
  }
  ...
`;
```

To:
```tsx
const printStyles = `
  @media screen {
    .print-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: white !important;
    }
  }
  ...
`;
```

---

## Impact

- PDF previews will no longer have dark lines at the edges
- On-screen appearance will lose the subtle shadow effect, but this is negligible since the component is primarily used for PDF generation
- All existing functionality is preserved

---

## Files to Change

- `src/components/estimates/PrintableEstimate.tsx` (1 line removal)

