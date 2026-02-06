
# Plan: Fix RFQ Popup Content Overflow Issue

## Problem
Content throughout the Order Wizard dialog is being cut off and hidden beneath the footer buttons ("Back", "Cancel", "Send PO/Request Quote"). The ScrollArea is not properly containing the content within the available space, causing content to fall off the bottom.

## Root Cause Analysis

The layout structure is:
```
DialogContent (max-h-[85vh], flex flex-col, overflow-hidden)
  ├── StepIndicator (fixed height)
  ├── ScrollArea (flex-1, min-h-0)  <-- ISSUE HERE
  │     └── Viewport (needs explicit overflow control)
  │           └── div (min-h-[200px], pb-4)
  │                 └── Step content
  └── DialogFooter (fixed height, pt-4 border-t)
```

**Issues identified:**
1. The Radix ScrollArea Viewport needs `!overflow-y-auto` to ensure scrolling works in flexbox
2. The inner content wrapper doesn't have enough bottom padding to clear the footer
3. The ScrollArea negative margins (`-mx-6 px-6`) can interfere with scroll behavior

## Solution

### 1. Fix ScrollArea Viewport Styling
Update the ScrollArea component to add proper overflow handling for the viewport, or override it in OrderWizardDialog.

### 2. Update OrderWizardDialog Layout
- Remove the negative margin hack on ScrollArea
- Add proper padding/margin management
- Ensure content has adequate bottom spacing

## Technical Changes

### File: `src/components/jobs/boq/order-wizard/OrderWizardDialog.tsx`

**Current (line 462-470):**
```tsx
<DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
  <StepIndicator ... />
  
  <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
    <div className="min-h-[200px] pb-4">
      {/* Step content */}
    </div>
  </ScrollArea>
  
  <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
```

**Fix:**
1. Remove `-mx-6 px-6` from ScrollArea (this hack causes scroll issues)
2. Add `[&_[data-radix-scroll-area-viewport]]:!overflow-y-auto` to force proper scrolling
3. Add `pr-2` for scrollbar clearance
4. Increase bottom padding inside the content wrapper to ensure content clears the footer area

```tsx
<DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0">
  <div className="p-6 pb-0">
    <StepIndicator ... />
  </div>
  
  <ScrollArea className="flex-1 min-h-0 px-6 [&_[data-radix-scroll-area-viewport]]:!overflow-y-auto">
    <div className="min-h-[200px] pb-6">
      {/* Step content */}
    </div>
  </ScrollArea>
  
  <DialogFooter className="flex-row justify-between gap-2 p-6 pt-4 border-t mt-auto flex-shrink-0">
```

Key changes:
- **DialogContent**: `p-0` to manage padding manually per section
- **StepIndicator wrapper**: `p-6 pb-0` for top/side padding
- **ScrollArea**: Remove margin hack, add explicit viewport overflow control
- **Content div**: `pb-6` for proper bottom clearance
- **DialogFooter**: `p-6 pt-4 flex-shrink-0` to ensure it never shrinks and has proper padding

### Alternative simpler fix:
If the above restructuring is too invasive, a simpler fix:

```tsx
<ScrollArea className="flex-1 min-h-0 -mx-6 px-6 [&>div]:!overflow-y-auto">
  <div className="min-h-[200px] pb-8">
    {/* Step content - increased bottom padding */}
  </div>
</ScrollArea>
```

This targets the Radix viewport div and forces vertical scrolling, plus adds more bottom padding.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/jobs/boq/order-wizard/OrderWizardDialog.tsx` | Fix ScrollArea layout and padding to prevent content overflow |

---

## Testing Checklist

1. Open BOQ Order Wizard and select "Request Quote"
2. Proceed through all 5 steps
3. Verify ALL content is visible and scrollable on each step:
   - Type step: Both options visible
   - Items step: All items scrollable, no cutoff
   - Supplier step: All suppliers visible, search works
   - Delivery step: All fields visible including Notes textarea at bottom
   - Review step: All sections visible including "Include building plans" toggle and "Will be sent via email" footer
4. Verify footer buttons (Back, Cancel, Send) are always visible and not covering content
5. Test on mobile viewport to ensure scrolling works on smaller screens
6. Test with many items/suppliers to ensure long lists scroll properly
