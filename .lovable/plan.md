

# Plan: Add m³ Rate Pricing Option for Demolition Excavation

## Overview

Add a toggle to allow users to choose between **hourly rate** pricing (current default) and **m³ rate** pricing for excavation in the demolition scope. This gives flexibility for different quoting scenarios.

## Current Implementation

```text
┌─────────────────────────────────────────────────────────┐
│  Is an excavator required?                    [Toggle]  │
├─────────────────────────────────────────────────────────┤
│  Excavator Type:     [3.2T Excavator ▼]                 │
│  Hourly Rate:        [$150 /hr]                         │
│  Hours:              [4 hrs]                            │
│  Float Charge:       [$150]                             │
│                                                         │
│  Total: $750 ($600 hire + $150 float)                   │
└─────────────────────────────────────────────────────────┘
```

**Current calculation:**
`Excavator Cost = (Hours × Hourly Rate) + Float Charge`

## Proposed UI

```text
┌─────────────────────────────────────────────────────────┐
│  Is an excavator required?                    [Toggle]  │
├─────────────────────────────────────────────────────────┤
│  Pricing Method:     [ Hourly Rate ▼ ]                  │
│                      ┌─────────────────┐                │
│                      │ Hourly Rate     │ ← Current      │
│                      │ m³ Rate         │ ← New option   │
│                      └─────────────────┘                │
├─────────────────────────────────────────────────────────┤
│  IF Hourly Rate selected:                               │
│    Excavator Type:   [3.2T Excavator ▼]                 │
│    Hourly Rate:      [$150 /hr]                         │
│    Hours:            [4 hrs]                            │
│    Float Charge:     [$150]                             │
│    Total: $750 ($600 hire + $150 float)                 │
├─────────────────────────────────────────────────────────┤
│  IF m³ Rate selected:                                   │
│    Rate per m³:      [$60 /m³]                          │
│    Volume:           2.40 m³ (auto-calculated)          │
│    Float Charge:     [$150]                             │
│    Total: $294 ($144 excavation + $150 float)           │
└─────────────────────────────────────────────────────────┘
```

## Technical Changes

### File 1: `src/lib/estimate-components/modules/demolition.ts`

**Add new question fields:**
- `excavator_pricing_method`: select with options 'hourly' (default) and 'm3'
- `excavator_m3_rate`: currency field with default $60/m³

**Update calculate function:**
- Check `excavator_pricing_method`
- If 'hourly': use existing logic (hours × rate)
- If 'm3': calculate as `totalVolume × m3Rate`

**Add price list key:**
- Add `priceListKey: 'excavation.EXC_M3'` for the m³ rate

---

### File 2: `src/lib/price-list-defaults.ts`

**Add new price list item:**
```typescript
{ category: 'excavation', item_code: 'EXC_M3', item_name: 'Excavation Rate per m³', unit: '/m³', default_price: 60 },
```

---

### File 3: `src/components/estimates/calculators/MultiDemolitionInput.tsx`

**Add new props:**
- `excavatorPricingMethod?: string`
- `onExcavatorPricingMethodChange?: (method: string) => void`
- `excavatorM3Rate?: number`
- `onExcavatorM3RateChange?: (rate: number) => void`
- `totalVolume: number` (pass calculated volume for display)

**Update UI:**
- Add "Pricing Method" select dropdown
- Conditionally show hourly inputs OR m³ inputs based on selection
- Display calculated volume when m³ method is selected
- Update total calculation display

---

### File 4: `src/components/estimates/calculators/ModuleSection.tsx`

**Update component wiring:**
- Pass new props to MultiDemolitionInput
- Read/write new answer fields

---

## Calculation Logic

### Hourly Method (existing)
```
Excavator Cost = (excavator_hours × excavator_rate) + excavator_float
```

### m³ Method (new)
```
Volume = sum of all demolition areas (length × width × thickness)
Excavator Cost = (totalVolume × excavator_m3_rate) + excavator_float
```

## Line Item Display

### Hourly Method
```
EXC 3.2T Excavator (4 hrs @ $150/hr)    4 hrs    $150    $600
```

### m³ Method  
```
Excavation (2.4 m³ @ $60/m³)            2.4 m³   $60     $144
```

## Files to Change

| File | Change |
|------|--------|
| `src/lib/estimate-components/modules/demolition.ts` | Add pricing method toggle, m³ rate field, update calculate() |
| `src/lib/price-list-defaults.ts` | Add EXC_M3 price list item |
| `src/components/estimates/calculators/MultiDemolitionInput.tsx` | Add pricing method UI and m³ rate input |
| `src/components/estimates/calculators/ModuleSection.tsx` | Wire new props to MultiDemolitionInput |

## Default Behavior

- Default pricing method: **Hourly Rate** (maintains backward compatibility)
- Default m³ rate: **$60/m³** (as requested)
- Float charge applies to both methods

