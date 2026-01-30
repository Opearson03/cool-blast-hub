

# Fix Raft Slab Chair Costs Not Updating with Selection

## Problem Summary

When users change the **Chair Size** dropdown in the Raft Slab reinforcement module, the cost does not update. The chair type is stored, but the associated price remains unchanged from its default or previous value.

## Root Cause

In `AreaReinforcementInput.tsx`, when the user changes the chair type, only the `chair_type` property is updated - the `chair_price_per_bag` is not reset to the new chair type's price from the catalog.

**Current buggy code (line 551):**
```javascript
onValueChange={(val) => updateArea(index, { chair_type: val })}
```

**Compare with mesh type (lines 344-350) which works correctly:**
```javascript
onValueChange={(val) => {
  // When mesh type changes, update type and reset price to catalog price
  const catalogPrice = getMeshPrice(val, priceMap);
  updateArea(index, { 
    mesh_type: val,
    mesh_price: catalogPrice
  });
}}
```

The same pattern should be applied to chair type selection.

## Solution

Update the `chair_type` `onValueChange` handler to also update `chair_price_per_bag` with the new chair's catalog price from the price map.

---

## Technical Details

### File: `src/components/estimates/calculators/AreaReinforcementInput.tsx`

**Add helper function** (near the existing `getMeshPrice` function, around line 60):

```javascript
// Get chair price from price map
function getChairPrice(chairType: string, priceMap?: PriceMap): number | undefined {
  if (!priceMap) return undefined;
  return priceMap['consumables']?.[chairType];
}
```

**Update chair type selector** (around line 549-551):

Before:
```javascript
onValueChange={(val) => updateArea(index, { chair_type: val })}
```

After:
```javascript
onValueChange={(val) => {
  // When chair type changes, update type and reset price to catalog price
  const catalogPrice = getChairPrice(val, priceMap);
  updateArea(index, { 
    chair_type: val,
    chair_price_per_bag: catalogPrice
  });
}}
```

---

## Other Scopes to Check

I audited other reinforcement components for similar chair selection patterns:

| Component | Has Chair Type Selector? | Status |
|-----------|-------------------------|--------|
| `AreaReinforcementInput.tsx` | Yes (Chair Size dropdown) | **BUG - needs fix** |
| `BeamReinforcementInput.tsx` | No (TM chairs only - no size selection) | OK |
| `LinearSectionReinforcementInput.tsx` | No (TM chairs only - no size selection) | OK |
| `PadFootingGroupReinforcementInput.tsx` | No (only price input, no type selection) | OK |

Only `AreaReinforcementInput.tsx` has the chair type selector, so this is the only file that needs to be fixed.

---

## Testing Verification

After implementation:
1. Open a Raft Slab estimate with an area configured
2. Enable Bar Chairs for the area
3. Note the default chair type (75-90mm) and price
4. Change Chair Size to "100-120mm"
5. Verify the price updates from ~$22.40 to ~$45.00 (from catalog)
6. Verify the Cost Breakdown total updates accordingly
7. Change to "25-40mm" and verify price updates to ~$15.80

