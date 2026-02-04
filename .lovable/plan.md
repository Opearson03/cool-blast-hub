
# Plan: Add Editable Lap % to All Waffle Pod Reinforcement Sections

## Goal
Make lap percentage editable for each reinforcement section in waffle pod slabs to ensure consistency across Ribs, Topping Mesh, and Beams.

## Current State vs. Proposed

| Section | Current | Proposed |
|---------|---------|----------|
| Topping Slab Mesh | Has editable `topping_mesh_lap_percent` (12.5% default) | No change - already correct |
| Rib Reinforcement | Hardcoded `1.125` (12.5%) | Add `rib_lap_percent` field (12.5% default) |
| Edge Beams | Hardcoded `1.125` (12.5%) | Add `beam_lap_percent` per beam group |
| Internal Beams | Hardcoded `1.125` (12.5%) | Uses same beam lap from edge beams |

## Implementation Changes

### 1. Add Lap % Input to WafflePodRibsInput
**File:** `src/components/estimates/calculators/WafflePodRibsInput.tsx`

- Add a new input field for `rib_lap_percent` (default 12.5%)
- Place it in the "Stock Length" section or as a separate row
- Update the summary calculation to use the editable value

```text
┌─────────────────────────────────────────────┐
│ Rib Reinforcement                           │
├─────────────────────────────────────────────┤
│ Bottom Bars                                 │
│ [Quantity: 2 ▼] [Bar Size: N12 ▼]          │
├─────────────────────────────────────────────┤
│ Top Bars                                    │
│ [Quantity: 1 ▼] [Bar Size: N12 ▼]          │
├─────────────────────────────────────────────┤
│ Stock Length        Lap %                   │
│ (○) 6m  (○) 12m    [12.5____] %            │  ← NEW FIELD
└─────────────────────────────────────────────┘
```

### 2. Update Rib Calculation Logic
**File:** `src/lib/estimate-components/modules/reinforcement-raft.ts`

- Read `rib_lap_percent` from scopeData instead of using hardcoded `LAP_ALLOWANCE`
- Apply the editable lap percentage to rib bar length calculations
- Default to 12.5% if not set

### 3. Add Lap % to Beam Reinforcement (Optional Enhancement)
**File:** `src/components/estimates/calculators/BeamReinforcementInput.tsx`

This is a larger change that would affect all beam types. If desired, we can:
- Add a `lap_percent` field per beam group
- Update the beam calculation logic in `reinforcement-raft.ts`

**Recommendation:** Start with just the Rib Lap % for now, as the Topping Mesh already has it. Beam lap % can be added in a follow-up if needed.

## Files to Change

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/WafflePodRibsInput.tsx` | Add `rib_lap_percent` input field with 12.5% default |
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Read `rib_lap_percent` from scopeData; use in rib bar length calculation |

## Technical Details

### WafflePodRibsInput.tsx Changes
```typescript
// Add to extracted values
const ribLapPercent = numericWithDefault(scopeData?.rib_lap_percent, 12.5);

// Update handleChange to include lap percent
// Add new Input field in the "Stock Length Row" section
```

### reinforcement-raft.ts Changes
```typescript
// In waffle pod rib calculation (lines ~390 and ~465):
// Replace:
const bottomTotalLength = ribLengthPerLayerM * bottomBarsPerRib * LAP_ALLOWANCE;

// With:
const ribLapMultiplier = 1 + (Number(scopeData?.rib_lap_percent) || 12.5) / 100;
const bottomTotalLength = ribLengthPerLayerM * bottomBarsPerRib * ribLapMultiplier;
```

## Expected Result

1. **Ribs Section** will have an editable "Lap %" input (matching Topping Mesh)
2. The lap percentage will be applied to rib bar length calculations
3. Consistency across all waffle pod reinforcement sections
4. Default behavior unchanged (12.5% lap if not edited)
