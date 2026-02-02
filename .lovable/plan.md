# Waffle Pod Calculation Fixes - COMPLETED ✓

## Summary

Fixed two calculation issues in the Waffle Pod estimator:

1. **Internal Rib Reinforcement Formula** ✓
   - Changed from `pods × 2.4` to `(pods × 2.4) - (perimeter / 2)`
   - Updated in `reinforcement-raft.ts` for both multi-zone and legacy calculations
   - Updated UI display in `WafflePodRibsInput.tsx`

2. **Concrete Volume Formula** ✓
   - Changed from geometric subtraction to simplified empirical formula
   - Now uses: `pods × 0.2519 × pod_depth`
   - Updated in `scopes.ts` and `ModularCalculator.tsx`

## Files Modified

| File | Change |
|------|--------|
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Updated rib length formula with perimeter deduction |
| `src/components/estimates/calculators/WafflePodRibsInput.tsx` | Updated UI summary to show corrected formula |
| `src/lib/estimate-components/scopes.ts` | Updated calculateVolume() to use pods × 0.2519 × depth |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Updated wafflePodBreakdown calculation |

## Formula Summary

| Calculation | Previous | Corrected |
|-------------|----------|-----------|
| Rib reo length per layer | `pods × 2.4` | `(pods × 2.4) - (perimeter ÷ 2)` |
| Pod rib concrete | `(area × depth) - (pods × pod_size³)` | `pods × 0.2519 × pod_depth` |
