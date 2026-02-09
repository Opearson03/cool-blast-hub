

# Fix Takeoff Scope Completion Count Bug

## The Problem

When you mark a driveway area on the plans, the takeoff step incorrectly thinks all scopes are complete and auto-advances. This happens because the completion count uses `markups.length` (total number of markups) instead of counting **unique scopes that have at least one markup**.

For example, if you have 2 selected scopes (e.g., driveway + paths & surrounds), marking a driveway area produces 1 area markup plus potentially 1 edge thickening markup = 2 total markups. The code sees `2 markups + 0 skipped = 2 = selectedScopes.length`, so it thinks all scopes are done.

## The Fix (1 file)

### `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Change the `completedCount` calculation from counting total markups to counting unique scopes that have at least one markup:

**Before:**
```
const completedCount = markups.length + skippedScopes.size;
```

**After:**
```
const scopesWithMarkups = new Set(markups.map(m => m.scope_id));
const completedCount = scopesWithMarkups.size + skippedScopes.size;
```

This ensures each scope only counts once toward completion, regardless of how many markups (areas, beams, thickenings) it has.

