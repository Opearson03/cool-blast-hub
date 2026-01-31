

# Fix Strip Footing and Retaining Wall Footing Reinforcement Issues

## Problem Summary

Two distinct issues were reported in the Reinforcement module for strip footings and retaining wall footings:

1. **Trench Mesh "None" still adds 5 sheets**: When user selects "None" for trench mesh, materials are still being added with associated costs
2. **Bars not showing price/quantity**: Horizontal and vertical bars added by the user don't appear in the cost breakdown

## Root Cause Analysis

### Issue 1: Trench Mesh Default Fallback

The problem is a disconnect between the UI display and the stored data:

**In the UI** (`FootingSectionReinforcementInput.tsx` line 477):
```typescript
const tmType = group.tm_type || defaultTmType;
```
When `group.tm_type` is `undefined`, the UI displays "L11TM4" (the default).

**In the calculation** (`reinforcement-footing.ts` line 125):
```typescript
const tmType = section.tm_type ?? DEFAULT_TM_TYPE;
```
When `section.tm_type` is `undefined`, it defaults to "L11TM4".

**The Issue**: When a new footing section is created, `tm_type` is never set. The UI shows the default, but the user hasn't explicitly confirmed that choice. If the user:
1. Opens the reinforcement panel
2. Sees "L11TM4" displayed (thinking that's the current value)
3. Leaves it unchanged

...the `tm_type` remains `undefined`, and the calculation applies the default.

When the user selects "None" for one group, only that group's sections get `tm_type: 'none'`. Other sections with `undefined` still use the default.

### Issue 2: Zero-Length Footing Sections

Horizontal and vertical bar calculations check section length at line 298-299:
```typescript
const length = section._actualLength || section.length;
if (length <= 0) return;
```

If a footing section has zero length (which is the default for new sections created at line 1321 in ModularCalculator.tsx), the calculation skips it entirely, resulting in no bar line items being generated.

This is problematic when:
- User creates sections manually and forgets to set the length
- User expects the default placeholder to work

---

## Solution

### Fix 1: Initialize TM Type Explicitly on First Interaction

When the user first opens the reinforcement panel or when sections are created, explicitly set `tm_type` to match what the UI displays. This ensures the stored value matches what the user sees.

**File:** `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx`

Add initialization in the existing `useEffect` to set `tm_type` if undefined:

```typescript
useEffect(() => {
  if (!priceMap || sections.length === 0) return;
  
  let hasChanges = false;
  const updatedSections = sections.map(section => {
    let updates: Partial<LinearSection> = {};
    
    // NEW: Explicitly set tm_type to default if undefined
    // This ensures stored value matches displayed value
    if (section.tm_type === undefined) {
      updates.tm_type = defaultTmType;
      hasChanges = true;
    }
    
    const tmType = section.tm_type ?? defaultTmType;
    // ... rest of existing price initialization logic
```

This ensures that when sections are displayed in the UI, they have an explicit `tm_type` value, so selecting "None" correctly updates from an explicit "L11TM4" to "none" rather than from undefined.

### Fix 2: Show Warning for Zero-Length Sections

Add a visual indicator and help text when footing sections have zero length, so users know their bar configurations won't calculate until length is provided.

**File:** `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx`

In the group rendering, add a warning when `totalLength === 0`:

```typescript
{group.totalLength <= 0 && (
  <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 text-amber-700 text-xs border border-amber-200">
    <AlertTriangle className="h-4 w-4 shrink-0" />
    <span>
      No length specified for this footing type. 
      Set a length above to calculate reinforcement costs.
    </span>
  </div>
)}
```

### Fix 3: Skip Zero-Length Sections in UI Summary

Update the reinforcement summary to correctly reflect which sections will actually be calculated:

```typescript
// In summary calculation
const sectionsWithLength = groups.filter(g => g.totalLength > 0);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx` | Initialize `tm_type` explicitly; add zero-length warning |
| `src/lib/estimate-components/modules/reinforcement-footing.ts` | (Optional) Add debug logging or validation |

---

## Technical Details

### TM Type Initialization Flow

**Before fix:**
```
Section created → tm_type: undefined
UI displays: "L11TM4" (via || defaultTmType)
User leaves unchanged
Calculation: section.tm_type ?? DEFAULT_TM_TYPE = "L11TM4"
→ Trench mesh calculated even though user never confirmed
```

**After fix:**
```
Section created → tm_type: undefined
useEffect runs → tm_type: "L11TM4" (explicitly set)
UI displays: "L11TM4" (matching stored value)
User selects "None" → tm_type: "none"
Calculation: section.tm_type ?? DEFAULT_TM_TYPE = "none"
→ No trench mesh calculated ✓
```

### Zero-Length Section Flow

**Current behavior:**
```
Section with length: 0
User adds horizontal bar (N16 × 2)
Calculation: length = 0, returns early
→ No line item generated
```

**After fix:**
```
Section with length: 0
UI shows warning: "No length specified..."
User updates length to 10m
Calculation: length = 10, bar calculated
→ Line item: "Horizontal N16 bottom (35kg)" at $X
```

---

## Implementation Notes

1. The initialization should only run once per section (use a stable reference check)
2. The zero-length warning should be prominent but not block the UI
3. Existing sections with explicit `tm_type` values will not be affected
4. The fix maintains backward compatibility with saved estimates

## Impact

- Strip footings and retaining wall footings will correctly respect "None" selection for trench mesh
- Users will see clear feedback when sections don't have length set
- Bar reinforcement will calculate correctly once sections have length values
- Existing estimates with explicit values will continue to work unchanged

