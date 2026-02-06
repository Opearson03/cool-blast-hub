

# Fix: Quote Page 2 Header Falling Off Top of Page

## Problem

The second page header on the quote PDF is being cut off (falling off the top of the page). This affects the live preview on the Settings page and any generated/emailed PDFs.

## Root Cause

The hidden render container used for PDF generation has this CSS:

```
position: fixed;
top: 0;
overflow: hidden;  <-- THIS IS THE PROBLEM
```

Page 1 has a minimum height of 277mm. Page 2 content renders below it. But the container is `position: fixed` with `overflow: hidden` and no explicit height. Some browsers limit a fixed-position element's effective height to the viewport when `overflow: hidden` is set.

This means the Page 2 section (starting at ~277mm from top) is partially or fully clipped before `html2canvas` can capture it. The header accent bar and content get cut off in the resulting capture.

## Fix

Two changes in **`src/lib/generate-quote-pdf.ts`**:

1. Change `overflow: hidden` to `overflow: visible` on the render container -- allows all content to exist fully in the DOM regardless of viewport size
2. Add a small top padding to the Page 2 section wrapper in **`src/components/estimates/PrintableEstimate.tsx`** to prevent the thin 4px accent bar from being clipped by any sub-pixel rounding during capture

## Technical Details

### File 1: `src/lib/generate-quote-pdf.ts`

Change line 104 in the render container CSS from `overflow: hidden` to `overflow: visible`. This ensures the full content (Page 1 + Page 2) is rendered without clipping, regardless of viewport size.

### File 2: `src/components/estimates/PrintableEstimate.tsx`

Add a small `pt-1` (4px) top padding to the `page-2` wrapper div (line 647) so the accent bar has breathing room and isn't vulnerable to sub-pixel clipping during html2canvas capture. This applies to both Classic and Simple templates since they share the same `TermsAndExclusionsPage` component.

Both changes are minimal (one CSS property, one Tailwind class) and don't affect the visual design of the quote.
