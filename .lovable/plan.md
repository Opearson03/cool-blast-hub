

## Update Driveway Scope: Remove Internal Beams and Rename Edge Beams to Edge Thickening

### Overview
Update the Driveway scope to:
1. Remove "Internal Stiffening Beams" support entirely
2. Rename "Edge Beams" to "Edge Thickening" throughout the UI
3. Enable edge thickening markup at the takeoff stage (same flow as raft slab edge beams)

### Current State

**Driveway Scope Configuration:**
- `supportsMultipleBeams: true` with label "Internal Stiffening Beams"
- `supportsMultipleEdgeBeams: true` with label "Edge Beams"
- Not included in `SLAB_WITH_BEAMS_SCOPES` array (takeoff doesn't support beam marking)

**Takeoff Classification:**
- `SLAB_WITH_BEAMS_SCOPES = ['raft_slab', 'waffle_pod']` - driveway is excluded

### Changes Required

#### 1. Update `scopes.ts` - Driveway Scope

**Remove internal beam support:**
- Set `supportsMultipleBeams: false` (or remove the property)
- Remove `beamsLabel` 
- Remove internal beam questions from `hideStandardQuestions`

**Update edge beam labelling:**
- Change `edgeBeamsLabel` from `'Edge Beams'` to `'Edge Thickening'`

**Update volume calculation:**
- Remove internal beam volume calculation since it's no longer supported

#### 2. Update `takeoff.ts` - Add Driveway to Beam Scopes

Add `'driveway'` to the `SLAB_WITH_BEAMS_SCOPES` array to enable the slab + beam workflow during takeoff:

```typescript
export const SLAB_WITH_BEAMS_SCOPES = ['raft_slab', 'waffle_pod', 'driveway'] as const;
```

#### 3. Update `SlabBeamMarkupDialog.tsx` - Driveway-Specific Labels

Add driveway-specific label handling:
- When `scopeId === 'driveway'`, use "Edge Thickening" instead of "Edge Beam" in titles and labels
- Skip internal beam options entirely for driveway (only show edge thickening flow)

**Key Label Changes:**
| Current Label | Driveway Label |
|---------------|----------------|
| "Edge Beam Details" | "Edge Thickening Details" |
| "Edge Beams Summary" | "Edge Thickening Summary" |
| "Add Edge Beam" | "Add Edge Thickening" |
| "Edge Beams (X)" | "Edge Thickening (X)" |
| "Finish (No Internal)" | "Finish" (and skip internal beam step entirely) |

#### 4. Update `SlabBeamMarkingBar` - Driveway Labels

Update the floating bar component to show "Edge Thickening" instead of "Edge Beam" when marking driveways.

### Files to Modify

1. **`src/lib/estimate-components/scopes.ts`**
   - Update `DRIVEWAY_SCOPE`: remove internal beam support, rename edge beam label

2. **`src/types/takeoff.ts`**
   - Add `'driveway'` to `SLAB_WITH_BEAMS_SCOPES` array

3. **`src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx`**
   - Add `isDriveway` check similar to `isWafflePod`
   - Update `getStepTitle()` and `getStepDescription()` for driveway
   - Update button labels and section headers for driveway
   - For driveway, skip straight to "Finish" after edge thickening (no internal beam option)

### Updated Driveway Scope Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                 DRIVEWAY TAKEOFF WORKFLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Mark Driveway Area (polygon/rectangle)                  │
│         ↓                                                   │
│  2. Name Driveway Dialog                                    │
│     • Enter name (e.g., "Main Driveway")                    │
│     • Shows area and perimeter                              │
│     • Buttons: [Cancel] [Skip Thickening] [Add Edge Thick.] │
│         ↓                                                   │
│  3. Mark Edge Thickening (polyline)                         │
│     • Draw thickened edge around perimeter                  │
│         ↓                                                   │
│  4. Edge Thickening Details Dialog                          │
│     • Name type (e.g., "ET1")                               │
│     • Width (mm) and Depth (mm)                             │
│         ↓                                                   │
│  5. Edge Thickening Summary                                 │
│     • Shows all marked thickenings                          │
│     • Buttons: [Add Edge Thickening] [Finish]               │
│         ↓                                                   │
│  (No internal beam step for driveway)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technical Details

**Updated DRIVEWAY_SCOPE Configuration:**
```typescript
export const DRIVEWAY_SCOPE: ScopeDefinition = {
  id: 'driveway',
  name: 'Driveway',
  description: 'Concrete driveway installation',
  icon: 'car',
  supportsMultipleAreas: true,
  areasLabel: 'Driveway Areas',
  supportsMultipleBeams: false,  // ← REMOVED
  supportsMultipleEdgeBeams: true,
  edgeBeamsLabel: 'Edge Thickening',  // ← RENAMED
  hideStandardQuestions: ['edge_beam_length', 'edge_beam_width', 'edge_beam_depth'],
  // ... questions and modules remain the same
};
```

**Dialog Label Logic:**
```typescript
const isWafflePod = scopeId === 'waffle_pod';
const isDriveway = scopeId === 'driveway';

const getEdgeBeamLabel = (singular: boolean = false) => {
  if (isDriveway) {
    return singular ? 'Edge Thickening' : 'Edge Thickening';
  }
  return singular ? 'Edge Beam' : 'Edge Beams';
};
```

### Testing Checklist

- [ ] Driveway estimator no longer shows "Internal Stiffening Beams" section
- [ ] Driveway estimator shows "Edge Thickening" instead of "Edge Beams"
- [ ] Takeoff for driveway triggers slab + beam workflow
- [ ] Takeoff dialogs show "Edge Thickening" labels for driveway
- [ ] After marking edge thickening, "Finish" button saves without internal beam prompt
- [ ] Edge thickening measurements flow correctly into scope answers
- [ ] Volume calculations work correctly without internal beams

