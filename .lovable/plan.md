
# Plan: Apply Waffle Pod Industry Calculations Throughout the Estimator

## Overview
This plan will implement the industry-standard waffle pod formulas you provided across multiple parts of the estimate system - from the takeoff dialog, through the calculator modules, to the BOQ generation.

## Formulas to Implement

### Accessory Calculations (Already Partially Implemented)
| Item | Formula | Current Status |
|------|---------|----------------|
| Waffle Pods | Area ÷ 1.51 | Done in takeoff dialog |
| 4-Way Spacers | Pods × 1.40 | Done in takeoff dialog |
| 2-Way Spacers | 4-Way Spacers ÷ 3 | Done in takeoff dialog |
| Trench Mesh Chairs | Perimeter Beam Length ÷ 1.2 | Not implemented |
| Bar Chairs (25/40) | Pods × 3 | Not implemented |

### Reinforcement Calculations (New)
| Item | Formula |
|------|---------|
| Y-Bar (Rib Reinforcement) | (Pods × 2.3) ÷ 5.5 = qty of 6m lengths |
| Trench Mesh / Y-Bar (Edge Beams) | Edge Beam Length ÷ 5.5 = qty of 6m sheets/lengths |
| Slab Mesh | Area ÷ 12.5 = qty of sheets |

### Concrete Calculations (New)
These replace the current volumetric calculation with industry empirical rates:

| Slab Height | Divisor (m³ per m²) |
|-------------|---------------------|
| 260mm | 8.35 |
| 310mm | 7.80 |
| 385mm | 6.93 |
| 460mm | 6.30 |
| 610mm | 5.00 |

**Formula**: (Area ÷ divisor) + (Edge Beam Length × 0.15m × 0.15m) + (Edge Beam Length × Total Height × 0.05m) + 3% wastage

---

## Technical Implementation

### 1. Update Takeoff Dialog: Add Trench Mesh Chairs
**File**: `src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx`

Add a new auto-calculated field for trench mesh chairs based on perimeter:
```
Trench Mesh Chairs = Perimeter ÷ 1.2
```

This will be displayed in the "Accessories (Auto-calculated)" section alongside pods and spacers.

### 2. Update Waffle Pod Scope: Add Bar Chairs Calculation
**File**: `src/lib/estimate-components/scopes.ts`

Add a new question for waffle pod bar chairs:
```typescript
{
  id: 'waffle_bar_chairs_count',
  type: 'number',
  label: 'Bar Chairs (25/40)',
  helpText: 'Auto-calculated: Pods × 3',
}
```

### 3. Create Waffle Pod Concrete Volume Calculation
**File**: `src/lib/estimate-components/scopes.ts`

Update `WAFFLE_POD_SCOPE.calculateVolume` to use the industry empirical rates:
- Map pod thickness to total slab height (pod thickness + top slab thickness)
- Use the corresponding divisor from the lookup table
- Add edge beam contribution: Length × 0.15m × 0.15m + Length × Height × 0.05m
- Apply 3% wastage

### 4. Update Reinforcement Module for Waffle Pod
**File**: `src/lib/estimate-components/modules/reinforcement-raft.ts`

Add waffle-pod-specific calculations when `scopeId === 'waffle_pod'`:

**Slab Mesh Calculation**:
```typescript
const meshSheets = Math.ceil(area / 12.5);
```

**Y-Bar (Rib Reinforcement)**:
```typescript
const yBarLengths = Math.ceil((podCount * 2.3) / 5.5);
```

**Trench Mesh Chairs (Edge Beams)**:
```typescript
const tmChairs = Math.ceil(edgeBeamLength / 1.2);
```

**Bar Chairs (Slab)**:
```typescript
const barChairs = podCount * 3;
```

### 5. Update ModularCalculator Auto-Calculations
**File**: `src/components/estimates/calculators/ModularCalculator.tsx`

Extend the existing `useEffect` for waffle pod to also auto-calculate:
- `waffle_bar_chairs_count` = podCount × 3
- `waffle_tm_chairs_count` = perimeterLength ÷ 1.2

### 6. Update BOQ Generator
**File**: `src/lib/boq-generator.ts`

Add waffle pod specific line items:
- Bar Chairs (25/40): `podCount × 3` units
- Trench Mesh Chairs: `perimeter ÷ 1.2` units
- Rib Y-Bar: `(pods × 2.3) ÷ 5.5` × 6m lengths
- Slab Mesh: `area ÷ 12.5` sheets

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/takeoff/SlabBeamMarkupDialog.tsx` | Add trench mesh chairs auto-calculation display |
| `src/lib/estimate-components/scopes.ts` | Add bar chairs and TM chairs fields to waffle pod scope; update volume calculation |
| `src/lib/estimate-components/modules/reinforcement-raft.ts` | Add waffle-pod-specific reinforcement calculations |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Extend auto-calculation useEffect for new fields |
| `src/lib/boq-generator.ts` | Add waffle pod specific BOQ line items |

---

## User Experience

1. **Takeoff Phase**: User marks waffle pod area, dialog shows auto-calculated:
   - Waffle Pods (Area ÷ 1.51)
   - 4-Way Spacers (Pods × 1.40)
   - 2-Way Spacers (4-Way ÷ 3)
   - Trench Mesh Chairs (Perimeter ÷ 1.2) **NEW**

2. **Calculator Phase**: Auto-populated values appear in scope answers:
   - Bar Chairs (Pods × 3) **NEW**
   - All accessory counts carried forward from takeoff

3. **Reinforcement Module**: Waffle-pod-specific calculations:
   - Mesh: Area ÷ 12.5 sheets
   - Rib Y-Bar: (Pods × 2.3) ÷ 5.5 lengths

4. **Concrete Supply**: Uses industry empirical rates based on total slab height

5. **BOQ Generation**: All materials listed with correct quantities

---

## Notes

- All calculated values remain editable so users can override if needed
- The new formulas are specific to waffle pod scope and won't affect other slab types
- Industry rates are more accurate than pure volumetric calculations as they account for typical waste and construction factors
- The 3% wastage for concrete matches industry standard allowances
