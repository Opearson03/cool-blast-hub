
## Add "Mark on Plans or Enter Manually" to Strip Footings, Retaining Walls, and Pad Footings

### Overview
Extend the existing markup prompt functionality (already working in Piers scope) to Strip Footings, Retaining Walls, and Pad Footings scopes. When users click "Add Footing" or "Add Group" in these scopes, they'll see the same dialog offering the choice between marking on plans or entering manually.

### Current State
- **Piers**: Already correctly passes `scope.id` to `onRequestMarkup`, enabling navigation back to the correct takeoff tool
- **Strip Footings / Retaining Walls**: Use `MultiFootingInput` but pass `onRequestMarkup` without the scope identifier
- **Pad Footings**: Uses `MultiPadFootingGroupInput` but also passes `onRequestMarkup` without the scope identifier

### Changes Required

**File: `src/components/estimates/calculators/ModularCalculator.tsx`**

1. **Update MultiFootingInput** (lines 918-919)
   - Change: `onRequestMarkup={onRequestMarkup}`
   - To: `onRequestMarkup={() => onRequestMarkup?.(scope.id)}`
   - This affects both Strip Footings and Retaining Wall Footings scopes since they share this component

2. **Update MultiPadFootingGroupInput** (lines 955-956)
   - Change: `onRequestMarkup={onRequestMarkup}`  
   - To: `onRequestMarkup={() => onRequestMarkup?.(scope.id)}`
   - This affects the Pad Footings scope

### Technical Details

The `onRequestMarkup` callback signature is `(scopeId?: string) => void`. When called with a scope ID, the parent `EstimateFormDialog` uses this to:
1. Navigate back to the Plan Takeoff step
2. Automatically activate the correct markup tool for that scope (e.g., `strip_footing` tool for Strip Footings)

The `MultiFootingInput` and `MultiPadFootingGroupInput` components already have:
- `MarkupPromptDialog` integration
- `handleAddClick` logic that shows the prompt when `hasPlans` is true
- `handleMarkOnPlans` and `handleEnterManually` handlers

No changes needed to the input components themselves - they already call `onRequestMarkup?.()` correctly. The fix is purely in how `ModularCalculator` passes the callback.

### Testing Checklist
- [ ] Strip Footings: Click "Add Footing" → Dialog appears with "Mark on plans" / "Enter manually" options
- [ ] Retaining Walls: Same behavior as Strip Footings
- [ ] Pad Footings: Click "Add Group" → Same dialog appears
- [ ] Selecting "Mark on plans" navigates to takeoff step with correct tool active
- [ ] Selecting "Enter manually" adds a new item inline as before
- [ ] "Don't ask me again" checkbox works for each scope
