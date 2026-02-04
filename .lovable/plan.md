
Goal
- Stop waffle pod slabs from counting topping mesh twice in the Reinforcement cost breakdown and totals.

What’s happening (root cause)
- The waffle pod reinforcement logic correctly intends to “skip generic slab mesh” (per-area mesh items) when scopeId === "waffle_pod".
- However, the current control flow in `src/lib/estimate-components/modules/reinforcement-raft.ts` is:

  - If `(areas.length > 0 && !skipGenericAreaMesh)` → do per-area mesh
  - Else if `(totalArea > 0)` → add fallback slab mesh item (`id: "mesh_slab"`)

- For waffle pod:
  - `skipGenericAreaMesh` is true, so the per-area mesh block is skipped
  - But the `else if (totalArea > 0)` fallback still runs, adding `mesh_slab`
  - Later in the waffle pod-specific section, the module also adds `waffle_slab_mesh`
  - Result: two mesh line items (often the same mesh type, e.g. SL85/SL82), doubling cost/quantity.

Implementation changes (code)
1) Fix the conditional so the fallback mesh is also skipped for waffle pods
- File: `src/lib/estimate-components/modules/reinforcement-raft.ts`
- Update the “SLAB SURFACE REINFORCEMENT” section to ensure BOTH the per-area block AND the fallback block only run when `!skipGenericAreaMesh`.

Recommended refactor (clear and safe):
- Keep:
  - `const skipGenericAreaMesh = scopeData?.scopeId === 'waffle_pod';`
- Change the slab reinforcement section to:

  - If `!skipGenericAreaMesh`:
    - If `areas.length > 0` → run current per-area mesh/bar logic
    - Else if `totalArea > 0` → run current fallback `mesh_slab` logic
  - Else (waffle pod):
    - Do nothing here (topping mesh is handled later by `waffle_slab_mesh`)

This ensures waffle pods never add `mesh_slab` (or any generic slab-surface mesh items).

2) (Optional but recommended) Tighten/clarify the inline comment
- Update the existing comment near `skipGenericAreaMesh` to explicitly mention the fallback is also skipped, to prevent regressions.

Validation plan (manual)
1) Open an existing waffle pod estimate that currently shows duplicated mesh.
2) Go to Reinforcement → Cost breakdown.
3) Expected after fix:
   - Only one topping mesh line item exists: `waffle_slab_mesh` (e.g. “Topping SL85 …”)
   - The generic fallback item `mesh_slab` is gone
   - Totals/subtotals decrease accordingly (by exactly the removed duplicate mesh cost).
4) Regression check:
   - Create/open a non-waffle scope without per-area breakdown (where `areas.length === 0` but `totalArea > 0`, e.g. a simple slab scenario).
   - Confirm the fallback `mesh_slab` still appears and pricing remains unchanged.

Notes / why this won’t break other scopes
- This change only affects the slab-surface mesh calculation path when scopeId is waffle_pod.
- Waffle pod mesh is already intentionally handled by the dedicated topping mesh calculation (`waffle_slab_mesh`), so removing the fallback is the correct behavior.

Files to change
- `src/lib/estimate-components/modules/reinforcement-raft.ts`
