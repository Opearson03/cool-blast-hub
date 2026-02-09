
# Fix: Add `driveway` to No-Internal-Beams List

## The Problem

The previous fix added `crossovers` and `paths_surrounds` to the `noInternalBeamScopes` list, but missed `driveway`. When clicking "No Edge Beams" for driveways or crossovers, the workflow still transitions to internal beam marking (the 2-point measurer) instead of completing immediately.

Only actual slab types (`raft_slab`, `waffle_pod`, `standard_slab`, `suspended_slab`) should proceed to internal beam marking. External/hardscape scopes like `driveway`, `crossovers`, and `paths_surrounds` should complete the workflow when edge beams are skipped.

## The Fix (1 file)

### `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Update the `noInternalBeamScopes` array in `handleSkipEdgeBeams` (~line 708) to also include `driveway`:

**Before:**
```typescript
const noInternalBeamScopes = ['crossovers', 'paths_surrounds'];
```

**After:**
```typescript
const noInternalBeamScopes = ['crossovers', 'paths_surrounds', 'driveway'];
```

This ensures all three external/hardscape area scopes skip internal beam marking when "No Edge Beams" is selected.
