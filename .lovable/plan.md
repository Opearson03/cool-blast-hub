

## Replace Strip Footings and Retaining Wall Footings Reinforcement Module

### Overview
Replace the current `reinforcement-footing` module with an architecture similar to `reinforcement-raft`, adapted for linear footings.

**Key difference from raft slab reinforcement:**
- **No standard mesh** (SL82, RL1018, etc.) - there's no slab surface to mesh
- **Trench mesh IS included** - for footing reinforcement (up to 2 layers like raft beams)
- **Linear sections** instead of areas - footings are measured by length, not area

### Architecture Changes

#### 1. Create New Component: `LinearSectionReinforcementInput.tsx`

Create a new UI component modeled after `AreaReinforcementInput.tsx` but adapted for linear footing sections:

**Features:**
- Collapsible accordion for each footing section (SF1-1, SF1-2, RW1-1, etc.)
- Summary header showing total length, sections with reo, sections with ligs
- Per-section configuration:
  - **Reinforcement Type**: None, Trench Mesh, Bar, or Both
  - **Trench Mesh** (when TM or Both selected):
    - Type selection (L8TM3, L11TM4, L12TM5, etc.)
    - Layers (1 or 2)
    - Top layer type (when 2 layers selected)
    - Price per sheet (auto-populated from price list)
  - **Bar Reinforcement** (when Bar or Both selected):
    - Bar Size (N12, N16, N20, N24)
    - Bar Spacing (100mm, 150mm, 200mm, 250mm)
    - Configuration: Top/Bottom or Bottom only
- **Ligatures section** (inside accordion):
  - Toggle enabled/disabled
  - Size (R10, R12)
  - Centres (100-600mm)
- **Vertical Starters section** (inside accordion):
  - Toggle enabled/disabled
  - Bar size
  - Centres
- **Bar Chairs section** (inside accordion, like raft slab):
  - Toggle enabled/disabled
  - Chair type selection
  - Chairs per metre (linear, not m²)
  - Price per bag

#### 2. Update `reinforcement-footing.ts` Module

Rewrite the module to follow the raft slab pattern:

**Updated Questions:**
- Lap allowance (default 12.5%)
- Include Trench Mesh toggle (global default)
- Include Ligatures toggle (global default)
- Include Vertical Starters toggle (global default)
- Tie wire toggle + coils + price
- Reinforcement Delivery price

**Updated Calculate Function:**
- Process each `linearSection` individually (like raft processes each area/beam)
- Calculate trench mesh sheets per section (length × lap / 6m sheets)
- Support 2-layer trench mesh (top + bottom)
- Calculate bar reinforcement based on per-section settings
- Calculate ligatures per section (aggregated by size)
- Calculate vertical starters per section
- Aggregate chairs by type (per linear metre)
- Add tie wire and delivery

#### 3. Update `LinearSection` Type in `types.ts`

Extend `LinearSection` interface to include all reinforcement and chair settings:

```typescript
export interface LinearSection {
  id: string;
  name: string;
  length: number;
  dimension1: number;  // width in mm
  dimension2: number;  // depth in mm
  _fromTakeoff?: boolean;
  _actualLength?: number;
  
  // Per-section reinforcement settings
  reo_type?: 'none' | 'trench_mesh' | 'bar' | 'both';
  
  // Trench mesh settings
  tm_type?: string;
  tm_layers?: number;
  tm_type_top?: string;
  tm_price_per_sheet?: number;
  tm_price_per_sheet_top?: number;
  
  // Bar reinforcement settings
  bar_size?: string;
  bar_spacing?: string;
  bar_config?: 'bottom' | 'top_bottom';
  
  // Ligatures
  add_ligs?: boolean;
  lig_size?: string;
  lig_centres?: number;
  
  // Vertical starters
  add_vertical_bars?: boolean;
  vertical_bar_size?: string;
  vertical_bar_centres?: number;
  
  // Bar chairs
  chairs_enabled?: boolean;
  chair_type?: string;
  chairs_per_m?: number;
  chair_price_per_bag?: number;
}
```

#### 4. Update `ModuleSection.tsx`

Replace the `FootingReinforcementInput` rendering with the new `LinearSectionReinforcementInput`:

- Detect when module is `reinforcement-footing` for strip/retaining wall scopes
- Pass linear sections from scope data
- Handle onChange to update scope data
- Pass priceMap for auto-population of prices

### Files to Create

1. **`src/components/estimates/calculators/LinearSectionReinforcementInput.tsx`**
   - New component based on `AreaReinforcementInput.tsx`
   - Adapted for linear sections (length-based calculations)
   - Includes trench mesh (no standard mesh), ligatures, vertical starters, and bar chairs

### Files to Modify

1. **`src/lib/estimate-components/types.ts`**
   - Extend `LinearSection` interface with TM, bar, lig, starter, and chair settings

2. **`src/lib/estimate-components/modules/reinforcement-footing.ts`**
   - Complete rewrite following raft slab pattern
   - Include trench mesh calculations (remove standard mesh)
   - Add per-section aggregation logic for TM, bars, ligs, starters, chairs

3. **`src/components/estimates/calculators/ModuleSection.tsx`**
   - Update rendering logic to use new `LinearSectionReinforcementInput`
   - Pass appropriate props for scope data management

### Testing Checklist

- [ ] Strip Footings: Each footing section shows collapsible reinforcement config
- [ ] Retaining Walls: Same behavior as Strip Footings
- [ ] Trench mesh options appear with type selector and layer count
- [ ] 2-layer TM shows separate top layer type selector
- [ ] Per-section bar reinforcement settings work correctly
- [ ] Ligatures aggregate correctly across sections by size
- [ ] Vertical starters aggregate correctly
- [ ] Bar chairs calculate per linear metre
- [ ] Tie wire and delivery work as before
- [ ] Exclusions generate correctly when reo is disabled
- [ ] Pricing calculates correctly with per-section overrides
- [ ] Price fields auto-populate from price list

