

# Fix Raft Beam Chairs Not Auto-Including from Takeoff

## Problem

When raft slab beams come from the takeoff ("Mark on Plans"), they are created with only basic properties: `id`, `name`, `length`, `width`, `depth`, and `_fromTakeoff`. The `chairs_enabled` property is not set, so it defaults to `false`/undefined.

In the reinforcement calculation (`reinforcement-raft.ts`), both edge beam chairs (line 624) and internal beam chairs (line 693) check `if (!beam.chairs_enabled) return;` -- which skips every beam that came from takeoff.

This is the same class of issue as the internal beams not flowing through: takeoff-created data is missing a property that the calculation requires.

**Comparison with SOG**: The SOG module (`reinforcement-slab.ts`) uses a module-level toggle (`answers.edge_tm_chairs`) for chairs, so this issue doesn't affect SOG/driveway/paths scopes.

## Fix

Set `chairs_enabled: true` as a default when creating beam objects from takeoff data. This ensures chairs auto-calculate with sensible defaults (TMCHAIR type, 1.4 chairs/m) for beams that came from plan markups.

### File: `src/components/estimates/EstimateFormDialog.tsx`

**Change 1** -- Edge beams from takeoff (around line 1627-1634):

Currently:
```typescript
edgeBeams: allEdgeBeams.map((b) => ({
  id: b.id,
  name: b.name,
  length: parseFloat(b.length.toFixed(2)),
  width: b.width,
  depth: b.depth,
  _fromTakeoff: true,
})),
```

Add `chairs_enabled: true`:
```typescript
edgeBeams: allEdgeBeams.map((b) => ({
  id: b.id,
  name: b.name,
  length: parseFloat(b.length.toFixed(2)),
  width: b.width,
  depth: b.depth,
  _fromTakeoff: true,
  chairs_enabled: true,
})),
```

**Change 2** -- Internal beams from takeoff (around line 1643-1650):

Currently:
```typescript
beams: allInternalBeams.map((b) => ({
  id: b.id,
  name: b.name,
  length: parseFloat(b.length.toFixed(2)),
  width: b.width,
  depth: b.depth,
  _fromTakeoff: true,
})),
```

Add `chairs_enabled: true`:
```typescript
beams: allInternalBeams.map((b) => ({
  id: b.id,
  name: b.name,
  length: parseFloat(b.length.toFixed(2)),
  width: b.width,
  depth: b.depth,
  _fromTakeoff: true,
  chairs_enabled: true,
})),
```

## How It Works

- When beams arrive from takeoff with `chairs_enabled: true`, the reinforcement calculation in `reinforcement-raft.ts` will no longer skip them at the `if (!beam.chairs_enabled) return;` check
- Default chair values apply automatically: TMCHAIR type, 1.4 chairs per metre, catalog price from price list
- The user can still toggle chairs OFF per-beam in the BeamReinforcementInput UI if they don't want them
- Existing saved estimates with beams that already have `chairs_enabled` explicitly set will not be affected

## Files Modified

| File | Change |
|------|--------|
| `src/components/estimates/EstimateFormDialog.tsx` | Add `chairs_enabled: true` to both edge beam and internal beam objects created from takeoff data |

## Impact

- Raft slab beams from takeoff will now automatically include chairs in the cost calculation
- Users can still disable chairs per-beam if needed
- No database changes required
- Only affects new takeoff merges; existing saved estimates are unchanged

