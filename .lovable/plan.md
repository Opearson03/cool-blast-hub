
## Update Driveway Scope to Match Raft Slab Flow

### Overview
Update the DRIVEWAY_SCOPE to use the same modern module architecture as the RAFT_SLAB_SCOPE while retaining driveway-specific modules (Connections & Joints, Plumbing, Control Joints) in their current positions.

### Current State Analysis

**Driveway Current Modules:**
```
excavation → base-preparation → formwork → reinforcement-slab → reinforcement-footing →
connections-joints → plumbing → labour-prep → concrete-supply → concrete-pumping →
labour-place → surface-finishing → joints-control → cleanup → sundries → extra-items
```

**Raft Slab Modules (finalized):**
```
excavation → base-preparation → formwork → reinforcement-raft →
labour-prep → concrete-supply → concrete-pumping →
labour-place → surface-finishing → cleanup → sundries → extra-items
```

**Key Differences:**
- Raft uses `reinforcement-raft` (unified per-area/per-beam config) instead of `reinforcement-slab` + `reinforcement-footing`
- Raft supports multi-beam inputs with `supportsMultipleBeams` and `supportsMultipleEdgeBeams`
- Driveway has `connections-joints`, `plumbing`, and `joints-control` which raft doesn't have

### Proposed Changes

#### 1. Update DRIVEWAY_SCOPE in `scopes.ts`

**Replace old questions with raft-style beam/thickening questions:**
- Remove `hasThickening`, `thickeningDepth`, `thickeningWidth`
- Add `edge_beam_depth`, `edge_beam_width`, `edge_beam_length` (like raft)
- Add support for internal beams with `internal_beams_length`, `internal_beam_width`, `internal_beam_depth`

**Add multi-beam support:**
```typescript
supportsMultipleBeams: true,
beamsLabel: 'Internal Stiffening Beams',
supportsMultipleEdgeBeams: true,
edgeBeamsLabel: 'Edge Beams',
hideStandardQuestions: ['internal_beams_length', 'internal_beam_width', 'internal_beam_depth', 'edge_beam_length', 'edge_beam_width', 'edge_beam_depth'],
```

**Update moduleIds:**
```typescript
moduleIds: [
  'excavation',
  'base-preparation',
  'formwork',
  'reinforcement-raft',      // ← Replace reinforcement-slab + reinforcement-footing
  'connections-joints',      // ← KEEP in position
  'plumbing',                // ← KEEP in position
  'labour-prep',
  'concrete-supply',
  'concrete-pumping',
  'labour-place',
  'surface-finishing',
  'joints-control',          // ← KEEP in position
  'cleanup',
  'sundries',
  'extra-items',
],
```

**Update calculateVolume:**
Use the same calculation logic as raft slab to account for:
- Main slab volume (area × thickness)
- Edge beam extra volume (length × width × extra depth)
- Internal beam extra volume (from beam configs)

#### 2. Updated Questions Structure

```typescript
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
    label: 'Driveway Thickness (mm)',
    required: true,
    requiresUserInput: true,
    min: 75,
    unit: 'mm',
    placeholder: 'Enter thickness',
    helpText: 'Thickness of the main driveway slab',
  },
  // Edge Beam Questions (same as raft)
  {
    id: 'edge_beam_depth',
    type: 'number',
    label: 'Edge Beam Depth (mm)',
    required: false,
    min: 200,
    defaultValue: 300,
    unit: 'mm',
    helpText: 'Total depth of thickened edge',
  },
  {
    id: 'edge_beam_width',
    type: 'number',
    label: 'Edge Beam Width (mm)',
    required: false,
    min: 200,
    defaultValue: 300,
    unit: 'mm',
    helpText: 'Width of thickened edge',
  },
  {
    id: 'edge_beam_length',
    type: 'number',
    label: 'Total Edge Beam Length (m)',
    required: false,
    min: 0,
    unit: 'm',
    helpText: 'Total continuous length of edge beams (defaults to perimeter if not specified)',
  },
  // Internal Beam Questions (derived from multi-beam input)
  {
    id: 'internal_beams_length',
    type: 'number',
    label: 'Total Internal Beam Length (m)',
    required: false,
    min: 0,
    defaultValue: 0,
    unit: 'm',
    helpText: 'Derived from beam configurations',
  },
  {
    id: 'internal_beam_width',
    type: 'number',
    label: 'Internal Beam Width (mm)',
    required: false,
    min: 200,
    defaultValue: 300,
    unit: 'mm',
    helpText: 'Weighted average from beam configurations',
  },
  {
    id: 'internal_beam_depth',
    type: 'number',
    label: 'Internal Beam Depth (mm)',
    required: false,
    min: 200,
    defaultValue: 300,
    unit: 'mm',
    helpText: 'Weighted average from beam configurations',
  },
],
```

### Files to Modify

1. **`src/lib/estimate-components/scopes.ts`**
   - Update `DRIVEWAY_SCOPE` definition with new questions, moduleIds, and capabilities

### Updated Module Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                    DRIVEWAY SCOPE (Updated)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐         │
│  │ Excavation  │→ │ Base Preparation │→ │  Formwork   │         │
│  └─────────────┘  └─────────────────┘  └─────────────┘         │
│         ↓                                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           REINFORCEMENT-RAFT (Unified)                    │ │
│  │  • Per-area mesh/bar configuration                        │ │
│  │  • Per-edge-beam TM/ligatures configuration               │ │
│  │  • Per-internal-beam TM/ligatures configuration           │ │
│  └───────────────────────────────────────────────────────────┘ │
│         ↓                                                       │
│  ┌────────────────────┐  ┌───────────┐                         │
│  │ Connections/Joints │→ │  Plumbing │   (DRIVEWAY SPECIFIC)   │
│  └────────────────────┘  └───────────┘                         │
│         ↓                                                       │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Labour Prep │→ │ Concrete Supply │→ │ Concrete Pumping│     │
│  └─────────────┘  └─────────────────┘  └─────────────────┘     │
│         ↓                                                       │
│  ┌─────────────┐  ┌───────────────────┐  ┌────────────────┐    │
│  │ Labour Place│→ │ Surface Finishing │→ │ Control Joints │    │
│  └─────────────┘  └───────────────────┘  └────────────────┘    │
│         ↓                               (DRIVEWAY SPECIFIC)     │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐                   │
│  │ Cleanup │→ │ Sundries │→ │ Extra Items  │                   │
│  └─────────┘  └──────────┘  └──────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Benefits of This Update

1. **Unified Reinforcement Config**: Per-area and per-beam reinforcement configuration (same as raft)
2. **Multi-Beam Support**: Users can configure multiple edge beam types and internal stiffening beams
3. **Consistent UI/UX**: Driveway estimator will have the same modern flow as raft slab
4. **Retains Driveway-Specific Features**: Connections/Joints, Plumbing, and Control Joints modules remain in place

### Testing Checklist

- [ ] Edge beam configuration works with multiple types
- [ ] Internal beam configuration works
- [ ] Per-area reinforcement (mesh/bar) configuration works
- [ ] Connections & Joints module appears in correct position
- [ ] Plumbing module appears in correct position
- [ ] Control Joints module appears in correct position
- [ ] Volume calculations include edge beam and internal beam volumes
- [ ] Existing driveway estimates continue to work (backward compatibility)
