

# Bug Audit: All Reported Issues Status and Remaining Fix

## Audit Results

After reviewing every bug from the list against the current codebase, **7 out of 8 issues are already fixed**. Here is the status of each:

| Bug | Status | Evidence |
|-----|--------|----------|
| Waffle Pod Rib Reinforcement | Fixed | `Number(scopeData?.rib_lap_percent ?? 12.5)` on lines 395/469, plus useEffect defaults in WafflePodRibsInput |
| Beam Length Input Glitch | Fixed | `group.typeName` as stable key (line 275), EditableTotalLength for blur-based syncing |
| Chairs in Raft Beams (takeoff) | Fixed | `chairs_enabled: true` set on edge beams (line 1634) and internal beams (line 1651) |
| Raft Concrete - Internal Beams | Working | `scopes.ts` lines 377-388 correctly sums internal beam volume |
| Excavation - Internal Beams | Working | `ModularCalculator.tsx` lines 470-480 calculates from beams array |
| SOG Edge Beam Chairs | Working | `reinforcement-slab.ts` has chair type selection with dynamic bag sizing matching retaining walls |
| Expansion Joints Auto Qty | Working | `total_length_m` field auto-calculates qty via `calculateQuantityFromLength` |
| **Fixed Profit Preset Discrepancy** | **Still a bug** | Double-rounding causes a few dollars difference |

## Remaining Bug: Fixed Profit Preset Discrepancy

### Root Cause

When clicking a preset button (e.g., $5,000), the code:

1. Converts the dollar amount to a percentage: `5000 / subtotal * 100`
2. Rounds the percentage to 2 decimal places: `Math.round(... * 100) / 100`
3. Stores only the rounded percentage

Then `fixedProfitAmount` re-derives the dollar amount:

```
fixedProfitAmount = Math.round(combinedSubtotal * (globalMarginPercent / 100))
```

The re-derived dollar amount can differ by a few dollars due to double-rounding.

**Example:** Subtotal = $23,456
- Click $5,000 preset
- Percentage = 5000 / 23456 * 100 = 21.3173...%
- Rounded percentage = 21.32%
- Re-derived amount = Math.round(23456 * 0.2132) = $4,999 (not $5,000)

### Fix

When a preset button is clicked, store the exact dollar amount and derive the percentage from it with higher precision (no 2dp rounding). The percentage is still the "source of truth" for storage, but we need more decimal places to accurately represent the dollar amount.

**Change the preset onClick** (line 2452):

Currently:
```typescript
setGlobalMarginPercent(Math.round((preset / combinedSubtotal) * 100 * 100) / 100);
```

After -- use more decimal places to preserve accuracy:
```typescript
setGlobalMarginPercent((preset / combinedSubtotal) * 100);
```

By removing the rounding of the percentage, the re-derived `fixedProfitAmount` will be exact (or off by at most $1 due to `Math.round`).

**Also update the manual input onChange** (line 2434) with the same approach:

Currently:
```typescript
setGlobalMarginPercent(Math.round((amount / combinedSubtotal) * 100 * 100) / 100);
```

After:
```typescript
setGlobalMarginPercent((amount / combinedSubtotal) * 100);
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/estimates/EstimateFormDialog.tsx` | Remove 2dp rounding when converting fixed profit to percentage (lines 2434 and 2452) |

## No Downstream Issues Found

The fixes implemented in previous sessions are clean and well-isolated:

- **EditableTotalLength** correctly buffers input during typing and commits on blur/Enter
- **Stable keys** (`typeName`) prevent component remounting without affecting data operations (which use segment IDs)
- **chairs_enabled: true** only affects new takeoff merges; existing saved estimates with explicit values are unaffected
- **Waffle pod rib fix** correctly handles `undefined`, `null`, and explicit `0` values
- **Excavation and concrete volume** calculations both use the same beam array data source, so they stay in sync

