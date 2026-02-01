

# Fix Missing Machine Sizes in Excavation Module

## Problem Summary

The excavation module has limited machine options compared to the demolition module:

| Module | Machine Options |
|--------|----------------|
| **Demolition** | 1.4T, 3.2T, 4T, 6T, 9T, Posi Track (all 6) |
| **Excavation - Bulk** | 6T, 9T, Posi Track (only 3) |
| **Excavation - Detailed** | 1.4T, 3.2T, 4T (only 3) |

Users expect to see all machine sizes available in both bulk and detailed excavation, matching the demolition module.

---

## Solution

Update both machine type selectors in the excavation module to include all 6 options.

---

## Changes Required

**File:** `src/lib/estimate-components/modules/excavation.ts`

### 1. Update Bulk Excavation Machine Options (line 86-90)

**Current:**
```typescript
options: [
  { value: 'EXC 6T', label: '6T Excavator', priceKey: 'excavation.EXC 6T' },
  { value: 'EXC 9T', label: '9T Excavator', priceKey: 'excavation.EXC 9T' },
  { value: 'POSI TRACK', label: 'Posi Track', priceKey: 'excavation.POSI TRACK' },
],
```

**Updated:**
```typescript
options: [
  { value: 'EXC 1.4T', label: '1.4T Excavator', priceKey: 'excavation.EXC 1.4T' },
  { value: 'EXC 3.2T', label: '3.2T Excavator', priceKey: 'excavation.EXC 3.2T' },
  { value: 'EXC 4T', label: '4T Excavator', priceKey: 'excavation.EXC 4T' },
  { value: 'EXC 6T', label: '6T Excavator', priceKey: 'excavation.EXC 6T' },
  { value: 'EXC 9T', label: '9T Excavator', priceKey: 'excavation.EXC 9T' },
  { value: 'POSI TRACK', label: 'Posi Track', priceKey: 'excavation.POSI TRACK' },
],
```

### 2. Update Detailed Excavation Machine Options (line 264-268)

**Current:**
```typescript
options: [
  { value: 'EXC 1.4T', label: '1.4T Excavator', priceKey: 'excavation.EXC 1.4T' },
  { value: 'EXC 3.2T', label: '3.2T Excavator', priceKey: 'excavation.EXC 3.2T' },
  { value: 'EXC 4T', label: '4T Excavator', priceKey: 'excavation.EXC 4T' },
],
```

**Updated:**
```typescript
options: [
  { value: 'EXC 1.4T', label: '1.4T Excavator', priceKey: 'excavation.EXC 1.4T' },
  { value: 'EXC 3.2T', label: '3.2T Excavator', priceKey: 'excavation.EXC 3.2T' },
  { value: 'EXC 4T', label: '4T Excavator', priceKey: 'excavation.EXC 4T' },
  { value: 'EXC 6T', label: '6T Excavator', priceKey: 'excavation.EXC 6T' },
  { value: 'EXC 9T', label: '9T Excavator', priceKey: 'excavation.EXC 9T' },
  { value: 'POSI TRACK', label: 'Posi Track', priceKey: 'excavation.POSI TRACK' },
],
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/estimate-components/modules/excavation.ts` | Add all 6 machine options to both bulk and detailed excavation selectors |

---

## Impact

- Both bulk and detailed excavation will show all 6 machine sizes
- Matches the demolition module's full machine list
- Price list lookups will work correctly (all machine codes already exist in price list)
- No calculation logic changes needed - just the dropdown options

