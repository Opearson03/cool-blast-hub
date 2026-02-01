
# Remove Duplicate Bar Chairs from Measure Section

## Problem Summary

The bar chairs option appears in two places for strip footings and retaining wall footings:

1. **Measure section** (`MultiLinearTypeInput.tsx` lines 555-571): Basic "Include Chairs?" toggle
2. **Reinforcement section** (`FootingSectionReinforcementInput.tsx`): Full chair configuration with type selection, pricing, and layer chairs

The measure section version is a duplicate and less featured - it should be removed.

---

## Solution

Remove the chairs section from `MultiLinearTypeInput.tsx` that is scoped to strip footings and retaining wall footings.

---

## Changes Required

**File:** `src/components/estimates/calculators/MultiLinearTypeInput.tsx`

### Delete the Chairs Section (lines 555-571)

Remove this entire block:
```typescript
{/* Chairs Section - for strip footings and retaining wall footings */}
{(scopeId === 'strip_footings' || scopeId === 'retaining_wall_footings') && (
  <div className="border-t px-3 py-3 bg-muted/20">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">Include Chairs?</Label>
      <Switch
        checked={group.chairs_enabled ?? false}
        onCheckedChange={(checked) => updateGroupChairs(group, checked)}
      />
    </div>
    {group.chairs_enabled && (
      <p className="text-xs text-muted-foreground mt-2">
        Chairs will be calculated based on footing length (~1.4 per metre)
      </p>
    )}
  </div>
)}
```

Also remove the associated `updateGroupChairs` function if it exists and is only used by this section.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/estimates/calculators/MultiLinearTypeInput.tsx` | Remove duplicate chairs section (lines 555-571) and associated function |

---

## Impact

- Bar chairs configuration will only appear in the Reinforcement module (where it belongs)
- Users will have access to the full chair configuration (type, price, layer chairs) in one place
- No duplicate data or confusion between the two sections
- Existing chair settings saved in linearSections will continue to work with the reinforcement UI
