

# Fix: Incorrect Concrete Volume Calculation for Driveway and Paths Scopes

## Problem Summary
When calculating concrete volume for Driveway and Paths & Surrounds scopes, the system is including **edge thickening volume by default**, even when no edge beams have been explicitly configured. This causes the volume to be significantly higher than expected.

**User's Example:**
- Two driveway areas: 43m² + 43.9m² = 86.9m² total
- Slab thickness: 100mm
- Expected volume: 8.69m³
- Observed volume: 11.93m³ (3.24m³ extra from edge thickening)

## Root Cause
Two issues are causing the incorrect volume:

1. **`hasEdgeBeams` defaults to `true` in the UI** - The toggle in ModularCalculator.tsx defaults to "on" (`scopeAnswers.hasEdgeBeams ?? true`)

2. **Volume calculation falls back to using perimeter** - When no `edgeBeams` array exists, the calculation uses the perimeter as the edge beam length with default 300mm width/depth, automatically adding edge thickening volume

## Solution

### Change 1: Default `hasEdgeBeams` to `false` for Driveway-style scopes
**File: `src/components/estimates/calculators/ModularCalculator.tsx`**

Change the default value for the edge beams toggle from `true` to `false` for scopes where edge thickening is optional (Driveway, Crossovers, Paths & Surrounds, Standard Slab).

### Change 2: Respect `hasEdgeBeams` toggle in volume calculation
**File: `src/lib/estimate-components/scopes.ts`**

Update `calculateVolume` for `DRIVEWAY_SCOPE`, `CROSSOVERS_SCOPE`, and `PATHS_SURROUNDS_SCOPE` to:
- Check `answers.hasEdgeBeams` before calculating edge thickening volume
- Only include edge thickening if explicitly enabled

### Change 3: Respect `hasInternalBeams` toggle in volume calculation
**File: `src/lib/estimate-components/scopes.ts`**

Update `DRIVEWAY_SCOPE.calculateVolume` to respect the `hasInternalBeams` toggle (currently only Driveway supports internal thickening among these scopes).

---

## Technical Details

### ModularCalculator.tsx Changes

```
Line ~1414: Change edge beams toggle default
Current:  checked={scopeAnswers.hasEdgeBeams ?? true}
New:      checked={scopeAnswers.hasEdgeBeams ?? false}

Line ~1449: Change internal beams toggle (already false, no change needed)
checked={scopeAnswers.hasInternalBeams ?? false}
```

### scopes.ts Changes - DRIVEWAY_SCOPE

```
Current logic (lines 1079-1112):
  - Always calculates edge thickening volume
  - Falls back to perimeter if no edgeBeams array

New logic:
  - Check if answers.hasEdgeBeams === true first
  - Only calculate edge thickening if enabled
  - Check answers.hasInternalBeams for internal thickening
```

### scopes.ts Changes - CROSSOVERS_SCOPE

```
Current logic (lines 1235-1254):
  - Always calculates edge thickening volume

New logic:
  - Check if answers.hasEdgeBeams === true first
  - Only calculate edge thickening if enabled
```

### scopes.ts Changes - PATHS_SURROUNDS_SCOPE

```
Current logic (lines 1379-1398):
  - Always calculates edge thickening volume

New logic:
  - Check if answers.hasEdgeBeams === true first
  - Only calculate edge thickening if enabled
```

---

## Expected Outcome

After this fix:
- New estimates for Driveway, Crossovers, and Paths & Surrounds will start with edge thickening **disabled**
- Volume calculation will only include slab area × thickness by default
- Users can enable edge thickening when needed, and the volume will update accordingly
- The user's example (86.9m² × 100mm) will correctly show **8.69m³**

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/estimates/calculators/ModularCalculator.tsx` | Default `hasEdgeBeams` to `false` for the toggle |
| `src/lib/estimate-components/scopes.ts` | Update `DRIVEWAY_SCOPE.calculateVolume` to respect edge/internal beam toggles |
| `src/lib/estimate-components/scopes.ts` | Update `CROSSOVERS_SCOPE.calculateVolume` to respect edge beam toggle |
| `src/lib/estimate-components/scopes.ts` | Update `PATHS_SURROUNDS_SCOPE.calculateVolume` to respect edge beam toggle |

