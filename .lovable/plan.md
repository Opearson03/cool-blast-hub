
# Exposed Aggregate Calculation Fix

## Overview
The exposed aggregate calculation in the Surface Finishing module needs to be changed from a per-square-meter rate to a drum-based calculation, and the additional wash-off labour needs to be removed since it will be included in the pour labour.

---

## Current Behavior (Problem)

The existing calculation works as follows:

```text
Current Logic:
┌─────────────────────────────────────────────────────────────┐
│ Retarder Cost = Area (m²) × Rate ($/m²)                     │
│ Example: 140m² × $8/m² = $1,120                             │
│                                                             │
│ + Wash-off Labour = Hours × Crew × Labour Rate              │
│ Example: 2 hrs × 2 men × $75/hr = $300                      │
│                                                             │
│ Total: $1,420                                               │
└─────────────────────────────────────────────────────────────┘
```

**Issues:**
1. Retarder is priced per m² rather than per drum
2. Separate wash-off labour is being added (should be in pour labour)

---

## Desired Behavior

```text
New Logic:
┌─────────────────────────────────────────────────────────────┐
│ Coverage: 80m² per drum                                     │
│ Drum Rate: $150 per drum                                    │
│                                                             │
│ Drums Required = ROUNDUP(Area / 80)                         │
│ Example: 140m² → ROUNDUP(140/80) = ROUNDUP(1.75) = 2 drums  │
│                                                             │
│ Retarder Cost = 2 drums × $150 = $300                       │
│                                                             │
│ NO separate wash-off labour (included in pour labour)       │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Changes

### File: `src/lib/estimate-components/modules/surface-finishing.ts`

#### 1. Replace Exposed Aggregate Questions (lines 110-137)

**Remove:**
- `exposed_retarder_rate` (currency, per m²)
- `exposed_wash_labour_hours` (number)
- `exposed_wash_crew_size` (number)

**Add:**
- `exposed_retarder_drum_price` - Price per drum (default: $150)
- `exposed_retarder_coverage` - Coverage rate (default: 80 m²/drum, read-only derived)
- `exposed_retarder_drums_required` - Auto-calculated drums (derived, editable override)

#### 2. Update Calculate Function (lines 355-387)

**Remove:**
- The entire wash-off labour calculation block (lines 372-386)

**Modify:**
- Change retarder calculation from `area × rate` to `drums × drum_price`
- Drums = `Math.ceil(area / 80)`

#### 3. Add Price List Entry

**File:** `src/lib/price-list-defaults.ts`

Add new entry for retarder drums:
```typescript
{ category: 'materials', item_code: 'RETARDER_DRUM', item_name: 'Exposed Aggregate Retarder (20L Drum)', unit: '/drum', default_price: 150 },
```

---

## Detailed Code Changes

### Questions Section (Replace lines 110-137)

```typescript
// ═══════════════════════════════════════════════════════════════
// EXPOSED AGGREGATE - Drum-based (no separate labour)
// ═══════════════════════════════════════════════════════════════
{
  id: 'exposed_retarder_drum_price',
  type: 'currency',
  label: 'Retarder price per drum',
  helpText: '20L drum covers ~80m²',
  defaultValue: 150,
  priceListKey: 'materials.RETARDER_DRUM',
  showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
},
{
  id: 'exposed_retarder_drums_required',
  type: 'number',
  label: 'Drums required',
  helpText: 'Auto-calculated: 80m² per drum',
  min: 1,
  unit: 'drums',
  showIf: (answers) => answers.finish_required === true && answers.finish_type === 'exposed_aggregate',
  deriveFrom: (scopeData, moduleAnswers) => {
    const area = Number(moduleAnswers?.finish_area) || Number(scopeData.area) || 0;
    const coveragePerDrum = 80; // 80m² per drum
    return Math.ceil(area / coveragePerDrum) || 1;
  },
  derivedReadOnly: false,
},
```

### Calculate Function (Replace lines 355-387)

```typescript
// EXPOSED AGGREGATE - Drum-based
if (answers.finish_type === 'exposed_aggregate') {
  const drumPrice = Number(answers.exposed_retarder_drum_price) || 
    getPrice(priceMap, 'materials', 'RETARDER_DRUM', 150);
  const drumsNeeded = Number(answers.exposed_retarder_drums_required) || 
    Math.ceil(area / 80) || 1;
  const retarderCost = drumsNeeded * drumPrice;

  lineItems.push({
    id: 'exposed_retarder',
    description: `Exposed Aggregate Retarder (${drumsNeeded} drums for ${area}m² @ 80m²/drum)`,
    quantity: drumsNeeded,
    unit: 'drums',
    unitPrice: drumPrice,
    total: retarderCost,
    category: 'materials',
  });
  subtotal += retarderCost;

  // NO wash-off labour - included in pour labour
}
```

---

## Summary of Changes

| Change | Before | After |
|--------|--------|-------|
| Pricing model | $8/m² | $150/drum |
| Coverage | N/A | 80m² per drum |
| Rounding | N/A | Round up (ceiling) |
| Example (140m²) | $1,120 + labour | $300 (2 drums) |
| Wash-off labour | Separate line item | Removed (in pour labour) |

---

## Files to Modify

1. **`src/lib/estimate-components/modules/surface-finishing.ts`**
   - Replace exposed aggregate questions
   - Update calculate function
   
2. **`src/lib/price-list-defaults.ts`**
   - Add `RETARDER_DRUM` price list entry

---

## Validation

After implementation, verify:
- [ ] Entering 140m² results in 2 drums @ $150 = $300 total
- [ ] Entering 80m² results in 1 drum @ $150 = $150 total
- [ ] Entering 81m² results in 2 drums @ $150 = $300 total (rounding up)
- [ ] No wash-off labour line item appears
- [ ] Drum price can be overridden manually
- [ ] Drum count can be overridden manually
