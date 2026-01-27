
## Waffle Pod Takeoff Counting Tools Implementation

### Overview
Extend the Waffle Pod takeoff workflow to include point-based counting tools for:
1. **Waffle Pods** - Count individual pods and select depth (225mm, 275mm, etc.)
2. **4-Way Spacers** - Count intersection points where 4 pods meet
3. **2-Way Spacers** - Count edge points where 2 pods meet
4. **Pod Rails** - Auto-calculate when 100mm slab is selected (2 rails per pod, packs of 20)

Additionally, update the internal beam defaults for waffle pods to:
- Default width: 110mm
- Default reinforcement: 1× N12 bottom bar (with option to add second top layer)

---

### New Counting Categories

| Element | Tool Type | Symbol | Calculation |
|---------|-----------|--------|-------------|
| Waffle Pods | Point (tap each) | Gridded Square | Direct count from markings |
| 4-Way Spacers | Point (tap each) | Cross/Plus icon | Direct count from intersection taps |
| 2-Way Spacers | Point (tap each) | Horizontal line icon | Direct count from edge taps |
| Pod Rails | Auto-calculated | N/A | 2 × pod_count ÷ 20 = packs needed |

---

### Files to Modify

#### 1. `src/types/takeoff.ts`
- Add new point scope types for waffle pod elements:
```typescript
export const WAFFLE_POD_POINT_SCOPES = ['waffle_pods_count', 'spacers_4way', 'spacers_2way'] as const;
export type WafflePodPointScope = typeof WAFFLE_POD_POINT_SCOPES[number];
```

#### 2. `src/lib/estimate-components/scopes.ts`
- Add new questions to `WAFFLE_POD_SCOPE` for spacer counts:
```typescript
{
  id: 'spacer_4way_count',
  type: 'number',
  label: '4-Way Spacers',
  required: false,
  min: 0,
  defaultValue: 0,
  helpText: 'Count of 4-way intersection spacers',
},
{
  id: 'spacer_2way_count',
  type: 'number',
  label: '2-Way Spacers',
  required: false,
  min: 0,
  defaultValue: 0,
  helpText: 'Count of 2-way edge spacers',
},
{
  id: 'pod_rails_required',
  type: 'boolean',
  label: 'Pod Rails Required',
  defaultValue: false,
  helpText: 'Auto-enabled for 100mm slabs (2 rails per pod)',
},
{
  id: 'pod_rail_packs',
  type: 'number',
  label: 'Pod Rail Packs',
  min: 0,
  defaultValue: 0,
  helpText: 'Packs of 20 pod rails',
},
```

#### 3. `src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx`
- Add new step in `SlabWorkflowStep` type: `'count_pods' | 'count_4way' | 'count_2way'`
- Add pod depth selection dropdown when counting pods (225mm, 275mm, 325mm, 375mm)
- Create new dialog sections for each counting phase
- Add buttons: "Count 4-Way Spacers", "Count 2-Way Spacers", "Skip to Beams"

#### 4. `src/components/estimates/takeoff/PlanTakeoffStep.tsx`
- Add new state arrays:
```typescript
const [wafflePodPoints, setWafflePodPoints] = useState<TakeoffPoint[]>([]);
const [spacer4WayPoints, setSpacer4WayPoints] = useState<TakeoffPoint[]>([]);
const [spacer2WayPoints, setSpacer2WayPoints] = useState<TakeoffPoint[]>([]);
```
- Add handlers for the new counting workflow
- Create a new dialog `WafflePodCountDialog` for saving counts with depth

#### 5. `src/components/estimates/takeoff/TakeoffToolbar.tsx`
- Add special toolbar mode for waffle pod counting that shows:
  - Current count badge
  - Depth selector (for pods)
  - "Done" and "Cancel" buttons

#### 6. `src/components/estimates/takeoff/DrawingCanvas.tsx`
- Add rendering for waffle pod point markers:
  - Pods: Gridded square icon
  - 4-Way: Cross/plus icon
  - 2-Way: Horizontal bar icon

#### 7. `src/components/estimates/calculators/ModularCalculator.tsx`
- Update pod rails logic:
```typescript
// Auto-calculate pod rails when top_slab_thickness is 100mm
if (scopeId === 'waffle_pod' && Number(scopeAnswers.top_slab_thickness) >= 100) {
  const podCount = Number(scopeAnswers.pod_count) || 0;
  const railsNeeded = podCount * 2;
  const packSize = 20;
  const packsNeeded = Math.ceil(railsNeeded / packSize);
  // Set pod_rails_required and pod_rail_packs
}
```

