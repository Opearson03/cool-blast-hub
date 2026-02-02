
# Fix Chair Type Selection Not Updating for Strip/Retaining Wall Footings

## Problem Analysis

When selecting a chair type (e.g., 50-65mm) in the retaining wall or strip footing reinforcement section, the selection doesn't update properly. After investigating the code flow, I've identified the root cause.

### Root Cause

The issue is in the `FootingSectionReinforcementInput.tsx` component. The `updateGroupReinforcement` callback uses `sections` from its closure, but the matching logic compares against properties from the `group` object that was created during the initial grouping. 

The problem occurs because:

1. The `group` object passed to `updateGroupReinforcement` is from the **current render's** `groups` memo
2. But the `sections` in the `useCallback` closure may be from a **previous render** if React batches state updates
3. The matching logic uses `group.typeName`, `group.width`, and `group.depth` - if these don't match the section being iterated (due to stale closure), no update occurs

Additionally, the `priceMap` lookup for chair prices uses the item code directly (e.g., `'5065C'`), but if the price lookup returns `undefined`, the fallback price is applied without any indication to the user.

### Secondary Issue

The `onChange` callback in `ModuleSection.tsx` is an inline function that captures `hasLinearSections` at render time. If this value is stale, the update could go to the wrong data key (`footings` vs `linearSections`).

---

## Solution

### Fix 1: Stabilize the update callback

Update `FootingSectionReinforcementInput.tsx` to use a more robust matching approach that doesn't rely on the `group` object's potentially stale properties.

**Before (current code):**
```typescript
const updateGroupReinforcement = useCallback((group: FootingTypeGroup, updates: Partial<LinearSection>) => {
  const updatedSections = sections.map(section => {
    const sectionType = parseFootingTypeName(section.name);
    const width = section.dimension1 || 0;
    const depth = section.dimension2 || 0;
    if (sectionType === group.typeName && width === group.width && depth === group.depth) {
      return { ...section, ...updates };
    }
    return section;
  });
  onChange(updatedSections);
}, [sections, onChange]);
```

**After (fixed code):**
```typescript
const updateGroupReinforcement = useCallback((group: FootingTypeGroup, updates: Partial<LinearSection>) => {
  // Use segment IDs for matching instead of dimension comparison
  // This is more robust as IDs are unique and don't change
  const segmentIds = new Set(group.segments.map(s => s.id));
  
  const updatedSections = sections.map(section => {
    if (segmentIds.has(section.id)) {
      return { ...section, ...updates };
    }
    return section;
  });
  onChange(updatedSections);
}, [sections, onChange]);
```

### Fix 2: Use stable section ID matching

The current matching uses `typeName + width + depth` which can be unreliable if sections have the same dimensions. Using segment IDs (which are unique) provides more reliable matching.

### Fix 3: Add explicit dependency tracking

Ensure the `onChange` callback has access to the latest `priceMap` value for price lookups during selection:

```typescript
// In the Select onValueChange handler
onValueChange={(val) => {
  // Use the helper function which is already scoped correctly
  const catalogPrice = getChairPrice(val, priceMap);
  const pricePerBagOf25 = catalogPrice !== undefined ? catalogPrice / 4 : 12.50;
  updateGroupReinforcement(group, { 
    chair_type: val,
    chair_price_per_bag: pricePerBagOf25
  });
}}
```

The current inline access `priceMap?.['consumables']?.[val]` should be replaced with the already-defined `getChairPrice` helper function for consistency.

---

## Technical Implementation

### File: `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx`

#### Change 1: Update `updateGroupReinforcement` to use segment IDs (lines 211-222)

Replace dimension-based matching with ID-based matching:
- Create a Set of segment IDs from `group.segments`
- Match sections by ID instead of by typeName + dimensions
- This ensures the correct sections are updated even if the group object has stale dimension values

#### Change 2: Use `getChairPrice` helper in onValueChange (line 990)

Replace direct priceMap access with the helper function for consistency:
- Current: `const catalogPrice = priceMap?.['consumables']?.[val];`
- Fixed: `const catalogPrice = getChairPrice(val, priceMap);`

This applies to both:
- Chair type selection (line 990)
- Layer chair type selection (line 1066)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx` | Fix matching logic in `updateGroupReinforcement`, use helper for price lookups |

---

## Testing Checklist

After implementation:
1. Create a new strip footing estimate with multiple footing sections
2. Enable TM Chairs in the reinforcement section
3. Change the chair type from 50-65mm to 75-90mm
4. Verify the dropdown shows the new selection
5. Verify the price per bag updates correctly
6. Verify the cost summary reflects the new chair price
7. Save the estimate and reload - verify the selection persists
8. Repeat for retaining wall footings
