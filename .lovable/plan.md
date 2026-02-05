
## Goal
Make joint marking (expansion joints + control joints/saw cuts) behave like the internal-beam “2 clicks = 1 line, 3rd click starts a new line” workflow, and ensure:
1) The takeoff toolbar shows the *joint* instructions (not “footing path”).
2) Clicking **Done** reliably saves the joint measurement and returns the user back to the exact joint module they came from.

---

## What’s currently going wrong (based on the code)
### A) Wrong toolbar instructions (“Tap to start footing path”)
In `PlanTakeoffStep`, joint scopes are currently treated as *both*:
- `isJointMode` (good), and
- `isPolylineMode` (also true because `LINEAR_SCOPES` includes `expansion_joints` and `control_joints`)

`TakeoffToolbar` *should* render the joint UI first, but in practice the user is still seeing the polyline UI (the “footing path” string comes from the polyline-mode branch). The safest fix is to ensure joint mode and polyline mode are mutually exclusive from the caller side so the toolbar cannot “fall through” to polyline UI even if joint flags glitch for any reason.

### B) Done button not returning to the module
Right now, the toolbar “Done” for joints is wired to `handleDoneMarkingPolyline()`, which only opens the joint confirm dialog/panel (or does nothing if it thinks 0 segments exist). The user expectation is: **Done = save + return to the module**.

There’s also a subtle race: discrete joint segments are created in a `useEffect` after `polylinePoints` becomes length 2. That means, at the exact moment the user finishes the second click, `discreteJointSegments.length` can still be 0 for a render; the Done button may remain disabled or the handler may not enter the “joint done” path.

### C) “It saves as an edge beam”
This can happen whenever the joint completion path accidentally routes into the slab beam workflow (e.g., if `slabWorkflowActive` is still true or the joint capture didn’t register and the code takes the slab path). Even though the code attempts to prioritize joints, the race described above can still cause the joint handler to miss the joint branch and fall into the wrong workflow.

---

## Implementation approach (high confidence fixes)
### 1) Make joint toolbar mode exclusive
**File:** `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

- Change the props passed to `TakeoffToolbar` so joint scopes never enable `isPolylineMode`.
  - `isPolylineMode={activeTool === 'polyline' && isLinearScope && !isSlabBeamMarking && !isJointScope}`
- Also make sure the `polylineLabel` doesn’t default to “footing” for joint scopes (defensive; once polyline mode is excluded, users shouldn’t see it anyway).

This guarantees the “Tap to start footing path” UI can’t show during joint marking.

---

### 2) Remove the race: capture discrete joint segments synchronously
**File:** `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Replace (or supplement) the current `useEffect` that watches `polylinePoints.length === 2` with a synchronous handler, by intercepting the polyline points change before state is committed:

- Create a function like `handlePolylinePointsChange(nextPoints: TakeoffPoint[])` and pass it to `DrawingCanvas` instead of passing `setPolylinePoints` directly.
- If `isJointScope` and `nextPoints.length === 2` and `currentScale` exists:
  - compute the segment length immediately
  - append to `discreteJointSegments`
  - immediately clear `polylinePoints` back to `[]` (so the next click starts a new segment)
- Otherwise:
  - set `polylinePoints = nextPoints` (normal behavior)

This makes segment counting instantaneous and makes the Done button enablement stable.

Also update the “canUndo / segment count / total length” calculations to use:
- `effectiveSegmentCount = discreteJointSegments.length + (polylinePoints.length === 2 ? 1 : 0)`
- `effectiveTotalLength = sum(discreteJointSegments) + (polylinePoints.length === 2 ? lastSegmentLength : 0)`
So “Done” works even if the user somehow ends with exactly 2 points pending.

---

