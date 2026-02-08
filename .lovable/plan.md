

# Fix Waffle Pod Rib Reinforcement Disappearing

## Problem

Rib reinforcement for waffle pods produces zero line items because of a NaN propagation bug in the lap percentage calculation.

### Root Cause

In `reinforcement-raft.ts`, the legacy single-zone path (line 469) uses:

```typescript
const ribLapPercent = Number(scopeData?.rib_lap_percent) ?? 12.5;
```

When the user accepts the default 12.5% lap in the UI without explicitly editing it, `rib_lap_percent` is never written to `scopeAnswers` -- it stays `undefined`.

- `Number(undefined)` produces `NaN`
- `NaN ?? 12.5` evaluates to `NaN` (nullish coalescing only catches `null`/`undefined`, not `NaN`)
- `NaN` propagates through the entire rib calculation, causing all bar lengths and weights to be `NaN`
- The guard `bottomTotalLength > 0` evaluates to `false` for `NaN`, so **no rib line items are ever pushed**

The same unsafe pattern exists on line 395 for the multi-zone path, though it's less likely to trigger since zones carry explicit defaults.

### Why it appears "lost"

The rib UI in `WafflePodRibsInput` displays the correct default (12.5%) using `numericWithDefault()`, giving the impression the value is set. But the display default is never persisted to `scopeAnswers` unless the user actively edits the field. The calculation reads from a different source (raw `scopeData`) using a different defaulting mechanism that breaks with `NaN`.

## Fix

Two changes:

### 1. Fix NaN-safe defaulting in reinforcement-raft.ts

**Line 469** (legacy single-zone path):

Before:
```typescript
const ribLapPercent = Number(scopeData?.rib_lap_percent) ?? 12.5;
```

After:
```typescript
const ribLapPercent = Number(scopeData?.rib_lap_percent ?? 12.5);
```

This moves `??` inside the `Number()` call, so `undefined ?? 12.5` produces `12.5` before `Number()` is applied. A value of `0` still passes through correctly (`0 ?? 12.5` = `0`).

**Line 395** (multi-zone path):

Before:
```typescript
const zoneLapPercent = zone.rib_lap_percent ?? Number(scopeData?.rib_lap_percent) ?? 12.5;
```

After:
```typescript
const zoneLapPercent = zone.rib_lap_percent ?? Number(scopeData?.rib_lap_percent ?? 12.5);
```

Same fix applied for consistency and safety.

### 2. Pre-populate rib defaults in WafflePodRibsInput on mount

Add a `useEffect` to `WafflePodRibsInput.tsx` that writes the display defaults into `scopeData` if they haven't been set yet. This ensures the calculation always has concrete values, not just the UI.

```typescript
useEffect(() => {
  const defaults: Record<string, any> = {
    rib_bottom_bars: 1,
    rib_bottom_bar_size: 'N12',
    rib_top_bars: 0,
    rib_top_bar_size: 'N12',
    stock_length: '6',
    rib_lap_percent: 12.5,
  };
  
  let hasChanges = false;
  for (const [key, defaultVal] of Object.entries(defaults)) {
    if (scopeData?.[key] === undefined || scopeData?.[key] === null) {
      onScopeDataChange(key, defaultVal);
      hasChanges = true;
    }
  }
}, []); // Run once on mount
```

This ensures that even before the user interacts with any rib field, all rib parameters are persisted in `scopeAnswers` and available to the calculation.

## Files Modified

| File | Change |
|------|--------|
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Fix `Number(x) ?? default` to `Number(x ?? default)` on lines 395 and 469 |
| `src/components/estimates/calculators/WafflePodRibsInput.tsx` | Add useEffect to pre-populate rib defaults into scopeData on mount |

## Impact

- Rib reinforcement will calculate correctly even when the user doesn't explicitly edit any rib settings
- Existing estimates with explicitly set values are unaffected (the `??` still respects explicit `0`)
- Multi-zone estimates are also protected from the same NaN issue
- No database changes required

