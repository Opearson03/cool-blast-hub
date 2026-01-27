
## Replace Waffle Pod Scope with Raft Slab Architecture

### Overview
Delete the existing `WAFFLE_POD_SCOPE` definition and replace it with an exact copy of `RAFT_SLAB_SCOPE`, only changing:
- `id`: `'raft_slab'` → `'waffle_pod'`
- `name`: `'Raft Slab'` → `'Waffle Pod'`
- `description`: Updated for waffle pod context
- `areasLabel`: `'Raft Slab Areas'` → `'Waffle Pod Areas'`
- `defaultExclusions`: Updated module IDs to reference `waffle_pod`

The new Waffle Pod will have:
- Multi-area support with edge beams and internal stiffening beams
- The `reinforcement-raft` module (unified reinforcement)
- Same takeoff workflow as Raft Slab
- Same volume calculation logic as Raft Slab

### Current Waffle Pod vs New Waffle Pod

| Feature | Current | New (Raft Slab Copy) |
|---------|---------|---------------------|
| Multiple Areas | ✅ | ✅ |
| Edge Beams | ❌ (basic) | ✅ (multi-type markup) |
| Internal Beams | ❌ (single field) | ✅ (multi-type markup) |
| Reinforcement Module | `reinforcement-slab` + `reinforcement-footing` | `reinforcement-raft` |
| Pod-specific fields | ✅ (pod_count, pod_size, etc.) | ❌ (removed) |
| Volume Calculation | Pod void subtraction | Standard slab + beams |

### Files to Modify

1. **`src/lib/estimate-components/scopes.ts`**
   - Delete current `WAFFLE_POD_SCOPE` (lines 381-556)
   - Replace with exact copy of `RAFT_SLAB_SCOPE` with updated identifiers

### Technical Details

#### New WAFFLE_POD_SCOPE Definition

```typescript
export const WAFFLE_POD_SCOPE: ScopeDefinition = {
  id: 'waffle_pod',
  name: 'Waffle Pod',
  description: 'Waffle pod slab system',
  icon: 'grid3x3',
  supportsMultipleAreas: true,
  areasLabel: 'Waffle Pod Areas',
  supportsMultipleBeams: true,
  beamsLabel: 'Internal Stiffening Beams',
  supportsMultipleEdgeBeams: true,
  edgeBeamsLabel: 'Edge Beams',
  hideStandardQuestions: ['internal_beams_length', 'internal_beam_width', 'internal_beam_depth', 'edge_beam_length', 'edge_beam_width', 'edge_beam_depth'],
  questions: [
    // EXACT COPY of Raft Slab questions
    { id: 'area', ... },
    { id: 'perimeter', ... },
    { id: 'thickness', ... },
    { id: 'edge_beam_depth', ... },
    { id: 'edge_beam_width', ... },
    { id: 'edge_beam_length', ... },
    { id: 'internal_beams_length', ... },
    { id: 'internal_beam_width', ... },
    { id: 'internal_beam_depth', ... },
  ],
  moduleIds: [
    'excavation',
    'base-preparation',
    'formwork',
    'reinforcement-raft',  // Unified reinforcement module
    'labour-prep',
    'concrete-supply',
    'concrete-pumping',
    'labour-place',
    'surface-finishing',
    'cleanup',
    'sundries',
    'extra-items',
  ],
  calculateVolume: (answers) => {
    // EXACT COPY of Raft Slab volume calculation
  },
  defaultExclusions: [
    { id: 'engineering', text: 'Engineering design and certification', moduleId: 'waffle_pod' },
    { id: 'permits', text: 'Council permits and approvals', moduleId: 'waffle_pod' },
    { id: 'termite', text: 'Termite treatment and barriers', moduleId: 'waffle_pod' },
  ],
};
```

### Removed Fields (No Longer Needed)
- `pod_count` - Number of pods
- `pod_size` - Pod module size (1090mm, etc.)
- `pod_thickness` - Pod thickness (225mm, etc.)
- `top_slab_thickness` - Thickness over pods
- `rib_width` - Width of concrete ribs
- `calculateExcavationVolume` - Waffle-specific excavation calculation

### Module Flow (New Waffle Pod)

```text
excavation → base-preparation → formwork → reinforcement-raft →
labour-prep → concrete-supply → concrete-pumping → labour-place →
surface-finishing → cleanup → sundries → extra-items
```

### Takeoff Workflow (New Waffle Pod)

```text
1. Mark Slab Area (polygon/rectangle)
      ↓
2. Name Area Dialog
   • Enter name (e.g., "Main Slab")
   • Shows area and perimeter
   • [Cancel] [Skip Beams] [Add Edge Beam]
      ↓
3. Mark Edge Beams (polyline) - Optional
      ↓
4. Edge Beam Details
   • Name type (e.g., "EB1")
   • Width (mm) and Depth (mm)
      ↓
5. Add Internal Beams (optional)
      ↓
6. Summary with [Add More Beams] [Finish]
```

### Testing Checklist

- [ ] Waffle Pod shows "Internal Stiffening Beams" option in estimator
- [ ] Waffle Pod shows "Edge Beams" option in estimator
- [ ] Waffle Pod takeoff triggers slab + beam workflow
- [ ] Waffle Pod uses `reinforcement-raft` module
- [ ] Pod-specific fields (pod_count, pod_size, etc.) are removed
- [ ] Volume calculation works correctly for slab + beams
- [ ] "Add Area" shows markup prompt dialog
- [ ] Raft Slab still works correctly (unchanged)
