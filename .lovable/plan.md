

# Fix: Number Inputs That Reject Zero Values

## The Problem

Across the estimating wizard, many numeric input fields use the JavaScript `||` (OR) operator to display values:

```typescript
value={area.length || ""}
```

Because `0` is "falsy" in JavaScript, `0 || ""` evaluates to `""` (empty string). This means whenever a user types `0`, it immediately vanishes from the input. It also makes it difficult to type numbers that require passing through `0` as an intermediate step (like clearing a field to retype a value).

The project already has the correct pattern established in several components -- using `??` (nullish coalescing) instead of `||`:

```typescript
value={area.length ?? ""}  // 0 displays as "0", only null/undefined becomes ""
```

## The Fix

A simple, mechanical find-and-replace of `||` to `??` in the `value={}` binding of every affected numeric input. Text/string inputs using `|| ''` (like name fields) are fine and should be left alone.

## Affected Files (8 files, ~35 numeric inputs total)

### 1. MultiDemolitionInput.tsx (~17 numeric inputs)
All dimension and rate inputs: `area.length`, `area.width`, `area.thickness`, `tipRate`, `excavatorRate`, `excavatorHours`, `excavatorFloat`, `excavatorM3Rate`, `rockBreakerCost`, `sawCuttingLength`, `sawCuttingRate`, `sawCuttingHours`, `sawCuttingHourlyRate`, `sawCuttingEstablishment`, `demoCrewSize`, `demoHours`, `demoLabourRate`

Change pattern: `value={someVar || ""}` to `value={someVar ?? ""}`

### 2. MultiBeamInput.tsx (3 numeric inputs)
`beam.length`, `beam.width`, `beam.depth`

### 3. MultiPadFootingGroupInput.tsx (4 numeric inputs)
`group.quantity`, `group.length`, `group.width`, `group.depth`

### 4. MultiLinearTypeInput.tsx (3 numeric inputs)
`group.dimension1`, `group.dimension2`, `segmentLength`

### 5. MultiAreaInput.tsx (3 numeric inputs)
`thickness`, `thickeningDepth`, `thickeningWidth`

### 6. MultiPierInput.tsx (3 numeric inputs)
`pier.quantity`, `pier.diameter`, `pier.depth`

### 7. MultiExpansionJointInput.tsx (1 numeric input)
`joint.total_length_m`

### 8. MultiControlJointInput.tsx (1 numeric input)
`joint.total_length_m`

## Files Already Correct (no changes needed)

These files already use `??` or other correct patterns:
- `ModuleSection.tsx` (QuestionInput) -- uses `value={value ?? ''}`
- `MultiFootingInput.tsx` -- uses `value={footing.length ?? ""}`
- `MultiPierGroupInput.tsx` -- uses `value={group.quantity ?? ""}`
- `MultiBeamTypeInput.tsx` -- uses `EditableTotalLength` component
- `MultiLinearInput.tsx` -- correct
- `WafflePodConfigCard.tsx`, `WafflePodConfigInput.tsx`, `WafflePodRibsInput.tsx`, `WafflePodToppingMeshInput.tsx` -- correct
- All reinforcement inputs (`AreaReinforcementInput`, `BeamReinforcementInput`, `FootingSectionReinforcementInput`, etc.) -- correct

## What This Doesn't Change

- The `onChange` handlers are fine as-is -- they correctly use `e.target.value === "" ? 0 : Number(e.target.value)` to distinguish an empty field from a `0` entry
- No calculation logic changes
- No database or schema changes
- Text/string name fields keep using `||` (strings aren't affected by this bug)

## Risk Assessment

Very low risk. This is a one-character change (`||` to `??`) repeated across input value bindings. The behavior difference is only for the value `0`, which goes from invisible to visible -- exactly what users expect.

