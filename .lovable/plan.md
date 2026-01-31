

# Fix Done Badge Column Alignment in Module Sections

## Problem Summary

The "Done" badges across module sections within each scope are not aligned in a neat column. This happens because:

1. **Variable module name lengths**: Module names like "Concrete Supply" vs "Pods" have very different widths
2. **Conflicting `ml-auto` classes**: Both the Done badge and the subtotal use `ml-auto`, causing unpredictable positioning
3. **Badge placed before subtotal**: The badge sits between the name and subtotal, so its position shifts based on name length

## Current Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  Module Name      [Done]               $1,234.56        ▼          │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  Concrete Pumping         [Done]       $567.89          ▼          │
└─────────────────────────────────────────────────────────────────────┘
```

The Done badges don't align because they follow the variable-width module names.

## Solution

Restructure the accordion trigger layout to use a **fixed column grid** that places the Done badge and subtotal in predictable positions:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Module Name                          [Done]    $1,234.56    ▼     │
│  ─────────────(flex-1)──────────────  ──────    ──────────   ──    │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout Changes

**File:** `src/components/estimates/calculators/ModuleSection.tsx`

Change the trigger content structure from:

```tsx
<div className="flex items-center gap-3 flex-1">
  <span className="font-medium">{module.name}</span>
  {isMarkedDone && <AccordionDoneBadge />}
  {subtotal > 0 && (
    <span className="ml-auto mr-4 text-sm font-medium text-primary">
      {formatCurrency(subtotal)}
    </span>
  )}
</div>
```

To a structured grid layout:

```tsx
<div className="flex items-center gap-3 flex-1 min-w-0">
  {/* Module name - takes remaining space */}
  <span className="font-medium truncate">{module.name}</span>
  
  {/* Spacer to push right-side elements */}
  <div className="flex-1" />
  
  {/* Done badge - fixed width container for alignment */}
  <div className="w-16 flex justify-end shrink-0">
    {isMarkedDone && <AccordionDoneBadge />}
  </div>
  
  {/* Subtotal - fixed width container for alignment */}
  <div className="w-24 text-right shrink-0">
    {subtotal > 0 && (
      <span className="text-sm font-medium text-primary">
        {formatCurrency(subtotal)}
      </span>
    )}
  </div>
</div>
```

### AccordionDoneBadge Update

**File:** `src/components/estimates/calculators/shared/AccordionDoneBadge.tsx`

Remove `ml-auto mr-2` from the badge since positioning is now handled by the parent container:

```tsx
export const AccordionDoneBadge = () => (
  <Badge 
    variant="outline" 
    className="bg-green-50 text-green-700 border-green-200 text-xs dark:bg-green-950 dark:text-green-400 dark:border-green-800"
  >
    <Check className="w-3 h-3 mr-1" /> Done
  </Badge>
);
```

## After Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Module Name                                   [Done]  $1,234.56 ▼ │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  Concrete Pumping                              [Done]    $567.89 ▼ │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  Pods                                                     $89.00 ▼ │
└─────────────────────────────────────────────────────────────────────┘
```

The Done badges and subtotals now align in neat columns regardless of module name length.

## Verification: Done State Persistence

The "Done" state already persists correctly:

1. **On click**: `setDoneModules((prev) => new Set([...prev, module.id]))` adds module to state
2. **State change notification**: `notifyStateChange` includes `doneModules: Array.from(doneModules)`
3. **Parent handler**: `handleModularStateChange` stores `doneModules` in `modularScopeStates`
4. **Auto-save trigger**: `onModuleDone` calls `saveDraftMutation.mutate({ closeAfter: false, showToast: false })`
5. **Restoration**: `initialDoneModules={currentState?.doneModules}` restores state on component mount

The flow is complete and working correctly for persistence.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/ModuleSection.tsx` | Restructure trigger layout with fixed-width columns |
| `src/components/estimates/calculators/shared/AccordionDoneBadge.tsx` | Remove `ml-auto mr-2` margin classes |

## Impact

- Done badges will align in a neat vertical column across all modules in each scope
- Subtotals will also align in their own column
- Long module names will truncate with ellipsis if needed
- No changes to Done state persistence (already working correctly)
- Responsive behavior preserved with `shrink-0` on fixed-width elements

