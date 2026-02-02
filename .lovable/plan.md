

# Fix 2-Way Spacers Missing from Waffle Pod Cost Breakdown

## Problem Summary

2-way spacers are not appearing in the waffle pod cost breakdown despite the estimate having 715 pods. The cost breakdown shows:
- Waffle Pods 225mm (715 units) – Zone 1: $13,370.50
- Pod Rails (72 bags of 20): $3,240.00  
- 4-Way Spacers (29 bags of 25): $72.50
- **2-Way Spacers: MISSING**

## Root Cause Analysis

The issue is a multi-level data flow problem:

### 1. Initial Data Setup Problem (`EstimateFormDialog.tsx`)

When waffle pod estimates are created from takeoff data:

```typescript
// Lines 1433-1442
const spacer4WayCount = firstArea?.spacer4WayCount ?? 0;
const spacer2WayCount = firstArea?.spacer2WayCount ?? 0;  // ← Defaults to 0

initialScopeAnswers = {
  ...initialScopeAnswers,
  spacer_4way_count: spacer4WayCount,
  spacer_2way_count: spacer2WayCount,  // ← Explicitly set to 0
```

If the takeoff doesn't provide `spacer2WayCount`, it defaults to `0` and is explicitly set in `initialScopeAnswers`.

### 2. WafflePodConfigInput Effect Timing (`WafflePodConfigInput.tsx`)

The component has a `useEffect` that should auto-calculate spacers:

```typescript
// Lines 63-90
useEffect(() => {
  if (lastCalculatedRef.current.podCount === podCount && 
      lastCalculatedRef.current.perimeter === perimeter) {
    return;  // ← Skips if values haven't changed
  }
  
  if (podCount > 0) {
    const spacer2Way = Math.ceil(insidePerimeter / 1.2);
    onScopeDataChange('spacer_2way_count', spacer2Way);
  }
}, [podCount, perimeter, ...]);
```

**Issue**: This effect may not re-trigger if:
- Initial mount has `podCount > 0` but `perimeter = 0`
- Later when `perimeter` becomes available, the ref check skips because `podCount` didn't change

### 3. Pods Module Calculation (`pods.ts`)

The module tries to calculate 2-way spacers with a fallback:

```typescript
// Lines 243-244 (legacy path)
const calculated2Way = Math.ceil(Math.max(0, perimeter - 1.6) / 1.2);
const spacer2WayCount = Number(scopeData?.spacer_2way_count) || calculated2Way;
```

**Issue**: `Number(0) || calculated2Way` uses `calculated2Way` because `0` is falsy. But if `perimeter` is also `0` or not properly set, `calculated2Way` is also `0`.

### 4. Multi-Zone Path Issue (`pods.ts`)

For multi-zone waffle pods (which the screenshot shows), each zone needs its own perimeter:

```typescript
// Lines 135-137
const zonePerimeter = Number(zone._actualPerimeter ?? zone.perimeter) || 0;
const calculated2Way = Math.ceil(Math.max(0, zonePerimeter - 1.6) / 1.2);
totalSpacer2Way += Number(zone.spacer_2way_count) || calculated2Way;
```

**Issue**: `zone.perimeter` is never set because zones are created without perimeter values.

## Solution

### Fix 1: Always Recalculate Spacers When Area Data Exists (`WafflePodConfigInput.tsx`)

Remove the skip condition that prevents recalculation:

```typescript
useEffect(() => {
  // Remove the early return check - always recalculate when podCount > 0
  if (podCount > 0) {
    const spacer4Way = podCount;
    const edgeBeamWidth = Number(scopeData?.edgeBeams?.[0]?.width) || 450;
    const insidePerimeter = Math.max(0, perimeter - (8 * edgeBeamWidth / 1000));
    const spacer2Way = Math.ceil(insidePerimeter / 1.2);
    
    // Only update if values actually differ (prevent infinite loops)
    if (scopeData?.spacer_4way_count !== spacer4Way) {
      onScopeDataChange('spacer_4way_count', spacer4Way);
    }
    if (scopeData?.spacer_2way_count !== spacer2Way) {
      onScopeDataChange('spacer_2way_count', spacer2Way);
    }
    // ... pod rails
  }
}, [podCount, perimeter, scopeData?.edgeBeams, scopeData?.spacer_4way_count, scopeData?.spacer_2way_count, onScopeDataChange]);
```

### Fix 2: Use Top-Level Perimeter as Fallback in Pods Module (`pods.ts`)

When zones don't have perimeter, fall back to the scope-level perimeter divided by number of zones:

```typescript
// Multi-zone path - get scope-level perimeter as fallback
const scopePerimeter = Number(scopeData?._actualPerimeter ?? scopeData?.perimeter) || 0;

podZones.forEach(zone => {
  // ...
  // Use zone perimeter if set, otherwise proportionally divide scope perimeter
  const zonePerimeter = Number(zone._actualPerimeter ?? zone.perimeter) || 
    (scopePerimeter / podZones.length);
  // ...
});
```

### Fix 3: Remove Explicit Zero Default in EstimateFormDialog (`EstimateFormDialog.tsx`)

Don't explicitly set spacer counts to 0 - let them be undefined so the calculation fallback works:

```typescript
// Change from:
const spacer2WayCount = firstArea?.spacer2WayCount ?? 0;

// To:
const spacer2WayCount = firstArea?.spacer2WayCount; // undefined if not set

initialScopeAnswers = {
  ...initialScopeAnswers,
  pod_count: podCount,
  ...(spacer4WayCount !== undefined && { spacer_4way_count: spacer4WayCount }),
  ...(spacer2WayCount !== undefined && { spacer_2way_count: spacer2WayCount }),
  // ...
};
```

### Fix 4: Ensure Perimeter Flows to Calculation (`ModularCalculator.tsx`)

Add `_actualPerimeter` at the top level of `derivedScopeAnswers` for waffle pod calculations:

```typescript
return {
  ...scopeAnswers,
  area: totalArea,
  perimeter: totalPerimeter,
  _actualPerimeter: totalPerimeter,  // ← Add this for modules that check _actualPerimeter first
  // ...
};
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/estimates/calculators/WafflePodConfigInput.tsx` | Remove skip condition, add proper value comparison |
| `src/lib/estimate-components/modules/pods.ts` | Add scope-level perimeter fallback for zones |
| `src/components/estimates/EstimateFormDialog.tsx` | Remove explicit zero defaults for spacer counts |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Add `_actualPerimeter` to top-level derivedScopeAnswers |

## Testing

After implementing the fix:
1. Create a new waffle pod estimate from takeoff
2. Verify 2-way spacers appear in the Pods module cost breakdown
3. Verify count matches formula: `(perimeter / 1.2)` approximately
4. Test with manual entry (no takeoff) to ensure fallback works
5. Edit existing estimate with 715 pods and verify 2-way spacers now appear

