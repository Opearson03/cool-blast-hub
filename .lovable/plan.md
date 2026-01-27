

## Update Paths & Surrounds and Crossovers to Match Driveway Scope

### ✅ COMPLETED

### Overview
Replaced the `PATHS_SURROUNDS_SCOPE` and `CROSSOVERS_SCOPE` definitions with copies of the Driveway scope configuration, providing:
1. ✅ Edge thickening support with multi-type markup
2. ✅ Same takeoff flow as driveway (area marking + edge thickening)
3. ✅ Unified `reinforcement-raft` module with scope-aware labeling
4. ✅ Driveway-specific modules (Connections & Joints, Plumbing, Control Joints)

### Files Modified

1. **`src/lib/estimate-components/scopes.ts`** ✅
   - Replaced `CROSSOVERS_SCOPE` with Driveway-style configuration
   - Replaced `PATHS_SURROUNDS_SCOPE` with Driveway-style configuration
   - Both now use `supportsMultipleEdgeBeams: true` and `edgeBeamsLabel: 'Edge Thickening'`
   - Both use `reinforcement-raft` module

2. **`src/types/takeoff.ts`** ✅
   - Added `'crossovers'` and `'paths_surrounds'` to `SLAB_WITH_BEAMS_SCOPES` array

3. **`src/lib/estimate-components/modules/reinforcement-raft.ts`** ✅
   - Updated `getScopeLabel` and `getScopeSectionLabel` to include `crossovers` and `paths_surrounds`
   - Updated `showIf` for internal beams to hide for all three scopes

4. **`src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx`** ✅
   - Updated `isDriveway` check to include `crossovers` and `paths_surrounds` using `edgeThickeningScopes` array

### Testing Checklist

- [x] Crossovers shows "Edge Thickening" option in estimator
- [x] Crossovers takeoff triggers slab + beam workflow
- [x] Crossovers uses "Edge Thickening" labels (not "Edge Beams")
- [x] Crossovers "Add Area" shows markup prompt dialog
- [x] Paths & Surrounds shows "Edge Thickening" option
- [x] Paths & Surrounds takeoff triggers slab + beam workflow
- [x] Paths & Surrounds uses "Edge Thickening" labels
- [x] Paths & Surrounds "Add Area" shows markup prompt dialog
- [x] Reinforcement module shows "Edge Thickening" section for all three scopes
- [x] Internal beams section hidden for all three scopes
- [x] Volume calculations include edge thickening for all three scopes
