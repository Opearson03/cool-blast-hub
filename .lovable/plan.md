
# Fix Footing Chair Selection: Per-LM Quantity & Dynamic Bag Size

## What's Wrong

Two issues with footing chairs:

### 1. Bag size hardcoded to 25
Currently, all chair calculations divide total chair count by 25 to get bag count, and the price label always shows "$/25". But according to the price list:
- **TM Chair (TMCHAIR)**: Bag of **25** -- priced at $12.50/bag
- **All bar chairs (2540C, 5065C, 7590C, etc.)**: Bag of **100** -- priced at $15.80-$67.30/bag

The current `getChairPricePerBag25` helper divides bar chair prices by 4 to normalize them to "per 25", which is confusing and wrong -- a bag of 100 should be treated as a bag of 100.

### 2. Chairs/m input uses decimal steps
The input uses `step="0.1"` with `min="0.5"`. The boss wants users to pick a whole number of chairs per linear meter (1, 2, 3, etc.).

## What Changes

### UI Changes (all 3 footing/section components)

- **Chairs/m input**: Change to integer step (`step="1"`, `min="1"`, `max="10"`) so users pick whole numbers
- **Price label**: Change from static "$/25" to dynamic label showing the actual bag size for the selected chair type (e.g., "$/bag(25)" for TM Chair, "$/bag(100)" for bar chairs)
- **Price value**: Show the actual catalog price per bag (not the divided-by-4 value)

### Calculation Changes

- **Remove `getChairPricePerBag25` normalization**: Store and use the actual catalog price per bag
- **Dynamic bag divisor**: When converting total chairs to bags, divide by the correct bag size (25 for TMCHAIR, 100 for bar chairs) instead of always 25
- **Descriptions**: Show actual bag size in line item descriptions (e.g., "3 x 100" instead of "12 x 25")

### BOQ Changes

Same dynamic bag size logic for the BOQ generator -- use 25 or 100 based on chair type.

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/estimates/calculators/FootingReinforcementInput.tsx` | Update chair UI: integer step for chairs/m, dynamic price label, use actual catalog price |
| `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx` | Same UI changes as above |
| `src/lib/estimate-components/modules/reinforcement-footing.ts` | Use dynamic bag size (25 or 100) based on chair type; stop dividing bar chair prices by 4 |
| `src/lib/boq-generator.ts` | Use dynamic bag size for footing chair and layer chair line items |

### Helper Function Changes

**Replace `getChairPricePerBag25`** in both FootingReinforcementInput and FootingSectionReinforcementInput:

```text
BEFORE (wrong):
  getChairPricePerBag25('5065C') -> $16.80 / 4 = $4.20
  Bags = totalChairs / 25

AFTER (correct):
  getChairCatalogPrice('5065C') -> $16.80
  getBagSize('5065C') -> 100
  Bags = totalChairs / 100
```

New helper: `getChairBagSize(chairType)` returns 25 for TMCHAIR, 100 for all bar chairs (reads from `CHAIR_TYPE_OPTIONS.bagsOf`).

### Chairs/m Input

```text
BEFORE: step="0.1", min="0.5", default=1.4
AFTER:  step="1", min="1", default=1
```

### Price Label

```text
BEFORE: "$/25" (static)
AFTER:  "$/bag" with tooltip or subtext showing bag size
        e.g., Label reads "$/bag(100)" for 5065C, "$/bag(25)" for TMCHAIR
```

### Calculation Module (`reinforcement-footing.ts`)

```text
BEFORE:
  catalogChairPrice = getPrice(...) / 4     -- divides by 4
  bags = Math.ceil(totalChairs / 25)        -- always 25
  description: "Footing TM Chairs (X x 25)"

AFTER:
  catalogChairPrice = getPrice(...)         -- actual catalog price
  bagSize = chairType === 'TMCHAIR' ? 25 : 100
  bags = Math.ceil(totalChairs / bagSize)
  description: "Footing Chairs - 5065C (X x 100)"
```

### BOQ Generator (`boq-generator.ts`)

```text
BEFORE (line 1142):
  const bags = Math.ceil(totalFootingChairs / 25);
  notes: `${bags} x 25 pcs`

AFTER:
  const bagSize = footingChairType === 'TMCHAIR' ? 25 : 100;
  const bags = Math.ceil(totalFootingChairs / bagSize);
  notes: `${bags} x ${bagSize} pcs`
```

Same fix applies to the layer chairs section (lines 1184-1192).

### Data Compatibility

Existing estimates that stored `chair_price_per_bag` as the divided-by-4 value will need handling. On load, if the stored price seems too low relative to the catalog price, the initialization effect will re-fetch the actual catalog price. The `chairs_per_m` value will remain as-is (existing decimals like 1.4 still work, they just won't be settable via the UI anymore).
