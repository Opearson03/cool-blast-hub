
# Waffle Pod Spacers & Pod Rails Fix

## Overview
This plan addresses three issues with the Waffle Pod estimation workflow:
1. 4-way and 2-way spacer counts are not auto-filling in the estimate calculator
2. Pod rails need a visible Yes/No toggle that auto-selects based on slab thickness
3. Pod rails calculation needs to be verified (2 rails per pod, packs of 20)

---

## Root Cause Analysis

### Issue 1: Spacer Counts Not Auto-filling

The data is stored correctly in `pendingSlabData` during the counting workflow, but there's a critical bug:

**Problem Location**: `PlanTakeoffStep.tsx` line 786
```typescript
// In handleSavePodCount:
wafflePodCount: wafflePodPoints.length,  // ← This is 0!
```

When the user clicks "Save Only" in the pod count dialog, `wafflePodPoints` is still empty because the points are stored in `pierPoints`. The `handleDoneCountingWafflePods` function copies `pierPoints` to `wafflePodPoints`, but this happens when showing the dialog, not when saving.

**Additionally**: The database query confirms all waffle pod markups have `null` for spacer counts, meaning the data never gets persisted.

### Issue 2: Pod Rails Toggle

Currently, `pod_rails_required` is a hidden boolean that's auto-calculated in `ModularCalculator.tsx`. The user wants:
- A visible Yes/No toggle in the scope dimensions card
- Auto-select "Yes" when `top_slab_thickness >= 100mm`
- User can override the toggle

### Issue 3: Pod Rails Calculation

Current formula is correct:
- 2 pod rails per pod
- Packs of 20
- Formula: `Math.ceil((pod_count * 2) / 20)`

This matches the user's description and the existing code.

---

## Technical Solution

### Task 1: Fix Point Source in Save Handlers

**File**: `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

The `handleSavePodCount` and related handlers need to use the correct point source:

```typescript
// handleSavePodCount - line 784-788
const handleSavePodCount = useCallback(() => {
  // Use pierPoints (active points) or wafflePodPoints (already saved)
  const currentPodCount = pierPoints.length > 0 ? pierPoints.length : wafflePodPoints.length;
  
  setPendingSlabData(prev => prev ? {
    ...prev,
    wafflePodCount: currentPodCount,
    wafflePodThickness: Number(wafflePodDepth),
  } : null);
  // ... rest unchanged
}, [pierPoints, wafflePodPoints.length, wafflePodDepth]);
```

Apply similar fixes to `handleSave4WayCount` and `handleSave2WayCount`.

### Task 2: Ensure Data Persists When Skipping Counting

**File**: `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

When users skip the waffle pod counting workflow entirely (clicking "Done" on the slab without counting), we should still save default values:

```typescript
// In handleFinishAllBeams - line 678-684
const wafflePodData = (activeScope === 'waffle_pod') ? {
  podCount: pendingSlabData.wafflePodCount || 0,
  podThickness: pendingSlabData.wafflePodThickness || Number(wafflePodDepth) || 225,
  spacer4WayCount: pendingSlabData.spacer4WayCount || 0,
  spacer2WayCount: pendingSlabData.spacer2WayCount || 0,
} : undefined;
```

Remove the `&& wafflePodCountingComplete` condition so data is always passed for waffle pod scopes.

### Task 3: Add Visible Pod Rails Toggle

**File**: `src/lib/estimate-components/scopes.ts`

Update the `pod_rails_required` question to be a visible toggle:

```typescript
{
  id: 'pod_rails_required',
  type: 'boolean',
  label: 'Pod Rails Required',
  defaultValue: false,
  helpText: 'Required for slabs ≥100mm thick (2 rails per pod, packs of 20)',
  // Remove any hidden flag - make it visible
},
```

### Task 4: Auto-Select Pod Rails Based on Slab Thickness

