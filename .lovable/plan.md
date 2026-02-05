
## Goal
Make joint marking (expansion joints + control joints/saw cuts) behave like the internal-beam "2 clicks = 1 line, 3rd click starts a new line" workflow, and ensure:
1) The takeoff toolbar shows the *joint* instructions (not "footing path").
2) Clicking **Done** reliably saves the joint measurement and returns the user back to the exact joint module they came from.

---

## Status: ✅ IMPLEMENTED

All fixes have been implemented:

### 1) Joint toolbar mode exclusivity ✅
- `isPolylineMode` now explicitly excludes joint scopes: `isPolylineMode={activeTool === 'polyline' && isLinearScope && !isSlabBeamMarking && !isJointScope}`
- This ensures the toolbar shows the joint UI (with Scissors icon and "Tap to mark [jointLabel] lines") instead of the generic polyline/footing UI.

### 2) Dedicated `handleDoneMarkingJoints` handler ✅
- Created a new handler that:
  - Finalizes any pending 2-point segment
  - Calculates total length from all discrete segments
  - Saves the markup via `addPolylineMarkup` with widthMm=0, heightMm=0 (joints don't need dimensions)
  - Calls `onJointMarkupComplete` to update module answers and navigate back
  - Resets all joint-related state
- Wired to toolbar's `onDoneMarkingJoints` prop

### 3) Clear slab state when entering joint mode ✅
- In `handleMarkArea`, when activating a joint scope, aggressively clears:
  - `slabWorkflowActive = false`
  - `slabWorkflowStep = 'name'`
  - `addingBeamToSlabId = null`
  - `addingBeamType = null`
  - `discreteJointSegments = []`
- This prevents joints from being misrouted as beams

### 4) Auto-open module on return ✅
- Added `forceOpenModuleId` state to `EstimateFormDialog`
- Added `forceOpenModuleId` prop to `ModularCalculator` with useEffect to open the module
- In `handleJointMarkupComplete`, sets `forceOpenModuleId` based on joint type:
  - expansion_joints → 'connections-joints'
  - control_joints → 'joints-control'
- Clears after 500ms to prevent persistence

### 5) Fixed segment counting ✅
- Updated toolbar props to include pending segment in count and length:
  - `jointSegmentCount={discreteJointSegments.length + (polylinePoints.length === 2 ? 1 : 0)}`
  - `jointTotalLength` includes the current pending segment if 2 points are placed
- This ensures "Done" button works even immediately after placing the second point

---

## Files Changed
1. `src/components/estimates/takeoff/PlanTakeoffStep.tsx`
   - Added slab state cleanup in `handleMarkArea` for joint scopes
   - Created `handleDoneMarkingJoints` handler
   - Fixed `isPolylineMode` to exclude joints
   - Updated toolbar props for accurate segment counting

2. `src/components/estimates/calculators/ModularCalculator.tsx`
   - Added `forceOpenModuleId` prop
   - Added useEffect to open module when prop changes

3. `src/components/estimates/EstimateFormDialog.tsx`
   - Added `forceOpenModuleId` state
   - Updated `handleJointMarkupComplete` to set the return module
   - Passed prop to ModularCalculator

---

## Test Plan (for verification)
1. Open an estimate → go to Configure scopes.
2. In a scope that has **Expansion Joints**:
   - open the "Connections & Joints" module
   - click **Mark on Plans** on a specific expansion joint row
3. In Takeoff:
   - verify toolbar text says "Tap to mark expansion joint lines" (not footing path)
   - click 2 points → a line forms; click a 3rd point → it starts a new line segment
   - after at least 1 segment, press **Done**
   - confirm it immediately returns you to the same module (Connections & Joints), with:
     - the joint length populated
     - "Measured" badge set
4. Repeat for **Control Joints / Saw Cuts**:
   - ensure it returns to the "Control Joints / Saw Cuts" module and updates that joint config
5. Regression: Mark a driveway slab + beams, then jump to joint marking:
   - verify joint marking does not save any markup as `edge_beam` / does not open beam dialogs.