#### 8. `src/lib/estimate-components/modules/reinforcement-raft.ts`
- Update internal beam defaults for waffle_pod scope:
```typescript
// For waffle pod: default internal beam width to 110mm
const defaultInternalBeamWidth = scopeData?.scopeId === 'waffle_pod' ? 110 : 300;

// Default reinforcement: 1× N12 bottom
const defaultInternalBeamBarSize = 'N12';
const defaultInternalBeamBarCount = 1;
const defaultInternalBeamBarPosition = 'bottom';
```
- Add option for second top layer in beam reinforcement config

#### 9. `src/lib/boq-generator.ts`
- Add spacer line items:
```typescript
// 4-Way Spacers
if (scopeData.spacer_4way_count > 0) {
  items.push({
    description: '4-Way Waffle Pod Spacers',
    quantity: scopeData.spacer_4way_count,
    unit: 'units',
    category: 'Formwork',
  });
}

// 2-Way Spacers
if (scopeData.spacer_2way_count > 0) {
  items.push({
    description: '2-Way Waffle Pod Spacers',
    quantity: scopeData.spacer_2way_count,
    unit: 'units',
    category: 'Formwork',
  });
}

// Pod Rails (for 100mm+ slabs)
if (scopeData.pod_rail_packs > 0) {
  items.push({
    description: 'Pod Rail Spacers (40mm × 550mm)',
    quantity: scopeData.pod_rail_packs,
    unit: 'packs of 20',
    category: 'Formwork',
  });
}
```

#### 10. New Component: `src/components/estimates/takeoff/WafflePodCountDialog.tsx`
- Dialog for confirming waffle pod counts with depth selection
- Shows count, depth dropdown, and calculated volume
- Options: "Save", "Save & Count 4-Way", "Cancel"

---

### User Workflow (Waffle Pod Takeoff)

```text
1. Mark Slab Area (polygon/rectangle)
      ↓
2. Enter Pod Configuration
   • Pod size (1090mm default)
   • Pod depth (225mm default)
   • Top slab thickness
   • Rib width (110mm default)
      ↓
3. Count Waffle Pods (point tool)
   • Tap each pod location
   • "Done" → Save count
      ↓
4. Count 4-Way Spacers (point tool) - Optional
   • Tap each intersection
   • "Skip" or "Done"
      ↓
5. Count 2-Way Spacers (point tool) - Optional
   • Tap each edge connection
   • "Skip" or "Done"
      ↓
6. Mark Edge Beams (polyline) - Optional
      ↓
7. Mark Internal Beams (polyline) - Optional
   • Default width: 110mm
   • Default reo: 1× N12 bottom
      ↓
8. Complete → Auto-calculate pod rails if 100mm slab
```

---

### Technical Details

#### Pod Rails Logic
When `top_slab_thickness >= 100mm`:
- Pod rails replace standard 50/65mm chairs
- Formula: `pod_rail_packs = Math.ceil((pod_count * 2) / 20)`
- Reference: [AllCon Group Pod Rails](https://allcongroup.com.au/product/40mm-x-550mm-podrail-spacer/)

#### Internal Beam Reinforcement Defaults (Waffle Pod Only)
```typescript
{
  beamWidth: 110, // mm
  bottomBars: {
    size: 'N12',
    count: 1,
  },
  topBars: {
    enabled: false, // User can enable
    size: 'N12',
    count: 1,
  },
}
```

#### Spacer Visualization
- 4-Way Spacers: Purple cross/plus markers at intersections
- 2-Way Spacers: Orange horizontal bar markers at edges

---

### Testing Checklist

- [ ] Waffle pod takeoff shows "Count Pods" step after area marking
- [ ] Pod depth dropdown shows 225, 275, 325, 375mm options
- [ ] 4-Way spacer counting uses point tool with cross markers
- [ ] 2-Way spacer counting uses point tool with bar markers
- [ ] 100mm slab auto-enables pod rails calculation
- [ ] Pod rails calculated as 2× pods ÷ 20 packs
- [ ] Internal beam defaults to 110mm width for waffle pod
- [ ] Internal beam reo defaults to 1× N12 bottom
- [ ] Option to add second top bar layer in reinforcement config
- [ ] BOQ includes spacer and pod rail line items
- [ ] Counts persist in scope_data after save