**File**: `src/components/estimates/calculators/ModularCalculator.tsx`

The existing `useEffect` already auto-calculates pod rails when `top_slab_thickness >= 100`. Keep this logic but ensure it properly sets the visible toggle:

```typescript
// Existing useEffect at line 576-604 - verify it's working correctly
useEffect(() => {
  if (scope.id !== 'waffle_pod') return;
  
  const topSlabThickness = Number(scopeAnswers.top_slab_thickness) || 85;
  const podCount = Number(scopeAnswers.pod_count) || 0;
  
  if (topSlabThickness >= 100 && podCount > 0) {
    const railsNeeded = podCount * 2;
    const packsNeeded = Math.ceil(railsNeeded / 20);
    
    // Only update if values differ (prevent infinite loops)
    if (scopeAnswers.pod_rails_required !== true || scopeAnswers.pod_rail_packs !== packsNeeded) {
      setScopeAnswers(prev => ({
        ...prev,
        pod_rails_required: true,
        pod_rail_packs: packsNeeded,
      }));
    }
  } else if (topSlabThickness < 100) {
    // Clear pod rails if slab is thinner than 100mm
    if (scopeAnswers.pod_rails_required === true) {
      setScopeAnswers(prev => ({
        ...prev,
        pod_rails_required: false,
        pod_rail_packs: 0,
      }));
    }
  }
}, [scope.id, scopeAnswers.top_slab_thickness, scopeAnswers.pod_count]);
```

### Task 5: Recalculate Pod Rail Packs When Toggle Changes

**File**: `src/components/estimates/calculators/ModularCalculator.tsx`

Add logic to recalculate packs when the user manually toggles pod rails on:

```typescript
// In handleScopeAnswerChange or a separate useEffect
if (questionId === 'pod_rails_required' && value === true) {
  const podCount = Number(scopeAnswers.pod_count) || 0;
  if (podCount > 0) {
    const packsNeeded = Math.ceil((podCount * 2) / 20);
    setScopeAnswers(prev => ({
      ...prev,
      pod_rails_required: true,
      pod_rail_packs: packsNeeded,
    }));
  }
}
```

---

## Data Flow Summary

```text
Takeoff Counting          Database Storage           Calculator Prefill
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ pierPoints      │──────▶│ pod_count       │──────▶│ pod_count       │
│ (active count)  │       │ spacer_4way_cnt │       │ spacer_4way_cnt │
│                 │       │ spacer_2way_cnt │       │ spacer_2way_cnt │
│ pendingSlabData │       │ pod_thickness   │       │ pod_thickness   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                   │
                          ┌────────┴────────┐
                          ▼                 ▼
              getRaftSlabAreasForScope()    initialScopeAnswers
```

---

## Files to Modify

1. **`src/components/estimates/takeoff/PlanTakeoffStep.tsx`**
   - Fix point source in save handlers
   - Remove `wafflePodCountingComplete` gate for data persistence

2. **`src/lib/estimate-components/scopes.ts`**
   - Ensure `pod_rails_required` toggle is visible

3. **`src/components/estimates/calculators/ModularCalculator.tsx`**
   - Verify auto-select logic for pod rails
   - Add recalculation when toggle is manually changed

---

## Validation Checklist

After implementation:
- [ ] Mark waffle pod area on plan → count pods → save → verify pod_count in database
- [ ] Count 4-way spacers → save → verify spacer_4way_count in database  
- [ ] Count 2-way spacers → save → verify spacer_2way_count in database
- [ ] Navigate to Configure step → verify spacer counts appear in fields
- [ ] Set top slab thickness to 100mm → verify Pod Rails toggle auto-selects "Yes"
- [ ] Set top slab thickness to 85mm → verify Pod Rails toggle auto-selects "No"
- [ ] Manually toggle Pod Rails "Yes" → verify pack count calculates
- [ ] Complete estimate → verify spacers and pod rails appear in BOQ
