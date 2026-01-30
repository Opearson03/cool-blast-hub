# Memory: features/takeoff/waffle-pod-simplified-workflow-v2
Updated: now

The Waffle Pod takeoff workflow is simplified by removing the "Pods and Accessories" section from the `SlabBeamMarkupDialog`. This dialog is now focused solely on naming the slab and viewing its area/perimeter.

Additionally, all waffle pod configuration is now rendered in a **dedicated "Pods" module** (between Formwork and Reinforcement) via `WafflePodConfigInput`. This includes:
- Pod specifications (size, thickness, topping, rib width)
- Pod grid dimensions (nx, ny)
- Rib reinforcement config (bar counts, sizes, stock length)
- Topping mesh configuration
- Accessories (TM chairs, bar chairs, pod rails, spacers)

The Reinforcement module (`reinforcement-raft`) now focuses purely on reinforcement calculations without embedding waffle pod configuration UI.

**Key changes:**
1. `SlabBeamMarkupDialog` for waffle pods shows only name input and area/perimeter stats
2. New `pods` module created with material/accessory cost calculations
3. `WafflePodConfigInput` component renders pod config inside the Pods module accordion
4. Pod count uses area-based formula: `ceil(area / module_pitch²)` where module_pitch = pod_size + rib_width
5. Module order: Excavation → Base Prep → Formwork → **Pods** → Reinforcement → ...
