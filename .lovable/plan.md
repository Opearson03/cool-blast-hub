
# Analysis: Quote Total Changes on "Revise" Click

## Problem Identified

When you click "Revise" on a finalized quote, the total amount changes because the system recalculates derived values that weren't previously persisted.

## Root Cause

The `ModularCalculator` component tracks manual user edits in a state variable called `userOverrides`. This prevents the system from overwriting values you've manually adjusted with auto-calculated defaults.

**The problem:** `userOverrides` is **not saved to the database**. When you reopen a quote:

1. The calculator mounts with `userOverrides = {}` (empty)
2. The auto-calculation logic (`deriveFrom`) runs on all visible fields
3. Since no fields are marked as "manually overridden", the system recalculates prices, quantities, or rates based on:
   - Current price list values (which may have changed)
   - Derived formulas (e.g., concrete volume from area × thickness)
4. Any values that differ from the saved values get overwritten
5. The total changes

## Technical Location

- **File:** `src/components/estimates/calculators/ModularCalculator.tsx`
- **Issue:** Line 132 initializes `userOverrides` as empty `{}`
- **Effect:** Lines 609-686 run the `deriveFrom` auto-calculation which overwrites saved values

## Proposed Solution

### Option A: Persist User Overrides (Recommended)

Save which fields were manually edited alongside the module answers so they can be restored when the quote is reopened.

**Changes required:**
1. **Extend the saved scope data structure** to include a `moduleUserOverrides` object
2. **Accept initial overrides as a prop** in `ModularCalculator`
3. **Save overrides** when the estimate is saved
4. **Restore overrides** when loading an existing estimate

**Files to modify:**
- `src/components/estimates/calculators/ModularCalculator.tsx` - Add `initialUserOverrides` prop
- `src/components/estimates/EstimateFormDialog.tsx` - Pass and persist the overrides

### Option B: Skip Derived Recalculation for Existing Data

Mark saved module answers as "user data" and skip `deriveFrom` calculations entirely when values already exist.

**Changes required:**
1. If a value already exists in `moduleAnswers`, treat it as a manual override
2. Only run `deriveFrom` for fields with no existing value

This is simpler but less precise - it prevents any auto-updates when reopening quotes.

---

## Recommendation

**Option A (Persist User Overrides)** is the cleaner solution because:
- It preserves the auto-calculation behavior for fields the user didn't touch
- It correctly handles price list updates for non-adjusted values
- It follows the existing architecture pattern for `doneModules` persistence

## Implementation Steps

1. Add `moduleUserOverrides` to the `ModularScopeState` interface
2. Add `initialUserOverrides` prop to `ModularCalculator`
3. Update `handleModularStateChange` to include overrides in the state
4. Update `buildScopeDataForSave` to save overrides
5. Update `migrateLegacyScopeData` to handle missing overrides gracefully
