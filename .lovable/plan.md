

# Plan: Fix Duplicate Mesh Calculation in Waffle Pod Scope

## Problem Identified

The `reinforcement-raft.ts` calculation module is adding mesh **twice** for Waffle Pod slabs:

1. **Generic Slab Surface Loop (lines 175-248)**: Iterates over all `areas` and calculates mesh per area, generating line items like `mesh_{area.id}_bottom`

2. **Waffle Pod Specific Block (lines 513-558)**: Separately calculates "Topping Slab Mesh" and generates a line item with ID `waffle_slab_mesh`

Both calculations run because there's no guard to skip the generic area loop for waffle pods.

---

## Solution

Add a condition to skip the generic per-area mesh calculation when the scope is `waffle_pod`, since waffle pods use a dedicated topping mesh UI and calculation with different coverage options (pod field, full slab, or custom area).

---

## File to Modify

| File | Change |
|------|--------|
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Add waffle pod guard to skip generic mesh loop |

---

## Technical Details

**Current code (lines 175-248)**:
```typescript
if (areas.length > 0) {
  areas.forEach((area) => {
    const reoType = area.reo_type || defaultSlabReoType;
    // ... calculates mesh per area
  });
}
```

**Fixed code**:
```typescript
// Skip generic area mesh for waffle pods - they use dedicated WafflePodToppingMeshInput
const skipGenericAreaMesh = scopeData?.scopeId === 'waffle_pod';

if (areas.length > 0 && !skipGenericAreaMesh) {
  areas.forEach((area) => {
    const reoType = area.reo_type || defaultSlabReoType;
    // ... calculates mesh per area
  });
}
```

This single-line guard ensures:
- **Raft Slab, Standard Slab, Driveway, etc.**: Continue using per-area mesh configuration
- **Waffle Pod**: Only the dedicated topping mesh calculation (lines 513-558) runs, respecting the user's pod field/full slab/custom coverage choice

---

## Verification

After the fix, a Waffle Pod estimate should show only ONE mesh line item in the cost breakdown:
- `Topping SL82 (X sheets, pod field)` — from the dedicated waffle pod block

Not:
- `Slab 1 – SL82 (X sheets)` — from the generic loop (this should no longer appear)

