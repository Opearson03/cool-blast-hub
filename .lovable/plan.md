
# Plan: Simplify Waffle Pod Dialog to Name-Only Step

## Overview

Remove the "Pods and Accessories" section from the `SlabBeamMarkupDialog` for waffle pods. The pod count cannot be calculated until edge beams are placed (because pods fit inside the beam perimeter). The dialog should simply:
1. Name the waffle pod slab
2. Show area/perimeter
3. Proceed to mark edge beams

All accessory calculations (pods, spacers, chairs) will be handled later in the calculator configure step after beams are placed.

---

## Current State

The dialog currently shows for waffle pods:
- Title: "Pods and Accessories"  
- Slab name input
- Area/perimeter stats
- **Large "Accessories (Estimated Allowances)" section** with:
  - Pod count input (Area ÷ 1.51)
  - 4-Way Spacers input (Pods × 1.4)
  - 2-Way Spacers input (4-Way ÷ 3)
  - TM Chairs input (Perimeter ÷ 1.2)
  - Bar Chairs input (Pods × 3)

---

## Proposed Changes

### 1. Update Dialog Title and Description

| Before | After |
|--------|-------|
| Title: "Pods and Accessories" | Title: "Name Waffle Pod Slab" |
| Description: "Give this waffle pod slab a name, select pod dimensions, then add beams if needed." | Description: "Give this waffle pod slab a name, then mark the edge beams." |

### 2. Remove Accessories Section

Remove the entire amber-bordered "Accessories (Estimated Allowances)" section (lines 531-622) from the waffle pod name step.

### 3. Simplify Waffle Pod Name Step Content

The waffle pod name step will contain only:
- Slab name input
- Area/perimeter stats display

### 4. Remove Related State and Effects

Remove or simplify:
- Local state for accessory counts (`localPodCount`, `localSpacer4Way`, etc.) - no longer needed in this dialog
- The `useEffect` that calculates accessory counts (lines 379-400)
- The `onAccessoryCountsChange` callback usage in skip/start edge beam handlers

### 5. Update Footer Actions

Keep the existing footer for waffle pods:
- **Cancel** - closes dialog
- **Skip All** - saves slab without beams
- **Mark edge beams →** - proceeds to edge beam marking

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx` | Remove accessories section, update title/description, clean up unused state |

---

## Summary

The waffle pod naming dialog becomes a simple, focused step:
1. Name the slab
2. See area/perimeter
3. Proceed to mark beams

All pod counts and accessory calculations will be derived geometrically in the calculator once edge beams are placed and the pod field dimensions are known.
