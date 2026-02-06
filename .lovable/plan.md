
# Fix: "Raft Slab" Text Showing in Slab on Ground Scope

## Problem

In the takeoff measurement dialog, when working with a **Slab on Ground** (standard_slab) scope and adding edge thickening, the description text reads:

> "Raft slabs typically have thickened edge beams around the perimeter."

This is incorrect -- it should reference Slab on Ground / edge thickening terminology, not raft slabs.

## Root Cause

The description text uses a 3-way condition:

```text
if isDriveway    -> "Driveways can have thickened edges..."
else if isWafflePod -> "Waffle pod slabs have edge beams..."
else             -> "Raft slabs typically have thickened edge beams..."  <-- fallback
```

Standard Slab, Crossovers, and Paths/Surrounds all fall into the **else** branch and incorrectly get the raft slab text, even though they are "edge thickening" scopes with their own terminology.

## Fix

Update the condition to use the existing `isEdgeThickeningScope` flag (which already correctly covers standard_slab, driveway, crossovers, and paths_surrounds) and provide appropriate text for each group:

```text
if isEdgeThickeningScope -> "Slabs can have thickened edges around the perimeter."
else if isWafflePod      -> "Waffle pod slabs have edge beams around the perimeter."
else (raft_slab)         -> "Raft slabs typically have thickened edge beams around the perimeter."
```

## Files to Change

| File | Lines | Change |
|------|-------|--------|
| `src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx` | ~542-547 | Update the description condition to check `isEdgeThickeningScope` first |
| `src/components/estimates/takeoff/panels/SlabBeamMarkupPanel.tsx` | ~406-410 | Same fix in the panel version |

Both files have the identical 3-way ternary that needs updating. The fix reorders the condition so edge thickening scopes (including SOG, driveway, crossovers, paths) get their own appropriate text, waffle pod keeps its text, and only raft slab falls through to the raft-specific description.
