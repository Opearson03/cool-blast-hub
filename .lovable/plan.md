

# Fix Reinforcement Pricing for Retaining Wall Footings and Strip Footings

## Problem Summary

The reinforcement pricing for retaining wall footings and strip footings is broken due to several interconnected issues:

1. **Unstable React Keys**: The `FootingSectionReinforcementInput` component uses `groupKey` that includes dimensions in the key, causing component remounts when dimensions change (same issue that was just fixed in `MultiLinearTypeInput`)

2. **Missing Price Initialization for Chairs**: The `useEffect` only initializes TM prices but not chair prices, leaving chair prices at hardcoded defaults

3. **Incorrect Chair Price Conversion**: The code divides bar chair prices by 4 assuming conversion from 100-pack to 25-pack, but TM chairs use a different pack size (25 per bag for TMCHAIR)

4. **Layer Chair Price Not Initialized from Catalog**: Layer chair prices fall back to hardcoded 12.50 instead of looking up from price catalog

---

## Root Cause Analysis

### Issue 1: Unstable React Keys (Critical)

In `FootingSectionReinforcementInput.tsx`, the grouping function creates keys with dimensions:

```typescript
// Line 129: Key includes dimensions - changes when dimensions change
const key = `${typeName}-${width}-${depth}`;
```

This causes the same remounting issue that was just fixed in `MultiLinearTypeInput.tsx`.

### Issue 2: Price Initialization Gap

The `useEffect` at lines 365-399 only initializes TM prices, missing:
- Chair prices (`chair_price_per_bag`)
- Layer chair prices (`layer_chair_price`)
- Chair type-specific pricing from catalog

### Issue 3: Chair Price Calculation Mismatch

At line 946, bar chair prices are divided by 4:
```typescript
chair_price_per_bag: newPrice !== undefined ? newPrice / 4 : 12.50
```

This is incorrect because:
- TMCHAIR in catalog is $12.50 per bag of 25 (no conversion needed)
- Bar chairs (2540C, 5065C, etc.) are priced per bag of 100, so need `/4` to get per-25 price
- The current logic applies `/4` to ALL chair types, including TMCHAIR

### Issue 4: Layer Chair Price Fallback

In `reinforcement-footing.ts` at line 191:
```typescript
layerChairPrice = section.layer_chair_price ?? 12.50;
```

This hardcodes the fallback instead of looking up from the price catalog based on `layer_chair_type`.

---

## Solution

### Phase 1: Fix Unstable React Keys

**File:** `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx`

Use stable keys based on `typeName` only, not dimensions:

```typescript
// groupFootingsByType function - use stable internal key for state tracking
interface FootingTypeGroup {
  // ... existing fields
  stableKey: string;  // Add stable key field
}

// In the grouping function:
groupMap.set(key, {
  // ... existing fields
  stableKey: typeName,  // Use typeName as stable key for React
});

// In the render:
<Collapsible key={group.stableKey} open={openGroups.has(group.stableKey)} ...>
```

### Phase 2: Extend Price Initialization for Chairs

**File:** `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx`

Expand the `useEffect` to initialize chair prices:

```typescript
useEffect(() => {
  if (!priceMap || sections.length === 0) return;
  
  let hasChanges = false;
  const updatedSections = sections.map(section => {
    let updates: Partial<LinearSection> = {};
    
    // Existing TM price initialization...
    
    // Initialize chair prices if chairs enabled and price undefined
    if (section.chairs_enabled && section.chair_price_per_bag === undefined) {
      const chairType = section.chair_type || 'TMCHAIR';
      const catalogPrice = priceMap['consumables']?.[chairType];
      if (catalogPrice !== undefined) {
        // TMCHAIR is per 25, bar chairs are per 100
        const pricePerBagOf25 = chairType === 'TMCHAIR' ? catalogPrice : catalogPrice / 4;
        updates.chair_price_per_bag = pricePerBagOf25;
        hasChanges = true;
      }
    }
    
    // Initialize layer chair prices
    if (section.layer_chairs_enabled && section.layer_chair_price === undefined) {
      const layerChairType = section.layer_chair_type || '2540C';
      const catalogPrice = priceMap['consumables']?.[layerChairType];
      if (catalogPrice !== undefined) {
        updates.layer_chair_price = catalogPrice / 4; // Bar chairs are per 100
        hasChanges = true;
      }
    }
    
    return Object.keys(updates).length > 0 ? { ...section, ...updates } : section;
  });
  
  if (hasChanges) {
    onChange(updatedSections);
  }
}, [priceMap, sections.length]);
```

### Phase 3: Fix Chair Type Selection Price Logic

**File:** `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx`

Update the chair type selection handler (around line 941-947):

```typescript
onValueChange={(val) => {
  const catalogPrice = priceMap?.['consumables']?.[val];
  // TMCHAIR is priced per bag of 25, bar chairs are per bag of 100
  const pricePerBagOf25 = val === 'TMCHAIR' 
    ? catalogPrice 
    : (catalogPrice !== undefined ? catalogPrice / 4 : undefined);
  updateGroupReinforcement(group, { 
    chair_type: val,
    chair_price_per_bag: pricePerBagOf25 ?? 12.50
  });
}}
```

### Phase 4: Fix Layer Chair Price Lookup in Calculation

**File:** `src/lib/estimate-components/modules/reinforcement-footing.ts`

Update layer chair price lookup to use catalog:

```typescript
// Layer chairs (between TM layers)
const tmLayers = section.tm_layers || 1;
if (section.layer_chairs_enabled && tmLayers > 1) {
  const layerChairsPerM = section.layer_chairs_per_m ?? 1;
  const layerChairType = section.layer_chair_type || '2540C';
  // Look up from catalog, divide by 4 for per-25 pricing
  const catalogLayerPrice = getPrice(priceMap, 'consumables', layerChairType, 50) / 4;
  layerChairPrice = section.layer_chair_price ?? catalogLayerPrice;
  totalLayerChairs += Math.ceil(length * layerChairsPerM);
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx` | Fix unstable keys, extend price initialization for chairs, fix chair type selection |
| `src/lib/estimate-components/modules/reinforcement-footing.ts` | Fix layer chair price lookup from catalog |

---

## Technical Details

### Chair Price Categories in Price List

| Item Code | Name | Unit | Default Price |
|-----------|------|------|---------------|
| TMCHAIR | Trench Mesh Supports | /bag (25) | $12.50 |
| 2540C | Barchair 25/40C | /bag (100) | $15.80 |
| 5065C | Barchair 50/65C | /bag (100) | $16.80 |
| 7590C | Barchair 75/90C | /bag (100) | $22.40 |
| 100120C | Barchair 100/120 | /bag (100) | $45.00 |
| 125150C | Barchair 125/150 | /bag (100) | $55.00 |

The calculation divides bag-of-100 prices by 4 to get per-25 price for consistency with TMCHAIR bags.

### Expanded State Tracking

Before fix:
```text
openGroups.has("SF1-450-300") // Dimension-based key
→ Changes when width 450→500, loses expanded state
```

After fix:
```text
openGroups.has("SF1") // Type-name-based stable key
→ Stays consistent regardless of dimension changes
```

---

## Impact

- Strip footings and retaining wall footings will maintain stable UI state when editing dimensions
- Chair prices will be correctly initialized from the price catalog
- Layer chair prices will use catalog values instead of hardcoded defaults
- Bar chair vs TM chair price conversion will be handled correctly
- Existing estimates with explicit prices will be preserved

