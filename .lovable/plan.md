
# Update Default Chair Count for Double Layer Mesh

## Summary

Change the Top Chairs default from 2 chairs/m² to 4 chairs/m² to match the Bottom Chairs default in double layer mesh configurations.

---

## Current Behavior

| Chair Type | Default Value |
|------------|---------------|
| Bottom Chairs | 4 chairs/m² |
| Top Chairs | 2 chairs/m² |

## Desired Behavior

| Chair Type | Default Value |
|------------|---------------|
| Bottom Chairs | 4 chairs/m² |
| Top Chairs | 4 chairs/m² |

---

## Technical Change

**File:** `src/components/estimates/calculators/AreaReinforcementInput.tsx`

**Line 661:** Change the default value from 2 to 4

```typescript
// Before
value={area.layer_chairs_per_m2 ?? 2}

// After
value={area.layer_chairs_per_m2 ?? 4}
```

---

## Impact

- Newly created double layer mesh areas will default to 4 chairs/m² for both bottom and top layers
- Existing estimates with explicitly set values will not be affected
- Provides consistency between both chair layer defaults
