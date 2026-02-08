
# Auto-Populate Expansion Joint Qty from Takeoff Measurement

## Problem

When a joint measurement comes back from the takeoff (via "Mark on Plans"), the `total_length_m` is saved correctly, but the **quantity (pcs)** field stays at its old value (usually 0). This is because the auto-calculation logic (`Math.ceil(length / 3)`) only runs inside the `MultiExpansionJointInput` component's `updateJoint` function -- which is triggered by UI interactions, not by the state update in `handleJointMarkupComplete`.

## Fix

Add the quantity calculation directly into `handleJointMarkupComplete` in `EstimateFormDialog.tsx`, so that when the measured length flows back from the takeoff, the quantity is calculated at the same time.

### File: `src/components/estimates/EstimateFormDialog.tsx`

**Change** (around lines 1139-1143):

Currently the joint update only sets `total_length_m` and `measured_on_plans`:

```typescript
joints[jointIndex] = {
  ...joints[jointIndex],
  total_length_m: parseFloat(lengthMeters.toFixed(2)),
  measured_on_plans: true,
};
```

Update to also calculate and set quantity (3m per piece):

```typescript
const measuredLength = parseFloat(lengthMeters.toFixed(2));
joints[jointIndex] = {
  ...joints[jointIndex],
  total_length_m: measuredLength,
  measured_on_plans: true,
  quantity: Math.ceil(measuredLength / 3),
};
```

This same change applies to both the expansion joints block (line 1139) and the control joints block (line 1152) -- though control joints don't use quantity in the same way, the expansion joints path is the key fix.

## Summary

- One file changed: `EstimateFormDialog.tsx`
- Two lines updated (expansion joints path + control joints path for consistency)
- The Qty (auto) field will now correctly populate when returning from takeoff measurement
- Works for SOG, Driveway, and Paths/Surrounds scopes since they all flow through the same `handleJointMarkupComplete` handler
