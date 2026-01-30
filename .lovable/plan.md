

# Fix Missing Reinforcement Totals for Strip Footings and Retaining Wall Footings

## Problem Summary
When users create strip footing or retaining wall footing estimates, the reinforcement module shows no cost totals even though the UI displays default trench mesh (L11TM4) selected. The issue is that the calculation module doesn't include these defaults in the cost calculation.

## Root Cause

There's a disconnect between the UI display and the data calculation:

| Component | Behavior |
|-----------|----------|
| **UI** (`FootingSectionReinforcementInput`) | Shows defaults like 'L11TM4' for TM type, using fallback: `group.tm_type \|\| defaultTmType` |
| **Calculation** (`reinforcement-footing.ts`) | Checks raw section data: `s.tm_type` without fallbacks |
| **New sections** (`MultiLinearTypeInput`) | Created without any reinforcement properties (no `tm_type`, `add_ligs`, etc.) |

When users create footing sections and don't explicitly interact with the TM dropdown (because it already shows the desired default), the section data has no `tm_type` set. The calculation module's early return check fails to find any reinforcement:

```javascript
if (!hasAnyTm && !hasAnyHBars && !hasAnyVBars && !hasAnyLigs) {
  return { lineItems: [], subtotal: 0, ... };  // Early return with zero cost!
}
```

## Solution

Modify the calculation module to apply the same defaults that the UI displays. This ensures that what users see matches what gets calculated.

**Changes to `src/lib/estimate-components/modules/reinforcement-footing.ts`:**

1. Update the early return check (lines 91-98) to consider sections that have NO `tm_type` set as using the default 'L11TM4' (not 'none')
2. Update the TM calculation loop (line 125-126) to apply the default TM type when not explicitly set

This approach:
- Maintains backwards compatibility (explicit 'none' still excludes TM)
- Matches UI behavior (what you see is what you get)
- Requires minimal code changes

---

## Technical Details

### File: `src/lib/estimate-components/modules/reinforcement-footing.ts`

**Change 1: Update early return check (lines 91-98)**

Before:
```javascript
const hasAnyTm = sections.length > 0 
  ? sections.some(s => {
      const tmType = s.tm_type;
      return tmType && tmType !== 'none';
    })
  : false;
```

After:
```javascript
const hasAnyTm = sections.length > 0 
  ? sections.some(s => {
      // Use default TM type if not explicitly set or not 'none'
      const tmType = s.tm_type ?? DEFAULT_TM_TYPE;
      return tmType !== 'none';
    })
  : false;
```

**Change 2: Update TM calculation loop (lines 124-126)**

Before:
```javascript
const tmType = section.tm_type;
if (!tmType || tmType === 'none') return;
```

After:
```javascript
// Apply default TM type if not explicitly set
const tmType = section.tm_type ?? DEFAULT_TM_TYPE;
if (tmType === 'none') return;
```

---

## Testing Verification

After implementation:
1. Create a new Strip Footing estimate
2. Add a footing section (e.g., SF1) with length and dimensions
3. Open the Reinforcement module - verify it shows default 'L11TM4' selected
4. **Without changing any reinforcement settings**, verify the Cost Breakdown shows trench mesh line items and a non-zero subtotal
5. Change TM type to 'None' - verify subtotal drops appropriately
6. Repeat for Retaining Wall Footings scope

