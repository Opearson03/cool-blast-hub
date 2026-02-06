

# Plan: Fix Order Wizard Popup Usability Issues

## Problems Identified

After reviewing all the components, I've identified the following issues causing the popup to be unusable:

### 1. **ScrollArea Viewport Height Issue**
The Radix `ScrollArea` component has a `Viewport` that uses `h-full w-full`, but in a flex container, `h-full` doesn't work without an explicit height. The `[&_[data-radix-scroll-area-viewport]]:!overflow-y-auto` fix added overflow but doesn't fix the **height calculation** issue.

**Root cause**: The viewport needs explicit height constraints, not just overflow control.

### 2. **Content Competing for Space**
Each step component has internal scrolling or fixed heights that conflict with the parent ScrollArea:
- `ItemsStep`: Has `max-h-80 overflow-y-auto` on the items list (nested scroll)
- `SupplierStep`: Has `max-h-48` on the CommandList (nested scroll) 
- These nested scroll areas inside the parent ScrollArea cause unpredictable behavior

### 3. **Missing Viewport Height on ScrollArea**
The ScrollArea needs explicit height constraints via CSS to properly calculate available space. Currently it uses `flex-1 min-h-0` but the Radix Viewport inside doesn't inherit this properly.

### 4. **Footer/Header Not Accounted For**
The dialog structure doesn't properly reserve space for the header (StepIndicator) and footer, leaving the ScrollArea to fight for remaining space.

---

## Solution: Complete Layout Restructure

### Approach
Replace the problematic `ScrollArea` with a simpler CSS-based scrolling solution that works reliably in flexbox containers.

---

## Technical Changes

### File: `src/components/jobs/boq/order-wizard/OrderWizardDialog.tsx`

**Current Structure (Broken):**
```tsx
<DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0">
  <div className="p-6 pb-4">
    <StepIndicator ... />
  </div>
  
  <ScrollArea className="flex-1 min-h-0 px-6 [&_[data-radix-scroll-area-viewport]]:!overflow-y-auto">
    <div className="min-h-[200px] pb-6">
      {/* Step content */}
    </div>
  </ScrollArea>
  
  <DialogFooter className="flex-row justify-between gap-2 p-6 pt-4 border-t flex-shrink-0">
```

**New Structure (Fixed):**
```tsx
<DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0">
  {/* Header - fixed height, never shrinks */}
  <div className="flex-shrink-0 p-6 pb-4">
    <StepIndicator ... />
  </div>
  
  {/* Scrollable content area - takes remaining space, scrolls internally */}
  <div className="flex-1 overflow-y-auto px-6 min-h-0">
    <div className="pb-6">
      {/* Step content */}
    </div>
  </div>
  
  {/* Footer - fixed height, never shrinks */}
  <DialogFooter className="flex-shrink-0 flex-row justify-between gap-2 p-6 pt-4 border-t">
```

**Key changes:**
1. Replace `ScrollArea` with a simple `div` using `overflow-y-auto`
2. Add `flex-shrink-0` to both header and footer to prevent them from shrinking
3. Use `flex-1 min-h-0 overflow-y-auto` on the content area (this is the standard flexbox scroll pattern)
4. Remove the Radix viewport override hack

---

### File: `src/components/jobs/boq/order-wizard/ItemsStep.tsx`

**Remove nested scroll area** - let the parent handle scrolling:

```tsx
// Before (line 49):
<div className="border rounded-lg divide-y max-h-80 overflow-y-auto">

// After:
<div className="border rounded-lg divide-y">
```

---

### File: `src/components/jobs/boq/order-wizard/SupplierStep.tsx`

**Remove nested scroll constraint** on CommandList:

```tsx
// Before (line ~99):
<CommandList className="max-h-48">

// After:
<CommandList className="max-h-[200px]">
```

Keep a max-height but make it reasonable. Also for the PO supplier search (line ~146):
```tsx
<CommandList className="max-h-[200px]">
```

---

### File: `src/components/jobs/boq/order-wizard/DeliveryStep.tsx`

The Notes textarea at the bottom has `pb-4` which may not be enough. Increase to ensure visibility:

```tsx
// Line 152 - already has pb-4, but the parent now handles scrolling
// No change needed here
```

---

### File: `src/components/jobs/boq/order-wizard/ReviewStep.tsx`

The final `pb-4` div (line 361) is adequate. No changes needed.

---

## Summary of Changes

| File | Change |
|------|--------|
| `OrderWizardDialog.tsx` | Replace ScrollArea with native CSS scroll; add flex-shrink-0 to header/footer |
| `ItemsStep.tsx` | Remove `max-h-80 overflow-y-auto` from items list |
| `SupplierStep.tsx` | Adjust `max-h-48` to `max-h-[200px]` for both CommandLists |

---

## Why This Works

1. **Flexbox scroll pattern**: `flex: 1` + `min-height: 0` + `overflow-y: auto` is the standard CSS pattern for creating a scrollable area that takes remaining space in a flex container.

2. **No Radix quirks**: The Radix ScrollArea component has known issues in certain flex layouts. Using native CSS scroll is more reliable.

3. **Single scroll context**: Removing nested scrollable areas prevents "scroll trapping" where the user's scroll input gets captured by the wrong element.

4. **Fixed header/footer**: Using `flex-shrink-0` ensures the header and footer always remain visible and never get pushed off-screen.

---

## Testing Checklist

1. Open Order Wizard → verify all 5 steps are fully visible and scrollable
2. **Type step**: Both cards visible without scrolling
3. **Items step**: Long item list scrolls properly, "Select All" header stays visible
4. **Supplier step**: Search dropdown works, all suppliers visible when scrolling
5. **Delivery step**: All fields visible - Address, Date, Site Contact, Notes textarea at bottom
6. **Review step**: All summary info visible, "Include plans" toggle visible, email notice at bottom visible
7. Footer buttons (Back, Cancel, Send) always visible and not covering content
8. Test on mobile viewport (small screen) - content should scroll without cutoff

