
# Fix Concrete Volume with Wastage for Pumping Module

## Problem Summary

When concrete wastage is configured in the Concrete Supply module (e.g., 10% wastage), the Concrete Pumping module does not include this wastage in its per-m³ charge calculation.

**Example:**
- Base volume: 1 m³
- Wastage: 10%
- Concrete Supply correctly orders: 1.1 m³
- Pumping module incorrectly charges for: 1 m³ (should be 1.1 m³)

This affects all scopes that use both the concrete-supply and concrete-pumping modules.

---

## Root Cause

The `scopeData` object passed to modules contains only the base `concrete_volume`. The wastage percentage is stored in the concrete-supply module's answers but is not accessible to the pumping module.

```text
scopeData = {
  concrete_volume: 1.0,  // Base volume only
  ...
}

concrete-supply module answers = {
  wastage_percent: 10,   // Not accessible to pumping module
  ...
}
```

---

## Solution

### Phase 1: Extend scopeData with Module Answers

**File:** `src/components/estimates/calculators/ModularCalculator.tsx`

Include `moduleAnswers` in the `scopeData` object so any module can access settings from other modules when needed:

```typescript
const scopeData = useMemo(() => {
  return {
    ...derivedScopeAnswers,
    volume: scopeVolume,
    concrete_volume: scopeVolume,
    scopeId: scope.id,
    moduleAnswers: moduleAnswers,  // NEW: Include all module answers
  };
}, [derivedScopeAnswers, scopeVolume, scope.id, moduleAnswers]);
```

### Phase 2: Update Pumping Module to Use Wastage

**File:** `src/lib/estimate-components/modules/concrete-pumping.ts`

Update the pumping calculation to read the wastage percentage from the concrete-supply module and apply it:

```typescript
// Per m³ charge - apply wastage from concrete-supply module
const volume = Number(scopeData.concrete_volume) || Number(scopeData.volume) || 0;

// Get wastage from concrete-supply module answers (default 10%)
const concreteSupplyAnswers = scopeData.moduleAnswers?.['concrete-supply'] || {};
const wastagePercent = Number(concreteSupplyAnswers.wastage_percent) || 10;
const volumeWithWastage = volume * (1 + wastagePercent / 100);

if (volume > 0) {
  const roundedVolume = roundUpToM3(volumeWithWastage);  // Use wastage-adjusted volume
  const m3Rate = Number(answers.m3_rate) || getPrice(priceMap, 'pumping', 'PUMP M3', 8);
  const m3Cost = roundedVolume * m3Rate;

  lineItems.push({
    id: 'pump_per_m3',
    description: `Pumping Charge (${roundedVolume} m³ incl. wastage)`,
    quantity: roundedVolume,
    unit: 'm³',
    unitPrice: m3Rate,
    total: Math.round(m3Cost * 100) / 100,
    category: 'plant',
  });
  subtotal += m3Cost;
}
```

Also update the pump recommendation logic at the top of the calculate function to use volume with wastage for determining pump size.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/ModularCalculator.tsx` | Add `moduleAnswers` to `scopeData` object |
| `src/lib/estimate-components/modules/concrete-pumping.ts` | Read `wastage_percent` from concrete-supply module and apply to volume calculations |

---

## Before / After

**Before (Incorrect):**
| Item | Value |
|------|-------|
| Base Volume | 1.0 m³ |
| Wastage | 10% |
| Concrete Supply | 1.1 m³ |
| Pumping Charge | 1.0 m³ |

**After (Correct):**
| Item | Value |
|------|-------|
| Base Volume | 1.0 m³ |
| Wastage | 10% |
| Concrete Supply | 1.1 m³ |
| Pumping Charge | 1.1 m³ |

---

## Impact

- All scopes using concrete-supply and concrete-pumping modules will now have consistent volume calculations
- Pumping charges will accurately reflect the actual volume being pumped (including wastage)
- No changes to default wastage percentage (remains 10%)
- Existing estimates with custom wastage settings will be respected
