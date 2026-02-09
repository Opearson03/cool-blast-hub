
# Fix: "No Edge Beams" on External Paths Should Complete Workflow

## The Problem

When marking an external paths (or crossovers) area and selecting "No Edge Beams", the workflow transitions to the internal beam marking step. But paths and crossovers don't support internal beams, so the user gets stuck being asked to measure beams that don't apply.

## The Fix (1 file)

### `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

In the `handleSkipEdgeBeams` function (~line 706-711), after saving the slab, the code always transitions to `mark_internal_beam`. The fix adds a check: if the active scope is one that doesn't support internal beams (`crossovers` or `paths_surrounds`), call `resetSlabWorkflow()` to complete the workflow immediately instead.

**Before:**
```typescript
// Go to internal beam marking
setShowSlabBeamDialog(false);
setSlabWorkflowStep('mark_internal_beam');
setPolylinePoints([]);
setActiveTool('polyline');
```

**After:**
```typescript
// For scopes without internal beams, complete the workflow
const noInternalBeamScopes = ['crossovers', 'paths_surrounds'];
if (noInternalBeamScopes.includes(activeScope)) {
  resetSlabWorkflow();
  return;
}

// Go to internal beam marking
setShowSlabBeamDialog(false);
setSlabWorkflowStep('mark_internal_beam');
setPolylinePoints([]);
setActiveTool('polyline');
```

Also add `resetSlabWorkflow` to the dependency array of the `useCallback`.
