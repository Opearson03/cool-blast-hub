# Memory: features/takeoff/waffle-pod-simplified-workflow-v2
Updated: now

The Waffle Pod takeoff workflow is simplified by removing the "Pods and Accessories" section from the `SlabBeamMarkupDialog`. This dialog is now focused solely on naming the slab and viewing its area/perimeter.

Additionally, all waffle pod configuration is now rendered in a **dedicated "Pods" module** (between Formwork and Reinforcement) via `WafflePodConfigInput`. This includes:
- Pod specifications (size, thickness, topping, rib width)
- Pod grid dimensions (nx, ny)
- Accessories (TM chairs, bar chairs, pod count)

## Boss's Simplified Formulas (Jan 2026)

All accessory and reinforcement quantities are now derived from **pod count** using empirical industry formulas:

| Item | Formula | Unit | Notes |
|------|---------|------|-------|
| Ribs Reo (per layer) | `pods × 2.4` | linear metres | Total bar length per reinforcement layer |
| 4-Way Spacers | `pods × 1` | units | One spacer per pod |
| 2-Way Spacers | `inside perimeter / 1.2` | units | Perimeter spacers every 1.2m |
| Pod Rails | `pods × 2` | units | Two rails per pod (packs of 20) |

### Implementation:
- `WafflePodConfigInput.tsx`: Auto-derives spacer/rail counts via `useEffect` when `podCount` or `perimeter` changes
- `reinforcement-raft.ts`: Replaced grid-based (nx × ny) rib calculation with `pods × 2.4` formula
- `WafflePodRibsInput.tsx`: UI displays simplified "Xm per layer (Y pods × 2.4m)" summary

### Rib Concrete Formula (Pending Clarification)
Boss provided: `(pods × depth × 0.264) - (inside perimeter × depth × 110/2 × 3.64)`
Awaiting clarification on:
1. Is "depth" pod thickness or total slab height?
2. What does the 3.64 factor represent?
3. How is "inside perimeter" measured?

## Reinforcement Module Structure

The **Reinforcement module** (`reinforcement-raft`) for waffle pod scopes renders dedicated sections:

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
