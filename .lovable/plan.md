
# Add Waffle Pod Pricing to Standard Price List

## Overview

This plan adds the waffle pod items to the master price list and updates the pods calculation module to properly pull prices from the centralized price list. The items include:

| Code | Description | Unit | Price |
|------|-------------|------|-------|
| POD150 | Waffle Pod 1090 x 1090 x 150 | /pod | $16.00 |
| POD225 | Waffle Pod 1090 x 1090 x 225 | /pod | $18.70 |
| POD300 | Waffle Pod 1090 x 1090 x 300 | /pod | $24.30 |
| POD375 | Waffle Pod 1090 x 1090 x 375 | /pod | $33.00 |
| POD4 | 4-Way Spacer Bag (25 units) | /bag | $59.00 |
| POD2 | 2-Way Spacer Bag (20 units) | /bag | $66.00 |
| PODRAIL | Pod Rail 40mm 550mm Bag (20 units) | /bag | $26.60 |

---

## Changes Required

### 1. Add New Category to Price List Structure

**File:** `src/lib/price-list-defaults.ts`

Add a new `waffle_pods` category to `PRICE_LIST_CATEGORIES`:

```typescript
{ id: 'waffle_pods', label: 'Waffle Pods' },
```

Add the 7 new items to `DEFAULT_PRICE_LIST`:

```typescript
// Waffle Pods
{ category: 'waffle_pods', item_code: 'POD150', item_name: 'Waffle Pod 1090 x 1090 x 150', unit: '/pod', default_price: 16 },
{ category: 'waffle_pods', item_code: 'POD225', item_name: 'Waffle Pod 1090 x 1090 x 225', unit: '/pod', default_price: 18.70 },
{ category: 'waffle_pods', item_code: 'POD300', item_name: 'Waffle Pod 1090 x 1090 x 300', unit: '/pod', default_price: 24.30 },
{ category: 'waffle_pods', item_code: 'POD375', item_name: 'Waffle Pod 1090 x 1090 x 375', unit: '/pod', default_price: 33 },
{ category: 'waffle_pods', item_code: 'POD4', item_name: '4-Way Spacer Bag 25', unit: '/bag', default_price: 59 },
{ category: 'waffle_pods', item_code: 'POD2', item_name: '2-Way Spacer Bag 20', unit: '/bag', default_price: 66 },
{ category: 'waffle_pods', item_code: 'PODRAIL', item_name: 'Pod Rail 40mm 550mm Bag 20', unit: '/bag', default_price: 26.60 },
```

---

### 2. Update CSV Price List

**File:** `src/data/default-price-list.csv`

Add lines at end (or grouped with other categories):

```csv
waffle_pods,POD150,Waffle Pod 1090 x 1090 x 150,/pod,16.00
waffle_pods,POD225,Waffle Pod 1090 x 1090 x 225,/pod,18.70
waffle_pods,POD300,Waffle Pod 1090 x 1090 x 300,/pod,24.30
waffle_pods,POD375,Waffle Pod 1090 x 1090 x 375,/pod,33.00
waffle_pods,POD4,4-Way Spacer Bag 25,/bag,59.00
waffle_pods,POD2,2-Way Spacer Bag 20,/bag,66.00
waffle_pods,PODRAIL,Pod Rail 40mm 550mm Bag 20,/bag,26.60
```

---

### 3. Update Pods Module to Use Price List

**File:** `src/lib/estimate-components/modules/pods.ts`

#### A. Update Pod Unit Price Question

Change the `priceListKey` to reference the new category and make it depth-aware:

```typescript
{
  id: 'pod_unit_price',
  type: 'currency',
  label: 'Pod Unit Price',
  defaultValue: 18.70,  // POD225 as default
  priceListKey: 'waffle_pods.POD225',  // Updated category
  showIf: (answers) => answers.include_pod_supply === true,
},
```

#### B. Update Pod Rail Price Question

```typescript
{
  id: 'pod_rail_price',
  type: 'currency',
  label: 'Pod Rail Price (per bag of 20)',
  defaultValue: 26.60,
  priceListKey: 'waffle_pods.PODRAIL',  // Updated category
  showIf: (answers) => answers.include_pod_rails === true,
},
```

#### C. Add Spacer Price List Keys

Update the spacer questions to reference the price list:

```typescript
{
  id: 'spacer_4way_price',
  type: 'currency',
  label: '4-Way Spacer Price (per bag of 25)',
  defaultValue: 59,
  priceListKey: 'waffle_pods.POD4',
  showIf: (answers) => answers.include_spacers === true,
},
{
  id: 'spacer_2way_price',
  type: 'currency',
  label: '2-Way Spacer Price (per bag of 20)',
  defaultValue: 66,
  priceListKey: 'waffle_pods.POD2',
  showIf: (answers) => answers.include_spacers === true,
},
```

#### D. Update Calculation Logic for Depth-Based Pod Pricing

In the `calculate` function, look up pod price by depth:

```typescript
// Map pod thickness to price list code
const getPodPriceCode = (thickness: string): string => {
  const thicknessNum = parseInt(thickness);
  if (thicknessNum <= 150) return 'POD150';
  if (thicknessNum <= 225) return 'POD225';
  if (thicknessNum <= 300) return 'POD300';
  return 'POD375';
};

// In multi-zone calculation
Object.entries(podsByThickness).forEach(([thickness, data]) => {
  if (data.count > 0) {
    const podCode = getPodPriceCode(thickness);
    const podPrice = getPrice(priceMap, 'waffle_pods', podCode, 18.70);
    // ... rest of calculation
  }
});
```

#### E. Update Spacer Calculations for Bag Quantities

Currently, spacers are counted individually but priced per bag. Update to calculate bags needed:

```typescript
// 4-way spacers: 25 per bag
const spacer4WayBags = Math.ceil(totalSpacer4Way / 25);
const spacer4WayBagPrice = Number(answers.spacer_4way_price) || getPrice(priceMap, 'waffle_pods', 'POD4', 59);
const spacer4WayCost = spacer4WayBags * spacer4WayBagPrice;

// 2-way spacers: 20 per bag
const spacer2WayBags = Math.ceil(totalSpacer2Way / 20);
const spacer2WayBagPrice = Number(answers.spacer_2way_price) || getPrice(priceMap, 'waffle_pods', 'POD2', 66);
const spacer2WayCost = spacer2WayBags * spacer2WayBagPrice;
```

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/lib/price-list-defaults.ts` | Add `waffle_pods` category and 7 items |
| `src/data/default-price-list.csv` | Add 7 CSV rows for waffle pod items |
| `src/lib/estimate-components/modules/pods.ts` | Update questions with priceListKeys, add depth-based pod pricing, convert spacers to bag quantities |

---

## Impact

After implementation:
- Users can customize waffle pod prices in Settings > My Price List
- Pod prices will vary by depth (150mm, 225mm, 300mm, 375mm)
- Spacers will be quoted as bags (not individual units)
- Pod rails will reference the correct bag price
- Existing users will need to click "Sync" to get the new items
