

# Remove Pod Rails from Formwork Module

## Problem

Pod rails are being priced **twice** in waffle pod estimates:
1. In the **Pods module** (`pods.ts`) -- where they belong, with proper toggle controls and depth-based logic
2. In the **Formwork module** (`formwork.ts`) -- where they don't belong, duplicating the cost

## Fix

Remove the pod rails block from `src/lib/estimate-components/modules/formwork.ts` (lines 119-137). The pods, spacers, and supply-related items remain in formwork as they are gated by the "supplied by concreter" toggle, but pod rails are already fully handled in the Pods module with better logic (toggle, price override, per-zone aggregation).

## Technical Details

### File: `src/lib/estimate-components/modules/formwork.ts`

Remove lines 118-137 (the pod rails section inside the waffle pod block):

```
// Pod Rails (always included if required, regardless of supply question)
const podRailsRequired = scopeData?.pod_rails_required === true;
const podRailPacks = Number(scopeData?.pod_rail_packs) || 0;

if (podRailsRequired && podRailPacks > 0) {
  ...
}
```

The closing brace for the `isWafflePod` block stays. No other changes needed -- the Pods module already handles pod rails with:
- A user toggle (`include_pod_rails`)
- An editable price field (`pod_rail_price`)
- Per-zone aggregation for multi-zone waffle slabs
- Proper exclusion text when toggled off

