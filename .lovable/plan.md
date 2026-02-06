

# Plan: Add m³ Rate Pricing Option for Detailed Excavation (All Scopes)

## Overview

Extend the m³ rate pricing option from the demolition scope to the main **excavation module** that serves all other scopes (piers, pad footings, strip footings, raft slab, standard slab, etc.). Users will be able to choose between hourly rate pricing and m³ rate pricing for detailed excavation.

## Current Implementation

The excavation module currently only supports hourly pricing for detailed excavation:

```text
┌─────────────────────────────────────────────────────────┐
│  Detailed excavation required?                [Toggle]  │
├─────────────────────────────────────────────────────────┤
│  Estimated Volume:    ~2.40 m³                          │
│  Machine:             [3.2T Excavator ▼]                │
│  Hourly Rate:         [$150 /hr]                        │
│  Hours:               [4 hrs]                           │
│  Float Charge:        [$150]                            │
│                                                         │
│  Total: $750                                            │
└─────────────────────────────────────────────────────────┘
```

## Proposed UI

```text
┌─────────────────────────────────────────────────────────┐
│  Detailed excavation required?                [Toggle]  │
├─────────────────────────────────────────────────────────┤
│  Estimated Volume:    ~2.40 m³                          │
│  Pricing Method:      [ Hourly Rate ▼ ]                 │
│                       ┌─────────────────┐               │
│                       │ Hourly Rate     │ ← Current     │
│                       │ m³ Rate         │ ← New option  │
│                       └─────────────────┘               │
├─────────────────────────────────────────────────────────┤
│  IF Hourly Rate selected:                               │
│    Machine:           [3.2T Excavator ▼]                │
│    Hourly Rate:       [$150 /hr]                        │
│    Hours:             [4 hrs]                           │
│    Float Charge:      [$150]                            │
│    Total: $750                                          │
├─────────────────────────────────────────────────────────┤
│  IF m³ Rate selected:                                   │
│    Rate per m³:       [$60 /m³]                         │
│    Volume:            2.40 m³                           │
│    Float Charge:      [$150]                            │
│    Total: $294 ($144 excavation + $150 float)           │
└─────────────────────────────────────────────────────────┘
```

## Affected Scopes

This change will apply to all scopes using the excavation module:

| Scope | Excavation Type | Volume Source |
|-------|-----------------|---------------|
| Piers | Detailed | Pier groups (π × r² × depth) |
| Pad Footings | Detailed | Pad groups (L × W × D) |
| Strip Footings | Detailed | Linear sections (L × W × D) |
| Retaining Wall Footings | Detailed | Linear sections + toe |
| Standard Slab | Bulk + Detailed | Edge/internal beam thickening |
| Raft Slab | Bulk + Detailed | Edge/internal beams below slab |
| Driveway | Bulk + Detailed | Edge thickening |
| Crossovers | Bulk + Detailed | Edge thickening |
| Paths & Surrounds | Bulk + Detailed | Edge thickening |

Note: Waffle Pod is excluded from detailed excavation (flat bottom - no below-slab elements).

---

## Technical Changes

### File 1: `src/lib/estimate-components/modules/excavation.ts`

**Add new question fields for detailed excavation:**

```typescript
{
  id: 'detailed_pricing_method',
  type: 'select',
  label: 'Detailed excavation pricing method',
  options: [
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'm3', label: 'm³ Rate' },
  ],
  defaultValue: 'hourly',
  showIf: (answers) => answers.detailed_excavation_required === true,
},
{
  id: 'detailed_m3_rate',
  type: 'currency',
  label: 'Excavation rate per m³',
  defaultValue: 60,
  priceListKey: 'excavation.EXC_M3',
  unit: '/m³',
  showIf: (answers) => 
    answers.detailed_excavation_required === true && 
    answers.detailed_pricing_method === 'm3',
},
```

**Conditionally show hourly inputs only when hourly method is selected:**
- Update `showIf` for `detailed_machine_type`, `detailed_machine_rate`, and `detailed_excavation_hours` to check for `detailed_pricing_method !== 'm3'`

**Update calculate function:**
- Check `detailed_pricing_method`
- If 'hourly' (default): use existing logic (hours × rate)
- If 'm3': calculate using `excavation_volume × m3_rate` from scope data

**Update validate function:**
- Only validate hourly inputs when hourly method is selected

---

### File 2: `src/components/estimates/calculators/ModuleSection.tsx`

No changes required - the excavation module renders its questions via the standard module question renderer, not a custom component like MultiDemolitionInput.

---

## Calculation Logic

### Hourly Method (existing)
```
Detailed Excavation Cost = (hours × hourly_rate) + float_charge
```

### m³ Method (new)
```
Volume = excavation_volume from scopeData (calculated per scope type)
Detailed Excavation Cost = (volume × m3_rate) + float_charge
```

The volume is already calculated and displayed in the `detailed_excavation_volume` derived field, which sources from:
- `scopeData.excavation_volume` (pre-calculated in scope)
- OR calculated from `pierGroups`, `linearSections`, `padGroups` as appropriate

---

## Line Item Display

### Hourly Method
```
Detailed Excavation - EXC 3.2T (4 hrs)    4 hrs    $150    $600
Float Charge to Site                      1 item   $150    $150
```

### m³ Method
```
Detailed Excavation (2.40 m³ @ $60/m³)    2.4 m³   $60     $144
Float Charge to Site                      1 item   $150    $150
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/estimate-components/modules/excavation.ts` | Add pricing method select, m³ rate field, update showIf for hourly fields, update calculate(), update validate() |

---

## Price List

The `EXC_M3` price list item already exists from the demolition implementation:
```typescript
{ category: 'excavation', item_code: 'EXC_M3', item_name: 'Excavation Rate per m³', unit: '/m³', default_price: 60 }
```

No additional price list changes required.

---

## Default Behavior

- Default pricing method: **Hourly Rate** (maintains backward compatibility)
- Default m³ rate: **$60/m³** (sourced from existing price list)
- Float charge: Applies to both methods
- Auger options: Only shown for hourly method (auger doesn't make sense for m³ pricing)

