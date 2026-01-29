
# Plan: Replace Footing Reinforcement UI with Edge Beam Reinforcement Pattern

## Overview
This plan swaps out the current per-section reinforcement UI for **Strip Footings** and **Retaining Wall Footings** with the grouped beam-style reinforcement UI that is used for Raft Slab Edge Beams. This provides a more intuitive, type-grouped interface where footing sections with matching dimensions share reinforcement settings.

---

## Technical Summary

### Current Architecture
- **Strip Footings & Retaining Wall Footings**: Use `LinearSectionReinforcementInput` component which configures each section individually
- **Raft Slab Edge Beams**: Use `BeamReinforcementInput` which groups segments by type (e.g., EB1, EB2) and applies shared settings

### Target Architecture
Both footing scopes will use the same grouped pattern as edge beams, providing:
- Automatic grouping by footing type (SF1, SF2, etc.)
- Shared reinforcement settings across all segments of the same type
- Horizontal and vertical bar arrays with add/remove functionality
- TM layers with independent top/bottom pricing
- Ligatures with size and centres
- TM chairs per group

---

## Files to Modify

### 1. Create New Component: `FootingSectionReinforcementInput.tsx`
**Location**: `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx`

Create a new component based on `BeamReinforcementInput` but adapted for `LinearSection` type:
- Parse footing type names (SF1, RWF1, etc.)
- Group sections by type + dimensions (width/depth)
- Display grouped UI with shared reinforcement settings
- Support all reinforcement options: TM (1-2 layers), ligatures, horizontal bars, vertical bars, chairs

### 2. Update `ModuleSection.tsx`
**Location**: `src/components/estimates/calculators/ModuleSection.tsx`

Replace the `LinearSectionReinforcementInput` usage in the footing reinforcement section:

```text
Before:
  {isFootingReoSection && onScopeDataChange && footings.length > 0 && (
    <LinearSectionReinforcementInput ... />
  )}

After:
  {isFootingReoSection && onScopeDataChange && footings.length > 0 && (
    <FootingSectionReinforcementInput ... />
  )}
```

The new component will:
- Accept `sections: LinearSection[]` as input
- Use the same props pattern as `BeamReinforcementInput`
- Output grouped sections with shared reinforcement to all segments in each group

### 3. Verify/Update `reinforcement-footing` Module
**Location**: `src/lib/estimate-components/modules/reinforcement-footing.ts`

The calculation module already supports the array-based configuration pattern with:
- TM per section with layers
- Horizontal bars array (`horizontal_bars`)
- Vertical bars array (`vertical_bars`)
- Ligatures per section
- Chairs per section

No changes needed to the calculation logic - it already reads from `LinearSection` properties that match the beam pattern.

---

## Implementation Steps

1. **Copy and adapt `BeamReinforcementInput.tsx`** to create `FootingSectionReinforcementInput.tsx`:
   - Change type from `BeamConfig` to `LinearSection`
   - Update grouping logic to use `dimension1` (width) and `dimension2` (depth) instead of `width`/`depth`
   - Update type name parsing for footing names (SF1, RWF1, etc.)
   - Keep all reinforcement UI sections: TM, ligatures, horizontal bars, vertical bars, chairs

2. **Update `ModuleSection.tsx`**:
   - Import the new `FootingSectionReinforcementInput` component
   - Replace the `LinearSectionReinforcementInput` call in the footing section with the new component
   - Pass the same props pattern used for `BeamReinforcementInput`

3. **Optional cleanup**:
   - The old `LinearSectionReinforcementInput` can remain for any legacy scopes that may use it
   - Or it can be removed if no longer referenced

---

## UI/UX Improvements

After this change, users will see:

| Before | After |
|--------|-------|
| Individual section cards for each footing | Grouped cards by footing type (SF1, SF2) |
| Separate settings per section | Shared settings across all sections of same type |
| No segment count summary | Clear segment count and total length per group |
| Manual entry for each section | Changes propagate to all segments in group |

---

## Risk Assessment

**Low Risk**: 
- The data structure (`LinearSection`) already supports all the required reinforcement fields
- The calculation module (`reinforcement-footing`) already reads from these fields correctly
- This is primarily a UI-only change

**Testing Checklist**:
- Create estimate with Strip Footings scope
- Mark multiple footing sections of same type (e.g., SF1-1, SF1-2, SF1-3)
- Verify sections group correctly in reinforcement UI
- Change TM type on one group and verify all segments update
- Add horizontal bars and verify calculation includes them
- Verify cost breakdown shows correct quantities
