
# Waffle Pod Calculation Fixes

## Overview
Three related issues prevent the Waffle Pod estimator from correctly processing pod counts, spacer counts, and pod rail calculations:
1. Spacer counts from the takeoff step are not being transferred to the calculator
2. Pod rail calculations depend on data that isn't being passed correctly
3. The reinforcement input still shows a "Bar Chairs" option for Waffle Pods (should use Pod Rails instead)

---

## Problem Analysis

### Current Data Flow Gap
During takeoff, users count:
- Waffle Pods (stored in `pendingSlabData.wafflePodCount`)
- 4-Way Spacers (stored in `pendingSlabData.spacer4WayCount`)
- 2-Way Spacers (stored in `pendingSlabData.spacer2WayCount`)

However, this data lives only in local component state (`PlanTakeoffStep.tsx`) and is **never persisted** to the database or passed to the calculator. When the user navigates to the "Configure" step, the prefill logic in `EstimateFormDialog.tsx` only estimates pod count from the slab area, ignoring the actual counted values.

### Pod Rails Logic
Pod rails are calculated in `ModularCalculator.tsx` when:
- `top_slab_thickness >= 100mm`
- `pod_count` is available

Since the actual counted pod count isn't being transferred, and top slab thickness may not be set yet, the calculation fails silently.

### Chair Option
The `AreaReinforcementInput` component shows "Bar Chairs" for all slab areas. For Waffle Pods, this should be hidden when pod rails are required (100mm+ slabs), as pod rails replace standard chairs.

---

## Technical Solution

### Task 1: Persist Pod/Spacer Counts in Database

**File**: `supabase/migrations/` (new migration)

Add columns to `takeoff_markups` table to store waffle pod counting data:

```text
┌────────────────────────────────────────┐
│ takeoff_markups table additions        │
├────────────────────────────────────────┤
│ + pod_count (integer)                  │
│ + spacer_4way_count (integer)          │
│ + spacer_2way_count (integer)          │
│ + pod_thickness_mm (integer)           │
└────────────────────────────────────────┘
```

This allows the counted values to persist with the slab markup record.

### Task 2: Save Counts When Finishing Waffle Pod Workflow

**File**: `src/hooks/useTakeoffData.ts`

Modify the `addSlabWithBeams` function to accept optional waffle pod data:

```typescript
addSlabWithBeams(
  fileId,
  scopeId,
  slabData,
  edgeBeams,
  internalBeams,
  color,
  pageNumber,
  // New optional parameter:
  wafflePodData?: {
    podCount: number;
    podThickness: number;
    spacer4WayCount: number;
    spacer2WayCount: number;
  }
)
```

The function will insert these values into the new columns when saving a waffle pod slab.

### Task 3: Update PlanTakeoffStep to Pass Counted Data

**File**: `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Modify `handleFinishAllBeams` to include the waffle pod counting data when saving:

```typescript
if (activeScope === 'waffle_pod' && wafflePodCountingComplete) {
  await addSlabWithBeams(
    // ... existing params ...
    {
      podCount: pendingSlabData.wafflePodCount || 0,
      podThickness: Number(wafflePodDepth),
      spacer4WayCount: pendingSlabData.spacer4WayCount || 0,
      spacer2WayCount: pendingSlabData.spacer2WayCount || 0,
    }
  );
}
```

### Task 4: Read Counts in useTakeoffMarkups Hook

**File**: `src/hooks/useTakeoffMarkups.ts`

Update the fetch query to include the new columns and expose them in the `RaftSlabAreaFromTakeoff` interface:

```typescript
interface RaftSlabAreaFromTakeoff {
  // ... existing fields ...
  podCount?: number;
  podThickness?: number;
  spacer4WayCount?: number;
  spacer2WayCount?: number;
}
```

### Task 5: Prefill Scope Answers with Counted Values

**File**: `src/components/estimates/EstimateFormDialog.tsx`

Update the waffle pod prefill logic (around line 1238) to use actual counted values:

```typescript
if (scope === 'waffle_pod') {
  const raftSlabAreas = getRaftSlabAreasForScope(scope);
  const firstArea = raftSlabAreas[0];
  
  initialScopeAnswers = {
    ...initialScopeAnswers,
    // Use actual counted values if available
    pod_count: firstArea?.podCount ?? estimatedPodCount,
    pod_thickness: firstArea?.podThickness 
      ? String(firstArea.podThickness) 
      : '225',
    spacer_4way_count: firstArea?.spacer4WayCount ?? 0,
    spacer_2way_count: firstArea?.spacer2WayCount ?? 0,
    // ... existing fields ...
  };
}
```

### Task 6: Hide Chair Option for Waffle Pods Using Pod Rails

**File**: `src/components/estimates/calculators/AreaReinforcementInput.tsx`

Add a prop to identify waffle pod scope and conditionally hide the "Bar Chairs" section:

```typescript
interface AreaReinforcementInputProps {
  // ... existing props ...
  scopeId?: string;
  podRailsRequired?: boolean;
}
```

When `scopeId === 'waffle_pod'` and `podRailsRequired === true`, hide the "Bar Chairs" toggle and display a note:

```text
"Pod Rails are used instead of bar chairs for this waffle pod configuration."
```

**File**: `src/components/estimates/calculators/ModularCalculator.tsx`

Pass the `scopeId` and calculated `pod_rails_required` flag to `AreaReinforcementInput`.

### Task 7: Update TakeoffPoint Types

**File**: `src/types/takeoff.ts`

Add the new fields to the `TakeoffMarkup` interface for type safety:

```typescript
interface TakeoffMarkup {
  // ... existing fields ...
  pod_count?: number | null;
  pod_thickness_mm?: number | null;
  spacer_4way_count?: number | null;
  spacer_2way_count?: number | null;
}
```

---

## Implementation Order

1. Database migration (add columns)
2. Update TypeScript types (`TakeoffMarkup`)
3. Modify `useTakeoffData.ts` to save pod/spacer counts
4. Update `PlanTakeoffStep.tsx` to pass data when saving
5. Update `useTakeoffMarkups.ts` to read new columns
6. Update `EstimateFormDialog.tsx` prefill logic
7. Update `AreaReinforcementInput.tsx` to hide chairs for waffle pods

---

## Validation Checklist

After implementation, verify:
- [ ] Pod count from takeoff appears in calculator's pod_count field
- [ ] 4-Way and 2-Way spacer counts appear in their respective fields
- [ ] Pod rails auto-calculate when top slab thickness >= 100mm
- [ ] Pod rail packs appear in BOQ when applicable
- [ ] Spacers appear in BOQ when counts > 0
- [ ] "Bar Chairs" option is hidden for waffle pod areas with pod rails
- [ ] Existing waffle pod estimates without counts still work (graceful fallback)
