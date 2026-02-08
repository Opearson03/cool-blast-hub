

# Fix Input Typing Glitches in Beam and Linear Type Inputs

## Problem

Two distinct bugs cause inputs to glitch when typing:

### Bug 1: Component remounts when editing width/depth (MultiBeamTypeInput only)

In `MultiBeamTypeInput.tsx`, the React `key` for each beam group is `group.groupKey`, which includes dimensions:

```text
groupKey = "EB1-450-450"
```

When you type into the Width or Depth field (e.g. changing 450 to 4500):
1. `onChange` fires, updating all segments in the group
2. `useMemo` recalculates groups with new dimensions
3. The `groupKey` changes from `"EB1-450-450"` to `"EB1-4500-450"`
4. React sees a new key, so it **unmounts the old component and mounts a new one**
5. The input loses focus mid-typing

Additionally, `expandedTypes` stores the old `groupKey`, so the section collapses after the remount.

`MultiLinearTypeInput.tsx` already fixed this -- it uses `group.typeName` as the stable key (line 353). `MultiBeamTypeInput` needs the same fix.

### Bug 2: Total Length input reformats on every keystroke (both files)

Both files use this pattern for the Total Length input:

```tsx
value={group.totalLength > 0 ? group.totalLength.toFixed(2) : ""}
```

When you type "5", the state updates, the component re-renders, and `toFixed(2)` reformats it to "5.00" -- overwriting what you just typed and jumping the cursor. This also happens because `updateGroupTotalLength` scales segments proportionally with rounding, so the recomputed total may not even match what was typed.

## Solution

### Change 1: Stable React keys in MultiBeamTypeInput (lines 92, 104, 268-276)

Switch from `group.groupKey` to `group.typeName` for:
- The React `key` on the Collapsible
- The `expandedTypes` Set
- The `toggleExpand` and `deleteGroup` operations

This mirrors the pattern already used in `MultiLinearTypeInput` (line 353).

Also update `updateGroupDimensions` to continue using segment IDs (it already does this, so no change needed there).

### Change 2: Local state for Total Length inputs (both files)

Replace the computed `.toFixed(2)` value binding with a local-state pattern that only syncs on blur:

```tsx
// Instead of directly binding the computed total:
// value={group.totalLength.toFixed(2)}

// Use a local ref/state per group that holds the raw text:
// - On focus: snapshot current computed total into local state
// - While typing: only update local state (no parent re-render)
// - On blur: parse and push to parent via updateGroupTotalLength
```

This is the standard React pattern for preventing "controlled input reformatting" glitches.

Implementation: Create a small `EditableTotalLength` sub-component that manages its own local state and calls the parent's update handler on blur/Enter.

## Files Modified

| File | Change |
|------|--------|
| `src/components/estimates/calculators/MultiBeamTypeInput.tsx` | 1. Use `group.typeName` as stable key instead of `group.groupKey`. 2. Add `EditableTotalLength` sub-component for blur-based syncing. |
| `src/components/estimates/calculators/MultiLinearTypeInput.tsx` | Add same `EditableTotalLength` sub-component for blur-based syncing on Total Length input (line 464). |

## How the EditableTotalLength works

```text
User focuses input
  --> snapshot group.totalLength into local state as string

User types "12.5"
  --> only local state updates, no parent re-render, no reformatting

User blurs or presses Enter
  --> parse "12.5" to number, call updateGroupTotalLength(group, 12.5)
  --> parent re-renders with new proportional segment lengths

User doesn't change value and blurs
  --> no-op, no unnecessary update
```

## Impact

- Width/depth inputs in beam types will no longer lose focus or collapse when typing
- Total Length inputs in both beam types and linear types will no longer reformat mid-keystroke
- No data changes -- purely a UI fix
- No database changes required

