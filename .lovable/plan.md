
# Fix Zero Value Handling in Estimate Calculator Inputs

## Problem

Throughout the estimate calculator components, the value `0` is not being accepted correctly in numeric input fields. This affects many type fields and numeric inputs across the calculators.

### Root Causes

There are two problematic patterns being used:

1. **Display Pattern**: `value={someValue || ""}` 
   - When `someValue` is `0`, this evaluates to `""` (empty string) because `0` is falsy in JavaScript
   - The input appears empty even though the actual value is 0

2. **Change Handler Pattern**: `Number(e.target.value) || defaultValue`
   - When extracting values from scopeData: `Number(scopeData?.field) || 2` 
   - If user explicitly sets a value to 0, it falls back to the default instead

### Impact

Users cannot:
- Set quantity values to 0 (e.g., "0 top bars in rib reinforcement")
- Clear fields and have them remain at 0
- See that a value is actually 0 vs empty/undefined

---

## Solution

Replace falsy-check patterns with explicit nullish coalescing (`??`) and proper empty-vs-zero handling.

### Pattern Fixes

**Fix 1: Input value display**
```typescript
// BEFORE (broken - 0 shows as empty)
value={someValue || ""}

// AFTER (works correctly)
value={someValue ?? ""}
// OR for explicit 0 handling:
value={someValue === 0 ? "0" : (someValue || "")}
// OR for cleaner approach with numbers that should show 0:
value={typeof someValue === 'number' ? someValue : ""}
```

**Fix 2: Value extraction from scopeData**
```typescript
// BEFORE (broken - 0 becomes default)
const ribTopBars = Number(scopeData?.rib_top_bars) || 1;

// AFTER (preserves 0, only uses default for undefined/null)
const ribTopBars = scopeData?.rib_top_bars !== undefined 
  ? Number(scopeData?.rib_top_bars) 
  : 1;
// OR using nullish coalescing:
const ribTopBars = Number(scopeData?.rib_top_bars ?? 1);
```

**Fix 3: onChange handlers**
```typescript
// BEFORE (broken - empty string becomes 0, can't distinguish)  
onChange={(e) => handleChange('field', Number(e.target.value) || 0)}

// AFTER (empty string becomes undefined/null, 0 stays 0)
onChange={(e) => handleChange('field', 
  e.target.value === "" ? undefined : Number(e.target.value)
)}
// OR if 0 is a valid empty value:
onChange={(e) => handleChange('field',
  e.target.value === "" ? 0 : Number(e.target.value)
)}
```

---

## Files Requiring Changes

Based on my search, these files have the problematic patterns:

### High Priority (Reinforcement & Config Inputs)
| File | Issue Pattern |
|------|---------------|
| `WafflePodRibsInput.tsx` | `Number(scopeData?.rib_top_bars) \|\| 1` - can't set top bars to 0 |
| `WafflePodToppingMeshInput.tsx` | `Number(scopeData?....) \|\| default` patterns |
| `WafflePodConfigInput.tsx` | `value={...=== 0 ? '' : ...}` and `\|\| default` |
| `WafflePodConfigCard.tsx` | Multiple `value={x === 0 ? '' : x}` and `\|\|` patterns |
| `AreaReinforcementInput.tsx` | Value extraction patterns |
| `FootingSectionReinforcementInput.tsx` | Similar patterns |
| `PierReinforcementInput.tsx` | `group.quantity \|\| 1` |

### Medium Priority (Measurement Inputs)
| File | Issue Pattern |
|------|---------------|
| `MultiWafflePodZoneInput.tsx` | `value={zone.x === 0 ? '' : zone.x}` + `Number(...) \|\| 0` |
| `MultiBeamTypeInput.tsx` | `value={group.width \|\| ""}` |
| `MultiAreaInput.tsx` | `value={area.length \|\| ""}` patterns |
| `MultiLinearInput.tsx` | Similar patterns |
| `MultiFootingInput.tsx` | `value={footing.length \|\| ""}` |
| `MultiPierInput.tsx` | `value={pier.quantity \|\| ""}` |
| `MultiBeamInput.tsx` | Similar patterns |
| `ExtraItemsInput.tsx` | `Number(e.target.value) \|\| 0` |
| `AddCustomItemDialog.tsx` | `setQuantity(Number(e.target.value) \|\| 0)` |
| `MultiControlJointInput.tsx` | Various patterns |
| `MultiExpansionJointInput.tsx` | Similar patterns |
| `MultiLinearTypeInput.tsx` | `value={group.dimension1 \|\| ""}` |
| `MultiPlacementInput.tsx` | `Number(e.target.value) \|\| 0` |

---

## Implementation Approach

### Step 1: Create a helper utility for consistent handling

Add to `src/lib/utils.ts` or create `src/lib/input-helpers.ts`:

```typescript
// For input value display - handles 0 correctly
export function inputValue(val: number | undefined | null): string | number {
  return val ?? "";
}

// For numeric onChange - preserves 0, converts empty to undefined
export function parseNumericInput(
  value: string, 
  fallback?: number
): number | undefined {
  if (value === "") return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

// For extracting from scopeData with default
export function numericWithDefault(
  value: unknown, 
  defaultValue: number
): number {
  if (value === undefined || value === null) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}
```

### Step 2: Update components systematically

For each file, replace:
1. `value={x || ""}` → `value={x ?? ""}`
2. `Number(scopeData?.x) || default` → `numericWithDefault(scopeData?.x, default)`
3. `Number(e.target.value) || 0` → `parseNumericInput(e.target.value, 0)`

### Step 3: Special handling for fields where 0 should clear

Some fields (like pod count) intentionally show empty when 0:
```typescript
value={podCount === 0 ? '' : podCount}
```
These are intentional UX decisions and should be preserved.

---

## Example Fixes

### WafflePodRibsInput.tsx (lines 35-37)

```typescript
// BEFORE
const ribBottomBars = Number(scopeData?.rib_bottom_bars) || 2;
const ribTopBars = Number(scopeData?.rib_top_bars) || 1;

// AFTER
const ribBottomBars = scopeData?.rib_bottom_bars ?? 2;
const ribTopBars = scopeData?.rib_top_bars ?? 1;
```

### MultiBeamTypeInput.tsx (line 324)

```typescript
// BEFORE
value={group.width || ""}

// AFTER  
value={group.width ?? ""}
```

### ExtraItemsInput.tsx (line 110)

```typescript
// BEFORE
handleUpdate(item.id, "quantity", Number(e.target.value) || 0)

// AFTER
handleUpdate(item.id, "quantity", 
  e.target.value === "" ? 0 : Number(e.target.value)
)
```

---

## Testing Checklist

After implementing fixes:
1. Open any Waffle Pod estimate
2. Set "Top Bars" quantity to 0 in Rib Reinforcement
3. Verify dropdown shows "0" or "None" (not the default)
4. Save and reload - verify 0 persists
5. Test footing inputs - set length to 0
6. Test area inputs - set dimensions to 0
7. Test pier inputs - set quantity to 0
8. Verify calculations still work correctly with 0 values
