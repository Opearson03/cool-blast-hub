

# Fix Expansion Joints: 3m Pieces, Not 25m Rolls

## Problem

The expansion joint system is fundamentally miscalculating because it treats joints as **25m rolls** when they're actually **3m pieces** (sticks). This causes:

1. **Wrong quantity**: Total length / 25 = too few "rolls" instead of total length / 3 = correct number of 3m pieces
2. **Wrong price**: The price key resolves to `EXJ10060` (non-existent 6m variant, falls back to $35) instead of `EXJ10030` ($95/piece)
3. **Wrong labels**: UI shows "rolls" everywhere instead of "joints" or "pcs"

### How the bug happens

The constant `ROLL_LENGTH_M = 25` propagates through the system:
- New joint `length` is set to `String(25 * 1000)` = `'25000'`
- The price lookup builds key `EXJ100` + (`'25000' === '3000' ? '30' : '60'`) = `EXJ10060` -- doesn't exist in price list, so falls back to $35
- Quantity is calculated as `Math.ceil(totalLength / 25)` instead of `Math.ceil(totalLength / 3)`

### What the price list actually says

| Code | Description | Price |
|------|-------------|-------|
| EXJ10030 | Expansion Joint 100mm 3000mm R12 - 300mm Dowel 335/c | $95.00/each |
| EXJ12530 | Expansion Joint 125mm 3000mm R16 - 450mm Dowel 450/c | $119.30/each |
| EXJ15030 | Expansion Joint 150mm 3000mm R16 - 450mm Dowel 450/c | $156.90/each |
| EXJ20030 | Expansion Joint 200mm 3000mm R24 - 450mm Dowel 450/c | $217.80/each |

These are 3m pieces, priced per piece. The joint product itself includes integrated dowels at the specified centres. The separate "Dowels Required" toggle is for additional doweling into existing concrete -- that flow is correct and unchanged.

### Scopes affected

All scopes that include `connections-joints`: SOG (Standard Slab), Driveway, Crossovers, Paths and Surrounds. These scopes already have the module in their `moduleIds` -- no scope changes needed.

---

## Solution

### 1. Change the piece length constant

Replace `ROLL_LENGTH_M = 25` with `PIECE_LENGTH_M = 3` (3m joint pieces).

### 2. Fix default joint creation

When adding a new joint:
- Set `length: '3000'` (3m pieces) instead of `'25000'`
- This makes the price key resolve correctly to `EXJ10030` = $95

### 3. Fix quantity calculation

Change from `Math.ceil(totalLength / 25)` to `Math.ceil(totalLength / 3)`.

### 4. Update all UI labels

| Location | Before | After |
|----------|--------|-------|
| Header badge | "X rolls x 100mm" | "X pcs x 100mm" |
| Quantity label | "Quantity (auto)" | "Qty (pcs)" |
| Auto-calc text | "X rolls needed (Ym / 25m per roll)" | "X joints needed (Ym / 3m per joint)" |

### 5. Fix fallback price in calculation module

In `connections-joints.ts`, update the fallback from `35` to `95` so even without a price map, the number is sensible.

### 6. Foam section: unchanged

The foam section correctly uses 25m rolls -- that's a different product (expansion foam rolls). No change needed there.

### 7. Capping: auto-corrects

Capping calculates `cappingLength = quantity x (jointLengthMM / 1000)`. Once `jointLengthMM` is `'3000'` instead of `'25000'`, the capping length calculation fixes itself (e.g., 10 pieces x 3m = 30m of capping).

---

## Technical Details

### Files to modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/MultiExpansionJointInput.tsx` | Replace `ROLL_LENGTH_M=25` with `PIECE_LENGTH_M=3`; update `addJoint` default `length` to `'3000'`; fix `calculateQuantityFromLength` divisor; update all "roll" labels to "joint"/"pcs" |
| `src/lib/estimate-components/modules/connections-joints.ts` | Update fallback price from `35` to `95`; update line item description to clarify "3m joints" |

### Specific code changes

**MultiExpansionJointInput.tsx:**

1. Line 34: `const PIECE_LENGTH_M = 3;` (was `ROLL_LENGTH_M = 25`)
2. Line 146: `Math.ceil(totalLengthM / PIECE_LENGTH_M)` (was `/ ROLL_LENGTH_M`)
3. Line 159: `length: '3000'` (was `String(ROLL_LENGTH_M * 1000)`)
4. Line 161: `price_each: getJointPrice(defaultDepth, '3000', priceMap)` (now resolves to `EXJ10030` = $95)
5. Line 200: `calculateQuantityFromLength(totalLength)` stays the same (just uses updated divisor)
6. Line 336: Badge text: `{joint.quantity} pcs` (was "rolls")
7. Line 427: Auto-calc text: `joints needed (Xm / 3m per joint)` (was "rolls needed ... per roll")
8. Line 436-439: Quantity label: remove "(auto)" suffix when measured, keep otherwise
9. Line 779: Foam label stays "Number of Rolls (25m each)" -- foam IS sold in 25m rolls, no change

**connections-joints.ts:**

1. Line 67: Fallback `getPrice(priceMap, 'joints_expansion', priceListKey, 95)` (was `35`)
2. Line 72: Description: `Expansion Joints ${jointLabel} x 3m (${jointQty} pcs)` -- clearer

### Data compatibility

Existing estimates that stored `length: '25000'` will still work for price lookups (the key builder handles both `'3000'` and `'6000'`, and anything else falls to the `'60'` path). The quantity won't auto-recalculate until the user re-enters total length -- this is acceptable since editing the estimate re-triggers the calculation.

