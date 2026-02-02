
# Plan: Fix Quote Print Colors to Match Preview

## Problem Summary
When printing a quote, all background colors are stripped out, making the printed version look very different from the preview. The emailed PDF (generated via `html2canvas`) looks correct, but the browser print dialog output is missing colors.

## Root Cause
The print CSS in `src/index.css` has an aggressive rule that removes ALL backgrounds:

```css
@media print {
  *, *::before, *::after {
    background: transparent !important;
  }
}
```

This overrides the styled elements in `PrintableEstimate.tsx` including:
- Modern template's dark header banner
- Info cards with colored left borders and gray backgrounds
- Alternating table row colors
- Colored boxes for terms and exclusions

## Solution Strategy
Remove the blanket background-stripping rule and instead ensure the print container explicitly preserves all styling with `print-color-adjust: exact`.

---

## Implementation Steps

### Step 1: Update Print CSS in `index.css`
Remove the aggressive background-stripping rule and replace with targeted, color-preserving print styles.

**Changes:**
1. Remove the global `background: transparent !important` rule
2. Add `print-color-adjust: exact` to the `.print-container` and all its children
3. Keep hiding non-print elements (dialogs, nav, etc.)

### Step 2: Add Inline Print-Safe Styles to PrintableEstimate
Ensure the component's critical colored elements use both inline styles AND the `-webkit-print-color-adjust` property for maximum browser compatibility.

### Step 3: Test Both Print Flows
- Browser print (Cmd/Ctrl + P) - should now show colors
- Email PDF (already working via html2canvas)

---

## Technical Details

### Updated Print CSS (src/index.css)
```css
@media print {
  /* 
   * REMOVED: The blanket background-stripping rule that was breaking colors:
   * *, *::before, *::after { background: transparent !important; }
   */
  
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Preserve ALL colors inside print container */
  .print-container,
  .print-container * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Hide everything else (unchanged) */
  body > *:not(.print-estimate-portal) { ... }
}
```

### Key Print CSS Properties
- `print-color-adjust: exact` - Tells browser to preserve exact colors, not optimize for ink
- `-webkit-print-color-adjust: exact` - Safari/Chrome prefix
- Remove `background: transparent !important` - This was the culprit

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Remove blanket background-stripping, add print-color-adjust for print container |
| `src/components/estimates/PrintableEstimate.tsx` | (Optional) Add inline `-webkit-print-color-adjust: exact` to key styled elements for extra browser compatibility |

---

## Why This Will Work

1. **The email PDF already shows correct colors** - This proves the `PrintableEstimate` component renders colors correctly
2. **html2canvas captures the DOM visually** - It doesn't use print CSS, so it works
3. **Browser print uses `@media print` CSS** - The aggressive rule was stripping all backgrounds
4. **Removing that rule** lets the inline `backgroundColor` styles in the component render correctly

---

## Risk Assessment

- **Low risk**: Only modifying CSS print rules
- **No functional changes**: Component rendering logic stays the same
- **Fallback**: If specific browsers still strip colors, we can add more explicit inline styles

---

## Acceptance Criteria

- Printed quote shows the same colors as the preview (header banners, info cards, table rows)
- Email PDF continues to work correctly
- All three templates (Modern, Minimal, Classic) print with colors intact
