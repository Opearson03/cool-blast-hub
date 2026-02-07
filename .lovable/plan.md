

# Fix: Waffle Pod Rib Lap Percentage Not Working

## Problem

When you change the lap % in the Rib Reinforcement section, it has no effect on the calculation. The cost stays the same no matter what value you enter.

## Root Cause

The lap % input writes to `scopeData.rib_lap_percent` (top-level), but the calculation reads from `zone.rib_lap_percent` (inside each zone object). Since zones never have this property set, the calculation always falls back to 12.5% regardless of user input.

## Fix (2 files, 3 changes)

### 1. Calculation fallback -- `reinforcement-raft.ts`

In the multi-zone calculation path, fall back to the top-level `scopeData.rib_lap_percent` when the zone doesn't have its own value:

**Line 394:**
```
// Before
const zoneLapMultiplier = 1 + (Number(zone.rib_lap_percent) || 12.5) / 100;

// After
const zoneLapPercent = zone.rib_lap_percent ?? Number(scopeData?.rib_lap_percent) ?? 12.5;
const zoneLapMultiplier = 1 + zoneLapPercent / 100;
```

Also fix the legacy single-zone path to use `??` instead of `||` (so 0% would work if ever needed):

**Line 467:**
```
// Before
const ribLapMultiplier = 1 + (Number(scopeData?.rib_lap_percent) || 12.5) / 100;

// After
const ribLapPercent = Number(scopeData?.rib_lap_percent) ?? 12.5;
const ribLapMultiplier = 1 + ribLapPercent / 100;
```

### 2. Zone default -- `MultiWafflePodZoneInput.tsx`

Add `rib_lap_percent: 12.5` to the `DEFAULT_ZONE` constant so new zones start with the correct default:

**Line 45-57:**
```
const DEFAULT_ZONE: Omit<WafflePodZone, 'id' | 'name'> = {
  ...existing fields...
  rib_lap_percent: 12.5,    // <-- add this
};
```

## Summary

- The 12.5% default stays the same
- Changing the lap % input will now actually update the rib reinforcement cost
- Works for both single-zone and multi-zone waffle pod estimates
- No database changes needed

