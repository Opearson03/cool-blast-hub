
# Estimate Calculator Audit -- Issues Found and Fix Plan

After a thorough review of the calculator's modules, takeoff data merge logic, reinforcement calculations, volume breakdowns, and chair counting, here are the issues I've identified, grouped by severity.

---

## Issue 1: Mesh Lap Allowance Mismatch (reinforcement-slab)

**Severity:** Medium -- causes over-quoting on every flatwork slab estimate

**Problem:** In `reinforcement-slab.ts`, the mesh lap allowance defaults to 12.5% in the question definition (line 81), but the `calculate` function on line 899 uses `|| 15` as a fallback:
```
const lapAllowance = 1 + (Number(answers.mesh_lap_allowance) || 15) / 100;
```
If the deriveFrom mechanism hasn't populated the answer yet, or the user enters `0`, the fallback of 15% kicks in instead of the 12.5% shown in the UI. This silently adds 2.5% more mesh than expected.

**Fix:** Change the fallback from `15` to `12.5` to match the question's `defaultValue`:
```
const lapAllowance = 1 + (Number(answers.mesh_lap_allowance) || 12.5) / 100;
```

**File:** `src/lib/estimate-components/modules/reinforcement-slab.ts` line 899

---

## Issue 2: Pad Footing Chairs Not Rounded to Bags (reinforcement-pad)

**Severity:** Low-Medium -- chair pricing is slightly off

**Problem:** In `reinforcement-pad.ts`, line 262, chairs are priced as individual units rather than rounding up to whole bags of 100:
```typescript
const chairCost = (totalChairs / 100) * chairPricePer100;
```
This gives fractional bag pricing (e.g., 37 chairs = 0.37 bags at $45 = $16.65). Every other module rounds up to whole bags first using `Math.ceil(totalChairs / 100)`, which is correct since you can't buy partial bags.

**Fix:**
```typescript
const bags = Math.ceil(totalChairs / 100);
const chairCost = bags * chairPricePer100;
```
Update the description to match: `${bags} bags of 100` instead of `${totalChairs} chairs`.

**File:** `src/lib/estimate-components/modules/reinforcement-pad.ts` lines 261-273

---

## Issue 3: Footing Chair Aggregation Uses Last Section's Type Only (reinforcement-footing)

**Severity:** Low-Medium -- wrong chair type on multi-footing estimates

**Problem:** In `reinforcement-footing.ts`, when iterating over sections to count chairs (lines 180-201), the `chairType` and `chairPrice` variables are declared outside the loop and overwritten by each section. If sections use different chair types, only the last section's type is used for the line item label, but the count includes chairs from all sections.

The code at line 177 starts with `let chairType = '5065C'` and each iteration overwrites it:
```typescript
chairType = section.chair_type || '5065C';
```

But the final line item at line 209 uses this single `chairType` for bag sizing and label, even though some sections may have used `TMCHAIR` (bag of 25) while others used standard bar chairs (bag of 100).

**Fix:** Use the same grouping-by-chair-type pattern already implemented in `reinforcement-raft.ts` (lines 618-679). Group chairs into a `Record<string, {count, price, bagSize}>` during the loop, then generate one line item per chair type.

**File:** `src/lib/estimate-components/modules/reinforcement-footing.ts` lines 172-236

---

## Issue 4: Waffle Pod Top Slab Thickness Not Preserved on Revision (takeoff merge)

**Severity:** Low -- defaults reset to 85mm when reopening

**Problem:** In `EstimateFormDialog.tsx` line 1693, when merging waffle pod takeoff data, `top_slab_thickness` is always hard-coded to `85`:
```typescript
top_slab_thickness: 85,
```
If the user previously changed this to, say, 100mm, reopening the estimate for revision resets it because the merge runs whenever `needsTakeoffMerge` is true (which can trigger on area recalculation).

**Fix:** Respect the existing saved value if available:
```typescript
top_slab_thickness: initialScopeAnswers.top_slab_thickness ?? 85,
```
Apply the same pattern to `pod_size` and `pod_thickness`.

**File:** `src/components/estimates/EstimateFormDialog.tsx` lines 1690-1693

