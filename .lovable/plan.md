

# Fix: Auto Inclusions & Exclusions Mapping Issues

## Issues Found

### Issue 1: `exc_excavation` shows under scopes that INCLUDE excavation (Critical)

The "Excavation and site preparation" exclusion has `relevantModules: ["base-preparation", "formwork"]`. The intent (per the code comment on line 207) is to show this only when excavation is NOT in scope. But the current logic is: "show if ANY of the listed modules are active in this scope."

Since most scopes have BOTH excavation AND formwork/base-preparation, this exclusion gets auto-selected everywhere -- telling the client "excavation is excluded" when it is actually included in the quote. Affected scopes:

- **Piers** (has formwork + excavation) -- WRONG
- **Standard Slab** (has base-preparation + formwork + excavation) -- WRONG
- **Raft Slab** (has formwork + excavation) -- WRONG
- **Waffle Pod** (has formwork + excavation) -- WRONG
- **Driveway** (has base-preparation + formwork + excavation) -- WRONG
- **Crossovers** (has base-preparation + formwork + excavation) -- WRONG
- **Paths & Surrounds** (has base-preparation + formwork + excavation) -- WRONG
- **Strip Footings** (has formwork + excavation) -- WRONG
- **Retaining Wall Footings** (has formwork + excavation) -- WRONG
- **Pad Footings** (has formwork + excavation) -- WRONG

In practice, this exclusion currently shows under EVERY scope that has it, which is always wrong because all of those scopes also include excavation.

### Issue 2: Missing `excludeWhenModulesActive` implementation

The architecture memory document references an `excludeWhenModulesActive` property that should hide items when certain modules are active. This property was never implemented:
- The `InclusionExclusionItem` interface only has `relevantModules`
- The filtering code in the Conditions step and auto-select logic only checks `relevantModules`
- No code checks for an inverse/exclusion condition

### Issue 3: `exc_saw_cutting` shows under scopes where control joints ARE included

The "Saw cutting control joints" exclusion has `relevantModules: ["joints-control", "surface-finishing"]`. This means it appears under scopes like Driveway, Standard Slab, and Paths & Surrounds which include `joints-control` and `control_joints` as an INCLUSION. This is contradictory -- you cannot both include "Control joint cutting" and exclude "Saw cutting control joints" for the same scope.

The fix is to hide this exclusion when the `joints-control` module is active (meaning cutting is already included in the quote).

### Issue 4: `exc_subgrade` shows alongside `base_prep` inclusion

"Subgrade preparation and compaction" exclusion has `relevantModules: ["base-preparation"]`. "Base preparation and compaction" inclusion also has `relevantModules: ["base-preparation"]`. Both auto-select under the same scopes, which is contradictory.

---

## Solution

Add an `excludeWhenModulesActive` property to the `InclusionExclusionItem` interface and implement the filtering logic. This is the cleanest fix with minimal code change.

### Changes

**File: `src/components/estimates/EstimateFormDialog.tsx`**

1. **Update the interface** (line 166-170):
   Add `excludeWhenModulesActive?: string[]` to `InclusionExclusionItem`.

2. **Fix `exc_excavation`** (line 207):
   Change `relevantModules` to target scopes that COULD need excavation, and add `excludeWhenModulesActive: ["excavation"]`. This way, the exclusion only appears under scopes that have formwork/base-preparation but do NOT have the excavation module. Since currently all scopes with formwork also have excavation, we can simplify: set `relevantModules` broadly but `excludeWhenModulesActive: ["excavation"]` to hide it from scopes where excavation is already priced.

3. **Fix `exc_saw_cutting`** (line 214):
   Add `excludeWhenModulesActive: ["joints-control"]` so it only shows when control joint cutting is NOT already included.

4. **Fix `exc_subgrade`** (line 220):
   Add `excludeWhenModulesActive: ["base-preparation"]` OR remove it, since if base-preparation is active, it's included (not excluded). Actually the better fix: keep it but DON'T auto-select it. The current problem is it auto-selects under the same scopes that also auto-select the `base_prep` inclusion.

5. **Update filtering logic in three places:**

   a. **Initial auto-select** (lines 837-851): When checking if an item should appear under a scope, also verify that none of the scope's modules match `excludeWhenModulesActive`.

   b. **Conditions step UI -- inclusions filter** (line 2526-2528): Add the exclusion check when filtering `DEFAULT_INCLUSIONS` for each scope.

   c. **Conditions step UI -- exclusions filter** (line 2615-2617): Add the exclusion check when filtering `DEFAULT_EXCLUSIONS` for each scope.

### Updated Items

| Item ID | Current `relevantModules` | Add `excludeWhenModulesActive` | Effect |
|---------|--------------------------|-------------------------------|--------|
| `exc_excavation` | `["base-preparation", "formwork"]` | `["excavation"]` | Hidden from all scopes that price excavation (currently all of them). Only shows if a scope has formwork/base-prep but no excavation module. |
| `exc_saw_cutting` | `["joints-control", "surface-finishing"]` | `["joints-control"]` | Hidden from scopes that include control joint cutting (Driveway, Standard Slab, Paths). Still shows under scopes with only surface-finishing (Raft Slab). |
| `exc_subgrade` | `["base-preparation"]` | `["base-preparation"]` | Since this would always be hidden (same module), convert to a non-auto-selected item or remove the contradiction differently -- see below. |

For `exc_subgrade`, the better approach: change its `relevantModules` to `["excavation"]` (show it under scopes with excavation but without base-prep, like Piers/Strip Footings) and add `excludeWhenModulesActive: ["base-preparation"]`. This way it shows "Subgrade preparation excluded" only when base-prep is not being priced.

### Filter Logic (Applied in 3 Places)

```text
For each item:
  1. If no relevantModules: it's global (show under _general)
  2. If relevantModules overlap with scope's moduleIds: potentially show
  3. BUT if excludeWhenModulesActive overlaps with scope's moduleIds: HIDE it
```

### Dynamic Auto-Sync Update (lines 760-811)

The existing auto-sync for `exc_excavation` (remove when excavation answers are filled) becomes unnecessary once the filtering handles it. We can simplify by removing the excavation-specific sync code, since the item won't appear under scopes with excavation in the first place.

---

## Files to Modify

| File | What Changes |
|------|-------------|
| `src/components/estimates/EstimateFormDialog.tsx` | Add `excludeWhenModulesActive` to interface; update 4 exclusion items; update filtering in auto-select, inclusions UI, and exclusions UI (3 filter locations) |

No other files need to change -- the PDF rendering and data storage work with whatever items are selected, so they're unaffected.

