

# Fix: Retaining Wall Toe Not Flowing to Modules

## Investigation Findings

After tracing the complete data flow, I found **two distinct issues** causing the toe volume to not reach the concrete supply, excavation, and pump modules.

### Issue 1: `RETAINING_WALLS_SCOPE` is Not Registered

The `RETAINING_WALLS_SCOPE` (full wall construction) is defined in `scopes.ts` (line 2226) but **never added to `SCOPE_REGISTRY`** (lines 2594-2606). This means:
- Users cannot select it in the estimate wizard
- All the previous toe fixes targeting `retaining_walls` scope are unreachable
- Users can only use `retaining_wall_footings` (standalone footings scope)

The previous fix added toe logic for `scopeData.scopeId === 'retaining_walls'` in the excavation module, but since that scope is never available, those code paths never execute.

### Issue 2: ModularCalculator Retaining Wall Excavation Uses Wrong Field

In `ModularCalculator.tsx` line 416, the retaining wall excavation derivation checks:
```
scopeAnswers.wall_length
```
But the retaining walls scope uses `total_length`, not `wall_length`. This condition never evaluates to true, so the retaining wall excavation block is always skipped in `derivedScopeAnswers`.

### What Actually Works (retaining_wall_footings)

For the `retaining_wall_footings` scope that users CAN access:
- Per-section toe (`has_toe`, `toe_width`, `toe_depth`) IS correctly included in `calculateVolume` (line 1608-1611)
- `scopeData.concrete_volume = scopeVolume` includes toe
- The `derivedScopeAnswers` footings block (line 335-368) correctly includes per-section toe in `excavation_volume`

If toe is not flowing through for `retaining_wall_footings`, the issue would be in how the VolumeBreakdown displays the total vs how `calculateVolume` actually computes. But the logic is consistent.

## The Fix (3 changes)

### 1. Register `RETAINING_WALLS_SCOPE` in `SCOPE_REGISTRY`

**File:** `src/lib/estimate-components/scopes.ts` (line 2606)

Add the missing scope so users can actually select it:
```typescript
export const SCOPE_REGISTRY: Record<string, ScopeDefinition> = {
  // ... existing scopes ...
  pad_footings: PAD_FOOTINGS_SCOPE,
  retaining_walls: RETAINING_WALLS_SCOPE,  // ADD THIS
};
```

Also need to add it to the scope selection UI categories (wherever scopes are grouped into "Foundations", "Floor Slabs", etc.).

### 2. Fix `wall_length` to `total_length` in ModularCalculator

**File:** `src/components/estimates/calculators/ModularCalculator.tsx` (line 416)

Change:
```typescript
else if (scopeAnswers.wall_length && scopeAnswers.footing_width && scopeAnswers.footing_depth) {
    const lengthM = Number(scopeAnswers.wall_length) || 0;
```
To:
```typescript
else if (scopeAnswers.total_length && scopeAnswers.footing_width && scopeAnswers.footing_depth && scopeAnswers.include_footing) {
    const lengthM = Number(scopeAnswers.total_length) || 0;
    const footingWidthM = (Number(scopeAnswers.footing_width) || 0) / 1000;
    const toeLengthM = (Number(scopeAnswers.toe_length) || 0) / 1000;
    const totalExcWidthM = footingWidthM + toeLengthM;
```

This also adds the toe width to the excavation trench width, since the trench must be wide enough for footing + toe.

### 3. Add `retaining_walls` to scope category mapping

**File:** `src/components/estimates/EstimateFormDialog.tsx` (or wherever scope categories are defined)

Add `retaining_walls` to the "Foundations" category so it appears in the scope selection UI alongside `retaining_wall_footings`.

## Summary

| File | Change |
|------|--------|
| `src/lib/estimate-components/scopes.ts` | Add `retaining_walls: RETAINING_WALLS_SCOPE` to `SCOPE_REGISTRY` |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Fix `wall_length` to `total_length` and include toe in excavation width (line 416-424) |
| Scope category UI file | Add `retaining_walls` to "Foundations" category |

## Risk Assessment

Low risk. Registering the scope makes it available but doesn't affect existing estimates. Fixing the field name in ModularCalculator only affects the `retaining_walls` scope which has no existing data. The `retaining_wall_footings` scope (existing estimates) is unaffected.

