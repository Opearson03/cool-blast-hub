
# Auto-sync Inclusions/Exclusions Based on Module Answers

## Problem Summary

When users enable "Concrete Pumping" or "Detailed Excavation" in the calculator modules, the corresponding items in the "What's Included" and "What's Excluded" lists on the Conditions step don't update automatically. Users must manually check/uncheck these boxes, which is error-prone and confusing.

## Current Behavior

| User Action | Expected | Actual |
|-------------|----------|--------|
| Enable "Pump Required" in Concrete Pumping module | "Concrete pump hire" auto-checked in Inclusions | Remains unchecked |
| Enable "Detailed/Bulk Excavation" in Excavation module | "Excavation" removed from Exclusions | Remains checked |

## Root Cause

The `selectedInclusions` and `selectedExclusions` state are initialized once with defaults (lines 384-385) and only updated when users manually click the checkboxes. There's no synchronization logic that reads from `modularScopeStates.moduleAnswers` to update these lists.

**Default initialization:**
```javascript
// pump_hire (index 6) is NOT in default inclusions (only 0-5)
setSelectedInclusions(new Set(DEFAULT_INCLUSIONS.slice(0, 6).map(i => i.id)));

// exc_excavation (index 0) IS in default exclusions
setSelectedExclusions(new Set(DEFAULT_EXCLUSIONS.slice(0, 4).map(e => e.id)));
```

## Solution

Add a `useEffect` hook that watches `modularScopeStates` and automatically syncs the inclusions/exclusions based on module answers:

1. **Pumping**: If ANY scope has `concrete-pumping.pump_required === true`, add `pump_hire` to inclusions
2. **Excavation**: If ANY scope has `excavation.detailed_excavation_required === true` OR `excavation.bulk_excavation_required === true`, remove `exc_excavation` from exclusions

The sync should only ADD items when modules are enabled, never remove user's manual additions. Similarly for exclusions, only REMOVE when excavation is enabled, never add back.

---

## Technical Details

### File: `src/components/estimates/EstimateFormDialog.tsx`

**Add new useEffect hook** (after line ~662, near other useEffect hooks):

```typescript
// Auto-sync inclusions/exclusions based on module answers
useEffect(() => {
  // Check all scopes for module answers
  let hasPumping = false;
  let hasExcavation = false;
  
  for (const scopeType of Array.from(selectedScopes)) {
    const state = modularScopeStates[scopeType];
    if (!state?.moduleAnswers) continue;
    
    // Check concrete-pumping module
    const pumpingAnswers = state.moduleAnswers['concrete-pumping'];
    if (pumpingAnswers?.pump_required === true) {
      hasPumping = true;
    }
    
    // Check excavation module  
    const excavationAnswers = state.moduleAnswers['excavation'];
    if (excavationAnswers?.detailed_excavation_required === true || 
        excavationAnswers?.bulk_excavation_required === true) {
      hasExcavation = true;
    }
  }
  
  // Sync inclusions - add pump_hire if pumping is enabled
  if (hasPumping && !selectedInclusions.has('pump_hire')) {
    setSelectedInclusions(prev => new Set([...prev, 'pump_hire']));
  }
  
  // Sync exclusions - remove exc_excavation if excavation is enabled
  if (hasExcavation && selectedExclusions.has('exc_excavation')) {
    setSelectedExclusions(prev => {
      const next = new Set(prev);
      next.delete('exc_excavation');
      return next;
    });
  }
}, [modularScopeStates, selectedScopes, selectedInclusions, selectedExclusions]);
```

---

## Testing Verification

After implementation:
1. Create a new estimate and add a Raft Slab scope
2. In the Configure step, open the "Concrete Pumping" module
3. Toggle "Do you require a concrete pump?" to ON
4. Navigate to the Conditions step
5. **Verify**: "Concrete pump hire" should be automatically checked
6. Go back to Configure, open "Excavation" module
7. Toggle "Detailed excavation required?" to ON  
8. Return to Conditions step
9. **Verify**: "Excavation and site preparation" should be automatically unchecked from exclusions

---

## Edge Cases Handled

- **Multiple scopes**: If any scope has pumping/excavation enabled, the sync triggers
- **User override**: Users can still manually uncheck pump_hire or re-check excavation if desired
- **No double-triggering**: The check `!selectedInclusions.has('pump_hire')` prevents unnecessary state updates
