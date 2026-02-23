

## Mobile Optimisation for Quick Quote Dialog

### Issues Found

1. **Dialog sizing**: Uses `sm:max-w-lg` but doesn't go full-screen on mobile, leaving cramped side margins and limited vertical space.
2. **Line item row is too tight**: Qty, Unit, Price, Total, and Delete button are all crammed into one row -- overflows or squishes on narrow screens (especially iPhone SE at 320px).
3. **Fixed-width elements**: `w-20` (total) and `w-16` (unit) compete for space with flex items on small screens.
4. **Number input spinners**: `type="number"` shows browser-native spinner arrows, which conflicts with the project standard of `type="text" inputMode="decimal"`.
5. **Footer buttons**: Already stack on mobile (`flex-col sm:flex-row`) -- this is fine.
6. **Padding**: The scrollable area `pr-1` is minimal, and dialog `p-6` is generous for mobile -- could be tightened.

### Planned Changes

**File: `src/components/estimates/QuickQuoteDialog.tsx`**

1. **Full-screen dialog on mobile**: Change DialogContent class to include `max-h-[100dvh] h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-lg p-4 sm:p-6` so it fills the screen on phones.

2. **Stack line item fields on very small screens**: Wrap the Qty / Unit / Price row to use a 3-column grid instead of flex, and move the total + delete below the inputs on mobile:
   - Description input: full width (already is)
   - Qty / Unit / Price: `grid grid-cols-3 gap-2` (equal thirds, always fits)
   - Total + Delete: separate row below, `flex justify-between items-center`

3. **Fix input types**: Change Qty and Price inputs from `type="number"` to `type="text" inputMode="decimal"` per project standards (no spinner arrows, numeric keyboard on mobile).

4. **Reduce total width**: Change `w-20` to `w-auto` since it'll be on its own row on mobile.

5. **Reduce dialog padding on mobile**: `p-4 sm:p-6` for breathing room without waste.

### Technical Details

```text
Line item layout change:

Before (single flex row):
  [Description                              ]
  [Qty] [Unit] [Price]  $Total  [X]

After (mobile-friendly):
  [Description                              ]
  [  Qty  ] [ Unit ] [ Price ]
  $Total                              [X]
```

Only one file changes: `src/components/estimates/QuickQuoteDialog.tsx`. No database or backend changes needed.

