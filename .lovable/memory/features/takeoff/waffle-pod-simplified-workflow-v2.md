# Memory: features/takeoff/waffle-pod-simplified-workflow-v2

The Waffle Pod takeoff workflow is simplified by removing the "Pods and Accessories" section from the `SlabBeamMarkupDialog`. This dialog is now focused solely on naming the slab and viewing its area/perimeter.

Additionally, the standalone `WafflePodConfigCard` component has been removed from `ModularCalculator.tsx`. All waffle pod configuration (pod specs, rib reinforcement, topping mesh, accessories) is now rendered **inside the Reinforcement module** via `WafflePodReinforcementInput` when `scopeId === 'waffle_pod'`. This integrates waffle pod-specific settings directly with other reinforcement calculations (slab areas, edge beams, internal beams) in a unified module view.

**Key changes:**
1. `SlabBeamMarkupDialog` for waffle pods shows only name input and area/perimeter stats
2. `WafflePodConfigCard` no longer renders separately in the configure tab
3. `WafflePodReinforcementInput` component renders pod config inside the Reinforcement accordion
4. Pod grid, rib bars, topping mesh, and accessories are configured alongside slab/beam reinforcement
