
## Add Three New Scopes to the V2 Estimating Wizard

### Overview
Three new concrete scopes will be added exclusively to the V2 wizard (demo business only). Because the new scope IDs won't be offered in the V1 `ScopeSelector`, they are safe additions to the shared files — existing users will never encounter them.

### The Three New Scopes

**1. Pool Surround** — identical to Slab on Ground but with a "cutout" subtraction feature at takeoff. In real world use: you draw the full outer rectangle around the pool area, then draw the pool shape as a cutout — the net area (outer minus pool) is what gets estimated.

**2. Kerb** — near-identical to Strip Footings but with different default dimensions (narrower and shallower, appropriate for kerbing). Uses the same `reinforcement-footing` and `excavation` modules with linear section inputs.

**3. Insitu Walls** — near-identical to Strip Footings but defaults to wall-appropriate dimensions (taller/thinner). Includes formwork on both faces (which kerb/footings don't), so it uses the `formwork` module and the `architectural-formwork` module to cover both-face forming costs.

---

### Files to Change

**1. `src/components/estimates/ScopeSelector.tsx`** — Add 3 new scope IDs to the `ScopeType` union and 3 new entries to `SCOPE_OPTIONS`:

```typescript
// Updated ScopeType union (add to existing):
| "pool_surround"
| "kerb"
| "insitu_walls"
```

New scope options added to the `external` category for pool surround, and a new `walls` category (or appended to `foundations`) for kerb and insitu walls.

**2. `src/lib/estimate-components/scopes.ts`** — Add 3 new `ScopeDefinition` exports and register them in `SCOPE_REGISTRY`:

- **`POOL_SURROUND_SCOPE`**: Copies `STANDARD_SLAB_SCOPE` exactly (same `moduleIds`, same `calculateVolume`, same questions). Adds `supportsCutouts: true` flag (a new optional property on `ScopeDefinition`) to signal to the V2 takeoff canvas that a "Draw Cutout" option should be available after an area is marked. The cutout area is subtracted from the measured gross area before being written back to `scopeAnswers.area`.

- **`KERB_SCOPE`**: Copies `STRIP_FOOTINGS_SCOPE` structure. Different defaults: width 300mm, depth 150mm (kerb profile). Same `moduleIds` as strip footings. `linearSectionsLabel` set to `'Kerb Sections'`.

- **`INSITU_WALLS_SCOPE`**: Copies `STRIP_FOOTINGS_SCOPE` structure with wall-appropriate defaults: width 200mm, depth 2400mm (floor-to-ceiling). Adds `'formwork'` and `'architectural-formwork'` to `moduleIds` (formwork both faces). `linearSectionsLabel` set to `'Wall Sections'`.

**3. `src/types/takeoff.ts`** — Add the new scope IDs to the correct classification arrays:
- `pool_surround` → add to `AREA_SCOPES` and `SLAB_WITH_BEAMS_SCOPES` (it supports edge beams like SOG)
- `kerb` → add to `LINEAR_SCOPES`
- `insitu_walls` → add to `LINEAR_SCOPES`

**4. `src/components/estimates/EstimateFormDialogV2.tsx`** — Three changes:
- Add the 3 new scopes to the hard-coded `scopeTotals` record (lines ~541–554)
- Add the 3 new scopes to the `migrateLegacyScopeData` switch block (no-op cases — they have no legacy data to migrate)
- In the `getActiveModulesFromScopes` function, ensure new scopes are handled (they are already handled generically via `SCOPE_REGISTRY` lookup, so no explicit change is needed here)

**5. `src/lib/scope-labels.ts`** — Add the 3 new label entries:
```typescript
pool_surround: "Pool Surround",
kerb: "Kerb",
insitu_walls: "Insitu Walls",
```

---

### Cutout Feature for Pool Surround (Takeoff)

The cutout is implemented in `PlanTakeoffStep.tsx` (V2 only — since `EstimateFormDialogV2.tsx` renders `PlanTakeoffStep`, and V1 renders the same component, the cutout logic in `PlanTakeoffStep` is gated by the scope ID `pool_surround`):

When `activeScope === 'pool_surround'` and the user has already marked the main area, a **"Draw Cutout"** button appears in the scope checklist. Clicking it sets `activeTool` to `'polygon'` or `'rectangle'` with a special `isCutout` flag. When that polygon is completed:
- Its area is computed from the pixels/meter scale (same as normal markups)
- A new `markup_type: 'cutout'` record is saved to `takeoff_markups` with the same `scope_id: 'pool_surround'`
- The net area = gross area − cutout area is what gets synced to `scopeAnswers.area`

The `TakeoffMarkup` interface needs `'cutout'` added to the `markup_type` union:
```typescript
markup_type?: 'primary' | 'edge_beam' | 'internal_beam' | 'thickening' | 'cutout';
```

The `ScopeMarkupChecklist` component shows cutout markups under pool surround entries with a label like "Pool cutout — 42.5 m²" and allows them to be deleted.

In `useTakeoffMarkups.ts`, `getAreaForScope('pool_surround')` subtracts any cutout areas from the primary area total, so the auto-fill to `scopeAnswers.area` is already net.

---

### Technical Summary

| File | Change |
|---|---|
| `ScopeSelector.tsx` | +3 types to union, +3 entries to `SCOPE_OPTIONS` |
| `scopes.ts` | +3 `ScopeDefinition` exports, +3 entries to `SCOPE_REGISTRY` |
| `types/takeoff.ts` | Add new IDs to classification arrays; add `'cutout'` to `markup_type` |
| `EstimateFormDialogV2.tsx` | Add 3 new scopes to `scopeTotals` record |
| `scope-labels.ts` | +3 label entries |
| `PlanTakeoffStep.tsx` | Cutout drawing mode when scope is `pool_surround` |
| `useTakeoffMarkups.ts` | Subtract cutout areas from net area for `pool_surround` |
| `ScopeMarkupChecklist.tsx` | Show cutout entries in pool surround checklist |

No database schema changes are needed — the existing `markup_type` column already stores arbitrary strings.
