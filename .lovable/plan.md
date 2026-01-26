

## Add Per-Type Toe to Retaining Wall Footings

### Overview
Add a `toe` property to each retaining wall footing type, allowing different footing types (RF1, RF2, etc.) to have their own toe dimension. Remove the redundant global "Retaining Wall Footing Dimensions" questions (average footing width, average footing depth, and toe length).

### Current State
- **Global questions**: The `RETAINING_WALL_FOOTINGS_SCOPE` has global questions for `footing_width`, `footing_depth`, and `toe_length` that apply to all footings
- **Per-type dimensions**: `MultiLinearTypeInput` already handles per-type `dimension1` (width) and `dimension2` (depth)
- **Database support**: The `takeoff_markups` table already has a `toe_mm` column
- **Prefill support**: The `useTakeoffMarkups` hook already maps `toe_mm` to a `toe` property

### Changes Required

#### 1. Update `LinearSection` Type (`types.ts`)

Add `toe` property to the `LinearSection` interface:

```typescript
export interface LinearSection {
  // ... existing props
  
  /** Toe length in mm for retaining wall footings (distance footing extends beyond wall face) */
  toe?: number;
  
  // ... rest of props
}
```

#### 2. Update `MultiLinearTypeInput` Component

Add toe input field for retaining wall footing scopes:

- Add `showToe` prop or detect from `scopeId === 'retaining_wall_footings'`
- Add toe to the group interface: `LinearTypeGroup` should track `toe` dimension
- Update `groupLinearByType` to include toe in grouping key (since different toes = different types)
- Display a "Toe" input field in the type header alongside Width and Depth
- Update `addNewType` to include default toe value (300mm) for retaining wall footings
- Update `updateGroupDimensions` to handle toe updates

#### 3. Update Scope Definition (`scopes.ts`)

Remove redundant global questions from `RETAINING_WALL_FOOTINGS_SCOPE`:

- Remove `footing_width` question (handled per-type)
- Remove `footing_depth` question (handled per-type)
- Remove `toe_length` question (now handled per-type)

Update `calculateVolume` to use per-section toe values (toe adds to excavation width, not concrete volume).

#### 4. Update Volume/Excavation Calculations

The toe affects excavation width but not the footing concrete volume. Update calculations in:

- `ModularCalculator.tsx`: Update excavation calculation for retaining wall footings to include toe
- The formwork module may also need to account for toe formwork

### Technical Details

**Toe dimension logic:**
- Toe extends beyond the wall face on one side of the footing
- Excavation width = footing width + toe length
- Concrete volume = length × width × depth (no toe addition - the width already includes the heel)
- Formwork = both sides of footing (may vary based on toe configuration)

**Grouping with toe:**
```typescript
// Updated grouping key to include toe
const key = `${typeName}-${section.dimension1}-${section.dimension2}-${section.toe || 0}`;
```

**UI Layout:**
```
[RF1]  Width: [600] mm  Depth: [400] mm  Toe: [300] mm  Total: 12.5m  Vol: 3.0m³
  └─ RF1-1: 5.2m
  └─ RF1-2: 7.3m
```

### Files to Modify

1. **`src/lib/estimate-components/types.ts`**
   - Add `toe?: number` to `LinearSection` interface

2. **`src/components/estimates/calculators/MultiLinearTypeInput.tsx`**
   - Add toe to `LinearTypeGroup` interface
   - Update `groupLinearByType` to include toe
   - Add toe input field for `retaining_wall_footings` scope
   - Update `addNewType` with default toe for retaining wall footings
   - Add `updateGroupToe` function to update all segments in a type

3. **`src/lib/estimate-components/scopes.ts`**
   - Remove `footing_width`, `footing_depth`, and `toe_length` questions from `RETAINING_WALL_FOOTINGS_SCOPE`
   - Keep only `total_length` as a derived/summary field

4. **`src/components/estimates/calculators/ModularCalculator.tsx`**
   - Update excavation calculation to use per-section dimensions including toe

### Testing Checklist

- [ ] New retaining wall footing types get default toe of 300mm
- [ ] Toe input appears in type header for retaining wall footings only
- [ ] Changing toe updates all segments within that type
- [ ] Types with different toes are grouped separately
- [ ] Takeoff data with toe_mm is correctly mapped to sections
- [ ] Excavation calculations include toe dimension
- [ ] No global "Average Width/Depth/Toe" questions appear in the scope

