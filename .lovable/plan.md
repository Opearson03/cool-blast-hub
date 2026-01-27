

## Update Slab on Ground to Match Driveway Scope (Without Plumbing)

### Overview
Replace the current `STANDARD_SLAB_SCOPE` definition with a copy of the Driveway scope configuration, removing only the `plumbing` module. This will give Slab on Ground:
1. Edge thickening support with multi-type markup
2. The same takeoff flow as driveway (area marking + edge thickening)
3. The unified `reinforcement-raft` module with scope-aware labeling
4. Driveway-specific modules (Connections & Joints, Control Joints) but NOT plumbing

### Files to Modify

1. **`src/lib/estimate-components/scopes.ts`**
   - Replace `STANDARD_SLAB_SCOPE` with Driveway-style configuration (minus plumbing module)

2. **`src/types/takeoff.ts`**
   - Add `'standard_slab'` to `SLAB_WITH_BEAMS_SCOPES` array

3. **`src/lib/estimate-components/modules/reinforcement-raft.ts`**
   - Update `getScopeLabel` and `getScopeSectionLabel` functions to include `standard_slab`
   - Update `showIf` for internal beams to hide for standard_slab

4. **`src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx`**
   - Add `'standard_slab'` to `edgeThickeningScopes` array

### Technical Details

#### Updated STANDARD_SLAB_SCOPE

```typescript
export const STANDARD_SLAB_SCOPE: ScopeDefinition = {
  id: 'standard_slab',
  name: 'Slab on Ground',
  description: 'Ground-bearing concrete slab on ground',
  icon: 'square',
  supportsMultipleAreas: true,
  areasLabel: 'Slab Areas',
  supportsMultipleEdgeBeams: true,
  edgeBeamsLabel: 'Edge Thickening',
  hideStandardQuestions: ['edge_beam_length', 'edge_beam_width', 'edge_beam_depth'],
  questions: [
    {
      id: 'area',
      type: 'number',
      label: 'Total Area (m²)',
      required: true,
      min: 1,
      unit: 'm²',
    },
    {
      id: 'perimeter',
      type: 'number',
      label: 'Total Perimeter (m)',
      required: true,
      min: 1,
      unit: 'm',
    },
    {
      id: 'thickness',
      type: 'number',
      label: 'Slab Thickness (mm)',
      required: true,
      requiresUserInput: true,
      min: 75,
      unit: 'mm',
      placeholder: 'Enter thickness',
      helpText: 'Thickness of the main slab',
    },
    // Edge Thickening Questions
    {
      id: 'edge_beam_depth',
      type: 'number',
      label: 'Edge Thickening Depth (mm)',
      required: false,
      min: 200,
      defaultValue: 300,
      unit: 'mm',
      helpText: 'Total depth of thickened edge',
    },
    {
      id: 'edge_beam_width',
      type: 'number',
      label: 'Edge Thickening Width (mm)',
      required: false,
      min: 200,
      defaultValue: 300,
      unit: 'mm',
      helpText: 'Width of thickened edge',
    },
    {
      id: 'edge_beam_length',
      type: 'number',
      label: 'Total Edge Thickening Length (m)',
      required: false,
      min: 0,
      unit: 'm',
      helpText: 'Total continuous length of edge thickening (defaults to perimeter if not specified)',
    },
  ],
  moduleIds: [
    'excavation',
    'base-preparation',
    'formwork',
    'reinforcement-raft',
    'connections-joints',
    // NO 'plumbing' module for Slab on Ground
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
    const area = Number(answers.area) || 0;
    const thicknessM = (Number(answers.thickness) || 100) / 1000;
    const perimeter = Number(answers.perimeter) || 0;
    const edgeBeamDepthM = (Number(answers.edge_beam_depth) || 300) / 1000;
    const edgeBeamWidthM = (Number(answers.edge_beam_width) || 300) / 1000;
    const edgeBeamLength = Number(answers.edge_beam_length) || perimeter;

    // Main slab volume
    const slabVolume = area * thicknessM;

    // Edge thickening volume (extra depth beyond slab thickness)
    const extraEdgeDepth = Math.max(0, edgeBeamDepthM - thicknessM);
    const edgeThickeningVolume = edgeBeamLength * edgeBeamWidthM * extraEdgeDepth;

    return safeVolume(slabVolume + edgeThickeningVolume);
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'standard_slab' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'standard_slab' },
  ],
};
```

#### Updated Takeoff Types

```typescript
// src/types/takeoff.ts
export const SLAB_WITH_BEAMS_SCOPES = ['raft_slab', 'waffle_pod', 'driveway', 'crossovers', 'paths_surrounds', 'standard_slab'] as const;
```

#### Updated Reinforcement Module Labels

```typescript
// src/lib/estimate-components/modules/reinforcement-raft.ts
const edgeThickeningScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];

getScopeLabel: (scopeId) => 
  edgeThickeningScopes.includes(scopeId) 
    ? 'Include Edge Thickening Reinforcement' 
    : 'Include Edge Beam Reinforcement',

getScopeSectionLabel: (scopeId) => 
  edgeThickeningScopes.includes(scopeId) 
    ? 'Edge Thickening' 
    : 'Edge Beams',

// Also update showIf for internal_beam_reo to hide for standard_slab
showIf: (_answers, scopeData) => {
  const noInternalBeamScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
  return !noInternalBeamScopes.includes(scopeData?.scopeId || '');
},
```

#### Updated Takeoff Dialog Labels

```typescript
// src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx
const edgeThickeningScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
const isEdgeThickeningScope = edgeThickeningScopes.includes(scopeId || '');
```

### Comparison: Driveway vs Slab on Ground

| Feature | Driveway | Slab on Ground |
|---------|----------|----------------|
| Multiple Areas | ✅ | ✅ |
| Edge Thickening | ✅ | ✅ |
| Internal Beams | ❌ | ❌ |
| Plumbing Module | ✅ | ❌ |
| Reinforcement Module | reinforcement-raft | reinforcement-raft |
| Takeoff Flow | Area + Edge Thickening | Area + Edge Thickening |

### Module Flow (Slab on Ground)

```text
excavation → base-preparation → formwork → reinforcement-raft →
connections-joints → labour-prep → concrete-supply →
concrete-pumping → labour-place → surface-finishing → joints-control →
cleanup → sundries → extra-items
```

Note: `plumbing` module is intentionally excluded from this flow.

### Takeoff Workflow (Slab on Ground)

```text
1. Mark Slab Area (polygon/rectangle)
      ↓
2. Name Area Dialog
   • Enter name (e.g., "Main Slab")
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

- [ ] Slab on Ground shows "Edge Thickening" option in estimator
- [ ] Slab on Ground takeoff triggers slab + beam workflow
- [ ] Slab on Ground uses "Edge Thickening" labels (not "Edge Beams")
- [ ] Slab on Ground "Add Area" shows markup prompt dialog
- [ ] Reinforcement module shows "Edge Thickening" section for Slab on Ground
- [ ] Internal beams section hidden for Slab on Ground
- [ ] Plumbing module does NOT appear in Slab on Ground
- [ ] Volume calculations include edge thickening for Slab on Ground
- [ ] Driveway still includes plumbing module (unchanged)

