

# Fix: Ensure Concrete Volume Consistently Includes Toe

## Root Cause

The `retaining_wall_footings` scope uses `supportsLinearSections`, which means user input goes through `MultiLinearTypeInput` and `handleLinearSectionsChange`. That handler creates a `footings` array (with toe fields) as a side-effect, but this only happens when the user actively edits a value.

On mount (loading a saved estimate or before user interaction), `scopeAnswers.footings` may be:
- Missing entirely (if linearSections exists but footings was never synced)
- Stale (saved before toe support was added -- no `has_toe`, `toe_width`, `toe_depth` fields)

When `calculateVolume` in `scopes.ts` sees an empty/missing `footings` array, it falls back to `total_length x default width x default depth` -- which has no toe. Meanwhile, the UI shows toe in the volume breakdown because `VolumeBreakdown` reads from `scopeAnswers.footings` which may differ from what `calculateVolume` receives via `derivedScopeAnswers`.

## Fix (2 changes, 1 file)

### 1. Add mount-time sync: linearSections to footings

In `ModularCalculator.tsx`, add a `useEffect` that ensures the `footings` array is always derived from `linearSections` on mount. This mirrors what `handleLinearSectionsChange` does, but runs automatically when the component loads:

```typescript
// Sync linearSections to footings on mount for linear scopes
useEffect(() => {
  if (!scope.supportsLinearSections) return;
  const sections = scopeAnswers.linearSections;
  if (!Array.isArray(sections) || sections.length === 0) return;

  // Always re-derive footings from linearSections to ensure consistency
  const footings = sections.map(s => ({
    id: s.id,
    name: s.name,
    length: s._actualLength && s._actualLength > 0 ? s._actualLength : s.length,
    width: s.dimension1,
    depth: s.dimension2,
    has_toe: s.has_toe,
    toe_width: s.toe_width,
    toe_depth: s.toe_depth,
    _fromTakeoff: s._fromTakeoff,
    _actualLength: s._actualLength,
  }));

  const totalLength = sections.reduce((sum, s) => {
    const len = s._actualLength && s._actualLength > 0 ? s._actualLength : (Number(s.length) || 0);
    return sum + len;
  }, 0);

  setScopeAnswers(prev => ({
    ...prev,
    footings,
    total_length: totalLength,
  }));
}, [scope.supportsLinearSections]); // Only run on mount
```

This ensures that even when loading from saved data, the `footings` array is always fresh and includes toe fields.

### 2. Make calculateVolume also check linearSections as fallback

In `scopes.ts`, update `RETAINING_WALL_FOOTINGS_SCOPE.calculateVolume` to also check `answers.linearSections` if `answers.footings` is empty, mapping `dimension1` to width and `dimension2` to depth:

```typescript
calculateVolume: (answers) => {
  // Check footings first (derived from linearSections by handler)
  let sections = answers.footings || [];

  // Fallback: read directly from linearSections if footings not yet synced
  if (sections.length === 0 && answers.linearSections?.length > 0) {
    sections = answers.linearSections.map((s: any) => ({
      length: s._actualLength && s._actualLength > 0 ? s._actualLength : s.length,
      width: s.dimension1,
      depth: s.dimension2,
      has_toe: s.has_toe,
      toe_width: s.toe_width,
      toe_depth: s.toe_depth,
    }));
  }

  if (sections.length > 0) {
    const volume = sections.reduce((sum, footing) => {
      const length = Number(footing.length) || 0;
      const widthM = (Number(footing.width) || 0) / 1000;
      const depthM = (Number(footing.depth) || 0) / 1000;
      const mainVolume = length * widthM * depthM;

      const hasToe = footing.has_toe === true;
      const toeWidthM = hasToe ? (Number(footing.toe_width) || 0) / 1000 : 0;
      const toeDepthM = hasToe ? (Number(footing.toe_depth) || 0) / 1000 : 0;
      const toeVolume = length * toeWidthM * toeDepthM;

      return sum + mainVolume + toeVolume;
    }, 0);
    return safeVolume(volume);
  }

  // Final fallback
  const length = Number(answers.total_length) || 0;
  const widthM = 600 / 1000;
  const depthM = 400 / 1000;
  return safeVolume(length * widthM * depthM);
},
```

## Why This Fixes Both Concrete and Excavation

- **Concrete**: `calculateVolume` will always find sections with toe data, either from `footings` or `linearSections`
- **Excavation**: The mount-time sync ensures `scopeAnswers.footings` exists with toe fields before `derivedScopeAnswers` runs
- **Pump**: Uses `scopeData.concrete_volume` which comes from `calculateVolume`, so it's automatically fixed

## Risk Assessment

Very low. The mount-time sync mirrors exactly what `handleLinearSectionsChange` already does. The `calculateVolume` fallback to `linearSections` is a safety net that maintains the same math. No existing estimates are affected -- they only gain data consistency.