### 3) Implement a dedicated joint “Done” handler that saves and returns immediately
**File:** `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Add a dedicated handler `handleDoneMarkingJoints()` (and wire it to `TakeoffToolbar.onDoneMarkingJoints`), which will:

1. Finalize any pending 2-point segment (if `polylinePoints.length === 2`).
2. If there are 0 complete segments, show a toast (or no-op) and keep the user in drawing mode.
3. Build `allPoints` from all discrete segments (flatten start/end pairs).
4. Call `addPolylineMarkup(...)` with:
   - `scopeId = activeScope` (should be `expansion_joints` or `control_joints`)
   - `widthMm=0, heightMm=0` (joints don’t need dims)
   - `markup_type` should remain default/primary (no beam types)
5. Call `onJointMarkupComplete(activeScope, totalLength)`
   - This is what triggers the parent (Estimate wizard) to navigate back to the configure step.
6. Reset local takeoff drawing state: `polylinePoints`, `discreteJointSegments`, `pendingPolylineLength`, `pendingJointType`, etc.

This removes the extra “confirm” step and matches your “Done should take me back to the module” expectation.

We’ll keep the `JointDimensionsDialog` code in place for now (in case other flows still use it), but joints will no longer rely on it.

---

### 4) Ensure joint marking can never “inherit” slab beam workflow state
**File:** `src/components/estimates/takeoff/PlanTakeoffStep.tsx`

Whenever we enter joint marking mode (i.e., in `handleMarkArea(scopeId)` when `scopeId` is `expansion_joints` or `control_joints`):
- aggressively clear slab/beam workflow state:
  - `setSlabWorkflowActive(false)`
  - `setAddingBeamToSlabId(null)`
  - `setAddingBeamType(null)`
  - clear any beam-specific temp state that could cause the polyline completion handler to route to a beam path

This is defensive: even if a user previously started a slab beam workflow and then jumps to “Mark on plans” for a joint, joints should be isolated.

---

### 5) Return to the exact module the user was working on (quality-of-life)
Currently, returning to `configure` step happens, but the accordion module is not guaranteed to reopen.

**Files:**
- `src/components/estimates/EstimateFormDialog.tsx`
- `src/components/estimates/calculators/ModularCalculator.tsx`

Plan:
1. In `EstimateFormDialog`, when starting a joint markup (identifier contains `:expansion_joints:joint:` or `:control_joints:joint:`), store a “return target”:
   - target scope id (already inferred in `handleJointMarkupComplete`)
   - target module id:
     - expansion joints → `connections-joints`
     - control joints/saw cuts → `joints-control`
2. Add a prop to `ModularCalculator` like `forceOpenModuleId?: string | null`.
3. Inside `ModularCalculator`, add a `useEffect` that runs when `forceOpenModuleId` changes and does `setOpenModuleId(forceOpenModuleId)`.
4. After returning from takeoff, set `forceOpenModuleId` once, then clear it so it doesn’t keep forcing future navigation.

This makes “return to the module I was working on” feel instant and obvious.

---

## Files to change
1. `src/components/estimates/takeoff/PlanTakeoffStep.tsx`
   - Make toolbar modes exclusive (`isPolylineMode` excludes joints)
   - Replace effect-based joint capture with synchronous capture via a dedicated `onPolylinePointsChange` handler
   - Implement `handleDoneMarkingJoints()` that saves + calls `onJointMarkupComplete` + resets state
   - Clear any slab beam workflow state when entering joint marking
2. `src/components/estimates/calculators/ModularCalculator.tsx`
   - Add `forceOpenModuleId` prop + effect to open that module
3. `src/components/estimates/EstimateFormDialog.tsx`
   - Track which module to return to for joint markups
   - Pass `forceOpenModuleId` into the active scope’s `ModularCalculator`

(We likely won’t need to touch `TakeoffToolbar.tsx` beyond wiring `onDoneMarkingJoints` to the new handler and ensuring `onCancelJointMarking` behavior remains correct.)

---

## Test plan (end-to-end, covers your exact complaints)
1. Open an estimate → go to Configure scopes.
2. In a scope that has **Expansion Joints**:
   - open the “Connections & Joints” module
   - click **Mark on Plans** on a specific expansion joint row
3. In Takeoff:
   - verify toolbar text says “Tap to mark expansion joint lines” (not footing path)
   - click 2 points → a line forms; click a 3rd point → it starts a new line segment
   - after at least 1 segment, press **Done**
   - confirm it immediately returns you to the same module (Connections & Joints), with:
     - the joint length populated
     - “Measured” badge set
4. Repeat for **Control Joints / Saw Cuts**:
   - ensure it returns to the “Control Joints / Saw Cuts” module and updates that joint config
5. Regression: Mark a driveway slab + beams, then jump to joint marking:
   - verify joint marking does not save any markup as `edge_beam` / does not open beam dialogs.

---

## Notes / assumptions
- I’m assuming you want **Done** to auto-save and return (no intermediate confirmation dialog). If you still want a confirmation step, we can keep the dialog but rename the toolbar button to “Finish” and make “Confirm & Return” explicit — but your message suggests you want direct return.

If you want me to continue implementing these changes, please send a new message (since I had to stop tool usage due to the time-critical system directive).
