# Memory: features/takeoff/waffle-pod-simplified-workflow-v2
Updated: now

The Waffle Pod takeoff workflow is simplified by removing the "Pods and Accessories" section from the `SlabBeamMarkupDialog`. This dialog is now focused solely on naming the slab and viewing its area/perimeter.

Additionally, all waffle pod configuration is now rendered in a **dedicated "Pods" module** (between Formwork and Reinforcement) via `WafflePodConfigInput`. This includes:
- Pod specifications (size, thickness, topping, rib width)
- Pod grid dimensions (nx, ny)
- Accessories (TM chairs, bar chairs, pod count)

The **Reinforcement module** (`reinforcement-raft`) for waffle pod scopes renders dedicated sections that integrate with the existing UI patterns:

1. **Ribs Section** (`WafflePodRibsInput`):
   - Bar counts per rib (top/bottom)
   - Bar sizes (N10-N20)
   - Stock length preference (6m/12m)

2. **Topping Slab Mesh Section** (`WafflePodToppingMeshInput`):
   - Mesh type (SL62-SL102)
   - Layers (1-2)
   - Lap percentage
   - Coverage area mode (pod field/full slab/custom)

3. **Edge Beams Section** (`BeamReinforcementInput`):
   - Rendered only if edge beams exist
   - Uses the standard beam reinforcement UI

4. **Internal Beams Section** (`BeamReinforcementInput`):
   - Rendered only if internal beams exist
   - Uses the standard beam reinforcement UI

**Key changes:**
1. `SlabBeamMarkupDialog` for waffle pods shows only name input and area/perimeter stats
2. `pods` module created with material/accessory cost calculations
3. `WafflePodConfigInput` renders pod config (specs, grid, accessories) inside the Pods module accordion
4. Reinforcement module uses dedicated sections for waffle pod (no duplicate info)
5. Standard `BeamReinforcementInput` reused for edge/internal beams
6. Pod count uses area-based formula: `ceil(area / module_pitch²)` where module_pitch = pod_size + rib_width
7. Module order: Excavation → Base Prep → Formwork → **Pods** → Reinforcement → ...
