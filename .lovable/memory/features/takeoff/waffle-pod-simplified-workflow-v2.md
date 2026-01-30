# Memory: features/takeoff/waffle-pod-simplified-workflow-v2
Updated: now

The Waffle Pod takeoff workflow is simplified by removing the "Pods and Accessories" section from the `SlabBeamMarkupDialog`. This dialog is now focused solely on naming the slab and viewing its area/perimeter.

Additionally, all waffle pod configuration is now rendered in a **dedicated "Pods" module** (between Formwork and Reinforcement) via `WafflePodConfigInput`. This includes:
- Pod specifications (size, thickness, topping, rib width)
- Pod grid dimensions (nx, ny)
- Accessories (TM chairs, bar chairs, pod count)

The **Reinforcement module** (`reinforcement-raft`) now renders `WafflePodReinforcementInput` for waffle pod scopes, which includes:
- Rib reinforcement config (bar counts, sizes, stock length)
- Topping mesh configuration (type, layers, lap %, coverage area mode)

**Key changes:**
1. `SlabBeamMarkupDialog` for waffle pods shows only name input and area/perimeter stats
2. `pods` module created with material/accessory cost calculations
3. `WafflePodConfigInput` renders pod config (specs, grid, accessories) inside the Pods module accordion
4. `WafflePodReinforcementInput` renders reinforcement config (rib bars, topping mesh) inside the Reinforcement module accordion
5. Pod count uses area-based formula: `ceil(area / module_pitch²)` where module_pitch = pod_size + rib_width
6. Module order: Excavation → Base Prep → Formwork → **Pods** → Reinforcement → ...
