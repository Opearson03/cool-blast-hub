
# Fix: Chair Type Selection Not Updating in Footing Scopes

## Problem Identified

When selecting a bar chair type (e.g., "50/65mm") in the Retaining Wall and Strip Footing scopes, the selection doesn't update properly.

### Root Cause

The `FootingSectionReinforcementInput` component uses `stableKey: typeName` for React keys on Collapsible components (line 500), but this key is not unique when multiple footing groups share the same type name with different dimensions.

For example, if you have:
- SF1 segment at 300mm x 400mm
- SF1 segment at 450mm x 500mm

Both would create separate groups (correct behavior), but both groups would have `stableKey = "SF1"`. This causes a **React key collision**, which prevents proper updates when changing chair type or other values.

---

## Technical Details

**Current code at line 141:**
```typescript
stableKey: typeName,  // Bug: Not unique when same type has different dimensions
```

**Current code at line 500:**
```typescript
<Collapsible key={group.stableKey} ...>
```

When React sees duplicate keys in a list, it may:
1. Skip re-rendering components incorrectly
2. Preserve stale state between items
3. Apply updates to the wrong component

---

## Solution

Change the `stableKey` to include the dimensions, making it unique per group while still being stable across renders:

**File:** `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx`

**Change line 141:**
```typescript
// Before:
stableKey: typeName,

// After:
stableKey: key,  // Use full groupKey (typeName-width-depth) for unique React keys
```

This ensures each footing group has a unique React key while maintaining stability (the key only changes if type name or dimensions change, which is expected behavior).

---

## Additional Note: Excavation Machines

The user also mentioned that bulk excavation doesn't have the full range of machines. The current options (1.4T, 3.2T, 4T, 6T, 9T Excavators + Posi Track) match the price list catalog. If additional machine sizes are needed (e.g., 12T, 14T, 20T), they would need to be added to both:
1. The default price list CSV
2. The excavation module options

This can be addressed in a follow-up if the user confirms which additional machine sizes they need.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/estimates/calculators/FootingSectionReinforcementInput.tsx` | Line 141: Change `stableKey: typeName` to `stableKey: key` |

---

## Impact

- Fixes chair type selection not updating in Retaining Wall and Strip Footing scopes
- Fixes any other settings that weren't updating due to key collision
- No breaking changes - groups will still render correctly, just with proper unique keys
