

## Remove Duplicate Reinforcement Questions in Pad Footing Module

### Overview
Refactor the Pad Footing Reinforcement module to match the pattern used by other reinforcement modules (e.g., `LinearSectionReinforcementInput`). Currently, there are duplicate global questions for bottom/top reinforcement, bar chairs, and additional horizontal bars that appear **outside** the collapsible accordions. These should be removed since all reinforcement configuration is now handled per-group **inside** the accordions.

### Current Issues

The `reinforcement-pad.ts` module has these global questions that are redundant:

1. **Bottom Reinforcement Questions** (lines 40-152):
   - `has_bottom_reo` - toggle
   - `bottom_a_size`, `bottom_a_centres` - bar A config
   - `bottom_b_size`, `bottom_b_centres` - bar B config
   - `calculated_bottom_a`, `calculated_bottom_b` - derived text

2. **Top Reinforcement Questions** (lines 154-259):
   - `has_top_reo` - toggle
   - `top_a_size`, `top_a_centres` - bar A config
   - `top_b_size`, `top_b_centres` - bar B config
   - `calculated_top_a`, `calculated_top_b` - derived text

3. **Additional Horizontal Bars** (lines 261-318):
   - Currently only in global questions, not in per-group UI
   - These should either be moved into the accordion or removed

4. **Bar Chairs** (lines 345-370):
   - Global toggle and settings - should be per-group like other modules

The `PadFootingGroupReinforcementInput` component already handles per-group bottom/top reinforcement inside collapsible accordions, but it:
- Receives default values from the redundant global module questions
- Is missing bar chairs per group
- Is missing additional horizontal bars per group

### Changes Required

#### 1. Update `reinforcement-pad.ts` Module

**Remove these global questions:**
- `has_bottom_reo`, `bottom_a_size`, `bottom_a_centres`, `bottom_b_size`, `bottom_b_centres`
- `calculated_bottom_a`, `calculated_bottom_b`
- `has_top_reo`, `top_a_size`, `top_a_centres`, `top_b_size`, `top_b_centres`
- `calculated_top_a`, `calculated_top_b`
- `has_additional_horizontal`, `additional_h_count`, `additional_h_size`, `additional_h_length`, `calculated_additional_h`
- `bar_chairs`, `chairs_per_sqm`, `chair_price_per_100`

**Keep these global questions (pricing/sundries):**
- `rebar_type` - Cut & Bend vs Stock
- `rebar_price_per_tonne`
- `reo_delivery`
- `reo_sundries`

**Update calculate function:**
- Remove fallback defaults from module answers
- Read all reinforcement settings directly from each `PadFootingGroup`
- Process bar chairs per group (using group-level settings)

#### 2. Update `PadFootingGroup` Type in `types.ts`

Add bar chair properties to `PadFootingGroup`:

```typescript
export interface PadFootingGroup {
  // ... existing props
  
  // Bar Chairs
  chairs_enabled?: boolean;
  chairs_per_sqm?: number;
  chair_price_per_100?: number;
}
```

#### 3. Update `PadFootingGroupReinforcementInput.tsx`

- Remove all `default*` props since they're no longer needed
- Add Bar Chairs section inside each accordion (similar to LinearSectionReinforcementInput)
- Update summary to include chair counts
- Simplify interface - groups now self-contain all their reinforcement settings

#### 4. Update `ModuleSection.tsx`

- Remove the default prop passing to `PadFootingGroupReinforcementInput`
- Pass `priceMap` for auto-population of chair prices

### Files to Modify

1. **`src/lib/estimate-components/types.ts`**
   - Add `chairs_enabled`, `chairs_per_sqm`, `chair_price_per_100` to `PadFootingGroup`

2. **`src/lib/estimate-components/modules/reinforcement-pad.ts`**
   - Remove redundant global questions (bottom/top reo, bar chairs)
   - Update `calculate` to read directly from groups without module answer fallbacks
   - Update `getExclusions` to check group-level settings

3. **`src/components/estimates/calculators/PadFootingGroupReinforcementInput.tsx`**
   - Remove all `default*` props from interface
   - Add Bar Chairs section inside each accordion
   - Simplify component - each group is fully self-contained
   - Add priceMap prop for chair price auto-population

4. **`src/components/estimates/calculators/ModuleSection.tsx`**
   - Simplify the `PadFootingGroupReinforcementInput` rendering (remove default props)
   - Pass `priceMap` to component

### Technical Details

**Updated Module Questions:**
```typescript
questions: [
  {
    id: 'rebar_type',
    type: 'select',
    label: 'Rebar Supply Type',
    options: [
      { value: 'cut_bend', label: 'Cut & Bend' },
      { value: 'stock', label: 'Stock Lengths' },
    ],
    defaultValue: 'cut_bend',
  },
  {
    id: 'rebar_price_per_tonne',
    type: 'currency',
    label: 'Rebar Price per Tonne',
    defaultValue: 2100,
    unit: '/tonne',
  },
  {
    id: 'reo_delivery',
    type: 'currency',
    label: 'Reo Delivery',
    defaultValue: 150,
  },
  {
    id: 'reo_sundries',
    type: 'currency',
    label: 'Reo Sundries (tie wire, etc.)',
    defaultValue: 200,
  },
],
```

**Updated Component Props:**
```typescript
interface PadFootingGroupReinforcementInputProps {
  padGroups: PadFootingGroup[];
  onChange: (padGroups: PadFootingGroup[]) => void;
  priceMap?: PriceMap;
  label: string;
}
```

**Bar Chairs UI Inside Accordion:**
```
[PF1]  5 pads  600×600×400mm  [Bottom] [Chairs] [Custom]
  └─ Bottom Reinforcement:  [Yes/No]
     ├─ Bar A Size: [N16]  Centres: [200] mm
     └─ Bar B Size: [N16]  Centres: [200] mm
  └─ Top Reinforcement:    [Yes/No]
     ├─ ...
  └─ Bar Chairs:           [Yes/No]
     ├─ Chairs per m²: [4]
     └─ Price per 100: [$45.00]
```

### Testing Checklist

- [ ] No global bottom/top reinforcement toggles appear in the module
- [ ] No global bar chairs toggle appears in the module
- [ ] Each pad group accordion contains full reinforcement configuration
- [ ] Bar chairs section appears inside each group accordion
- [ ] Prices calculate correctly using per-group settings only
- [ ] Groups with no reinforcement generate appropriate exclusions
- [ ] Summary header shows accurate counts (pads with reo, pads with chairs)
- [ ] Rebar pricing and delivery/sundries questions still appear globally

