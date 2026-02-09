

# Fix: Toe Toggle Not Affecting Volume

## Root Cause

The toe width and depth values shown in the UI are **display-only defaults** that never get written to the actual data.

When the initial section is created (in `ModularCalculator.tsx` line 122), it has no toe fields:
```
{ id: 'section-1', name: 'Section 1', length: 0, dimension1: 450, dimension2: 300 }
```

When the user toggles "Include Toe?" to ON, `updateGroupToe` only sets `has_toe: true` on the section. The `toe_width` and `toe_depth` remain `undefined`.

The UI inputs show **300mm** as a visual fallback (`group.toe_width ?? 300`), but the actual section data still has `undefined` for both values. When `calculateVolume` runs, it gets `Number(undefined) || 0 = 0`, so toe volume is always zero.

## Fix (3 targeted changes, 2 files)

### 1. Set default toe values when toggling has_toe ON

**File:** `src/components/estimates/calculators/MultiLinearTypeInput.tsx` (line 192-200)

Update `updateGroupToe` so that when `has_toe` is toggled to `true`, it also writes `toe_width: 300` and `toe_depth: 300` if those values are currently undefined on the section:

```typescript
const updateGroupToe = (group, field, value) => {
  const updatedSections = sections.map(section => {
    if (matchesGroup(section, group)) {
      const updated = { ...section, [field]: value };
      // When enabling toe, ensure defaults are written to data (not just displayed)
      if (field === 'has_toe' && value === true) {
        if (updated.toe_width == null) updated.toe_width = 300;
        if (updated.toe_depth == null) updated.toe_depth = 300;
      }
      return updated;
    }
    return section;
  });
  onChange(updatedSections);
};
```

This ensures the 300mm defaults shown in the UI are also persisted in the actual data.

### 2. Include toe defaults in initial section for retaining wall scopes

**File:** `src/components/estimates/calculators/ModularCalculator.tsx` (line 121-123)

Update the default linearSection initialisation to include toe fields when the scope supports them:

```typescript
if (scope.supportsLinearSections && !initialScopeAnswers.linearSections) {
  const isRetainingWall = scope.id === 'retaining_wall_footings' || scope.id === 'retaining_walls';
  defaults.linearSections = [{
    id: 'section-1',
    name: 'Section 1',
    length: 0,
    dimension1: 450,
    dimension2: 300,
    ...(isRetainingWall ? { has_toe: false, toe_width: 300, toe_depth: 300 } : {}),
  }];
}
```

This ensures even the very first section has toe fields with proper defaults, matching what `addNewType()` already does (line 247).

### 3. Add safety fallback in handleLinearSectionsChange mapping

**File:** `src/components/estimates/calculators/ModularCalculator.tsx` (line 1250-1261)

When mapping `linearSections` to `footings`, apply default toe values if `has_toe` is true but dimensions are missing:

```typescript
footings: sections.map(s => ({
  id: s.id,
  name: s.name,
  length: s._actualLength && s._actualLength > 0 ? s._actualLength : s.length,
  width: s.dimension1,
  depth: s.dimension2,
  has_toe: s.has_toe,
  toe_width: s.has_toe ? (s.toe_width ?? 300) : s.toe_width,
  toe_depth: s.has_toe ? (s.toe_depth ?? 300) : s.toe_depth,
  _fromTakeoff: s._fromTakeoff,
  _actualLength: s._actualLength,
})),
```

This is a safety net: if `has_toe` is true but toe dimensions are still undefined (e.g., from legacy data), the footings mapping uses 300mm defaults.

## Why This Fixes the Issue

- **Fix 1** addresses the active user interaction: toggling the toe switch now writes real values to the data, not just UI defaults
- **Fix 2** addresses new estimates: the initial section starts with toe fields so they are never undefined
- **Fix 3** addresses legacy data: any existing estimates with `has_toe: true` but missing dimensions get safe defaults in the calculation pipeline

The same safety net pattern should also be applied to the mount-time sync `useEffect` (line 252-262) for consistency.

## Risk Assessment

Very low. All three changes only affect retaining wall footing scopes. They convert display-only defaults into actual data values, which is what the user already expects to happen based on what the UI shows them. No existing calculations change for sections where toe values are already defined.