---

## Issue 5: VolumeBreakdown Missing Kerbs/Channels and Bollards Scopes

**Severity:** Low -- no "How it's calculated" appears for these scope types

**Problem:** The `computeVolumeBreakdown` function in `VolumeBreakdown.tsx` handles `piers`, `strip_footings`, `retaining_wall_footings`, `pad_footings`, `raft_slab`, `standard_slab`, `waffle_pod`, `driveway`, `crossovers`, `paths_surrounds`, `suspended_slab`, `retaining_walls`, and `architectural_concrete` -- but it does **not** handle:
- `kerbs_channels` (linear scope with concrete volume)
- `bollards` (point scope with concrete volume)

For these scopes, the function returns an empty array and the "How it's calculated" button never appears.

**Fix:** Add `buildBollardsBreakdown` and `buildKerbsBreakdown` helper functions following the same pattern as piers and footings respectively.

**File:** `src/components/estimates/calculators/shared/VolumeBreakdown.tsx`

---

## Issue 6: Strip Footing Volume Breakdown Uses Wrong Length Source

**Severity:** Low -- display-only, doesn't affect calculations

**Problem:** The `buildFootingsBreakdown` function at line 351 uses `Number(f.length)` directly, but the actual calculation in `scopes.ts` and `derivedScopeAnswers` prefers `f._actualLength` from takeoff when available:
```typescript
const length = Number(f.length) || 0;  // Misses _actualLength
```
This means the breakdown shows slightly different (less accurate) dimensions than the actual volume being used.

**Fix:** Use `f._actualLength || Number(f.length) || 0` to match the calculation logic.

**File:** `src/components/estimates/calculators/shared/VolumeBreakdown.tsx` line 351, and similarly for the retaining wall footings builder (line 386).

---

## Issue 7: Concrete Supply Pier Volume Fallback Overwrites Scope Volume

**Severity:** Low -- redundant calculation, usually produces same result

**Problem:** In `concrete-supply.ts` lines 118-124, the module has a special fallback for pier volume:
```typescript
if (scopeData.num_piers && scopeData.diameter && scopeData.depth) {
  volume = numPiers * Math.PI * radius * radius * depth;
}
```
This recalculates the volume from averaged diameter/depth values, overriding the more accurate `scope.calculateVolume()` result that already accounts for multiple pier groups with different dimensions. The scope's `calculateVolume` is already used via `scopeData.concrete_volume`, making this fallback both unnecessary and less accurate for mixed-dimension pier estimates.

**Fix:** Remove the pier-specific fallback block (lines 118-124). The `scopeData.concrete_volume` already contains the correct per-group calculation from `PIERS_SCOPE.calculateVolume()`.

**File:** `src/lib/estimate-components/modules/concrete-supply.ts` lines 117-124

---

## Summary Table

| # | Issue | Severity | File | Impact |
|---|-------|----------|------|--------|
| 1 | Mesh lap default mismatch (15 vs 12.5) | Medium | reinforcement-slab.ts | Over-quoting mesh on all flatwork |
| 2 | Pad footing chairs not rounded to bags | Low-Med | reinforcement-pad.ts | Under-quoting chairs |
| 3 | Footing chair type aggregation bug | Low-Med | reinforcement-footing.ts | Wrong bag size, wrong label |
| 4 | Waffle pod thickness reset on revision | Low | EstimateFormDialog.tsx | Loses custom thickness |
| 5 | Missing volume breakdown for kerbs/bollards | Low | VolumeBreakdown.tsx | No breakdown shown |
| 6 | Footing breakdown ignores _actualLength | Low | VolumeBreakdown.tsx | Display mismatch |
| 7 | Pier volume double-calculated in concrete-supply | Low | concrete-supply.ts | Less accurate with mixed piers |

## Implementation Notes

- Issues 1-3 are calculation-correctness bugs that should be fixed first
- Issues 4-7 are display/consistency issues that can follow
- None of these changes affect the database schema or stored data
- All fixes are isolated to their respective modules with no cross-module dependencies
- Existing saved quotes will see updated pricing only when explicitly revised (user override persistence prevents auto-recalculation)
