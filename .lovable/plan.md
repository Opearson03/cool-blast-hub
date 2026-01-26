

## Update Paths & Surrounds and Crossovers to Match Driveway Scope

### Overview
Replace the current `PATHS_SURROUNDS_SCOPE` and `CROSSOVERS_SCOPE` definitions with copies of the Driveway scope configuration, updating only the scope-specific names and IDs. This will give both scopes:
1. Edge thickening support with multi-type markup
2. The same takeoff flow as driveway (area marking + edge thickening)
3. The unified `reinforcement-raft` module with scope-aware labeling
4. Driveway-specific modules (Connections & Joints, Plumbing, Control Joints)

### Files to Modify

1. **`src/lib/estimate-components/scopes.ts`**
   - Replace `CROSSOVERS_SCOPE` with Driveway-style configuration
   - Replace `PATHS_SURROUNDS_SCOPE` with Driveway-style configuration

2. **`src/types/takeoff.ts`**
   - Add `'crossovers'` and `'paths_surrounds'` to `SLAB_WITH_BEAMS_SCOPES` array

3. **`src/lib/estimate-components/modules/reinforcement-raft.ts`**
   - Update `getScopeLabel` and `getScopeSectionLabel` functions to include `crossovers` and `paths_surrounds`

4. **`src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx`**
   - Update `isDriveway` check to include `crossovers` and `paths_surrounds` (or create unified check)

### Technical Details

#### Updated CROSSOVERS_SCOPE

```typescript
export const CROSSOVERS_SCOPE: ScopeDefinition = {
  id: 'crossovers',
  name: 'Crossovers',
  description: 'Vehicle crossover/layback installation',
  icon: 'move-horizontal',
  supportsMultipleAreas: true,
  areasLabel: 'Crossover Areas',
  supportsMultipleEdgeBeams: true,
  edgeBeamsLabel: 'Edge Thickening',
  hideStandardQuestions: ['edge_beam_length', 'edge_beam_width', 'edge_beam_depth'],
  questions: [
    // Same as driveway (area, perimeter, thickness, edge thickening questions)
  ],
  moduleIds: [
    'excavation',
    'base-preparation',
    'formwork',
    'reinforcement-raft',
    'connections-joints',
    'plumbing',
    'labour-prep',
    'concrete-supply',
    'concrete-pumping',
    'labour-place',
    'surface-finishing',
    'joints-control',
    'cleanup',
    'sundries',
    'extra-items',
  ],
  calculateVolume: (answers) => {
    // Same calculation as driveway
  },
  defaultExclusions: [
    { id: 'permits', text: 'Council permits and crossover applications', moduleId: 'crossovers' },
    { id: 'kerb', text: 'Kerb and gutter modifications', moduleId: 'crossovers' },
  ],
};
```

#### Updated PATHS_SURROUNDS_SCOPE

```typescript
export const PATHS_SURROUNDS_SCOPE: ScopeDefinition = {
  id: 'paths_surrounds',
  name: 'Paths & Surrounds',
  description: 'Concrete pathways and house surrounds',
  icon: 'footprints',
  supportsMultipleAreas: true,
  areasLabel: 'Path & Surround Areas',
  supportsMultipleEdgeBeams: true,
  edgeBeamsLabel: 'Edge Thickening',
  hideStandardQuestions: ['edge_beam_length', 'edge_beam_width', 'edge_beam_depth'],
  questions: [
    // Same as driveway (area, perimeter, thickness, edge thickening questions)
  ],
  moduleIds: [
    'excavation',
    'base-preparation',
    'formwork',
    'reinforcement-raft',
    'connections-joints',
    'plumbing',
    'labour-prep',
    'concrete-supply',
    'concrete-pumping',
    'labour-place',
    'surface-finishing',
    'joints-control',
    'cleanup',
    'sundries',
    'extra-items',
  ],
  calculateVolume: (answers) => {
    // Same calculation as driveway
  },
  defaultExclusions: [
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'paths_surrounds' },
  ],
};
```

#### Updated Takeoff Types

```typescript
// src/types/takeoff.ts
export const SLAB_WITH_BEAMS_SCOPES = ['raft_slab', 'waffle_pod', 'driveway', 'crossovers', 'paths_surrounds'] as const;
```

#### Updated Reinforcement Module Labels

```typescript
// src/lib/estimate-components/modules/reinforcement-raft.ts
const EDGE_THICKENING_SCOPES = ['driveway', 'crossovers', 'paths_surrounds'];

getScopeLabel: (scopeId) => 
  EDGE_THICKENING_SCOPES.includes(scopeId) 
    ? 'Include Edge Thickening Reinforcement' 
    : 'Include Edge Beam Reinforcement',

getScopeSectionLabel: (scopeId) => 
  EDGE_THICKENING_SCOPES.includes(scopeId) 
    ? 'Edge Thickening' 
    : 'Edge Beams',
```

#### Updated Takeoff Dialog Labels

```typescript
// src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx
const EDGE_THICKENING_SCOPES = ['driveway', 'crossovers', 'paths_surrounds'];
const isEdgeThickeningScope = EDGE_THICKENING_SCOPES.includes(scopeId);
```

### Question Labels by Scope

| Scope | Thickness Label | Areas Label |
|-------|----------------|-------------|
| Driveway | "Driveway Thickness (mm)" | "Driveway Areas" |
| Crossovers | "Crossover Thickness (mm)" | "Crossover Areas" |
| Paths & Surrounds | "Path/Surround Thickness (mm)" | "Path & Surround Areas" |

### Module Flow (All Three Scopes)

```text
excavation → base-preparation → formwork → reinforcement-raft →
connections-joints → plumbing → labour-prep → concrete-supply →
concrete-pumping → labour-place → surface-finishing → joints-control →
cleanup → sundries → extra-items
```

### Takeoff Workflow (All Three Scopes)

```text
1. Mark Area (polygon/rectangle)
      ↓
2. Name Area Dialog
   • Enter name (e.g., "Main Path")
   • Shows area and perimeter
   • [Cancel] [Skip Thickening] [Add Edge Thickening]
      ↓
3. Mark Edge Thickening (polyline) - Optional
      ↓
4. Edge Thickening Details
   • Name type (e.g., "ET1")
   • Width (mm) and Depth (mm)
      ↓
5. Summary with [Add Edge Thickening] [Finish]
```

### Testing Checklist

- [ ] Crossovers shows "Edge Thickening" option in estimator
- [ ] Crossovers takeoff triggers slab + beam workflow
- [ ] Crossovers uses "Edge Thickening" labels (not "Edge Beams")
- [ ] Crossovers "Add Area" shows markup prompt dialog
- [ ] Paths & Surrounds shows "Edge Thickening" option
- [ ] Paths & Surrounds takeoff triggers slab + beam workflow
- [ ] Paths & Surrounds uses "Edge Thickening" labels
- [ ] Paths & Surrounds "Add Area" shows markup prompt dialog
- [ ] Reinforcement module shows "Edge Thickening" section for all three scopes
- [ ] Internal beams section hidden for all three scopes
- [ ] Volume calculations include edge thickening for all three scopes

