

# Fix Data Persistence for Module "Done" States and Form Inputs

## Problem Summary

Form inputs and "done" module states are being lost when users:
- Switch between scope tabs on the Configure step
- Navigate between Configure, Takeoff, and other wizard steps
- Mark modules as "done" and then navigate away

The core issue is that the `doneModules` state in `ModularCalculator` is not being persisted to the parent component or saved to the database.

---

## Technical Root Causes

### 1. Done Modules Not Persisted
The `doneModules` state (a `Set<string>`) exists only in `ModularCalculator`'s local state. It's:
- Never included in the `onStateChange` callback
- Never saved to `modularScopeStates` in `EstimateFormDialog`
- Never restored when the calculator remounts

### 2. Calculator Remounts Reset State
When switching scope tabs or returning from takeoff, the `ModularCalculator` component remounts (due to key changes or parent re-renders), which resets:
- `doneModules` back to empty `Set()`
- Any other local state not passed via `onStateChange`

### 3. State Flow Gap

```text
Current Flow:
┌─────────────────────────┐
│   ModularCalculator     │
│   - doneModules ✗       │ ← Local only, not passed up
│   - scopeAnswers ✓      │
│   - moduleAnswers ✓     │
│   - customExclusions ✓  │
└──────────┬──────────────┘
           │ onStateChange (missing doneModules)
           ▼
┌─────────────────────────┐
│  EstimateFormDialog     │
│  modularScopeStates     │ ← Stores scopeAnswers, moduleAnswers,
│                         │   customExclusions, calculatedTotal
│                         │   BUT NOT doneModules
└─────────────────────────┘
```

---

## Solution

### Phase 1: Include `doneModules` in State Flow

**File: `src/components/estimates/EstimateFormDialog.tsx`**

Update the `ModularScopeState` interface to include `doneModules`:

```typescript
export interface ModularScopeState {
  scopeAnswers: Record<string, any>;
  moduleAnswers: Record<string, Record<string, any>>;
  customExclusions: ExclusionItem[];
  calculatedTotal: number;
  doneModules?: string[];  // NEW: Array of module IDs marked as done
}
```

Update `handleModularStateChange` to receive and store `doneModules`:

```typescript
const handleModularStateChange = useCallback((scopeType: ScopeType, state: {
  scopeAnswers: Record<string, any>;
  moduleAnswers: Record<string, Record<string, any>>;
  customExclusions: ExclusionItem[];
  total: number;
  doneModules?: string[];  // NEW
}) => {
  setModularScopeStates(prev => ({
    ...prev,
    [scopeType]: {
      scopeAnswers: state.scopeAnswers,
      moduleAnswers: state.moduleAnswers,
      customExclusions: state.customExclusions,
      calculatedTotal: state.total,
      doneModules: state.doneModules || [],  // NEW
    },
  }));
}, []);
```

Update `buildScopeDataForSave` to include `doneModules`:

```typescript
const buildScopeDataForSave = (): Record<string, any> => {
  const data: Record<string, any> = {};
  data._globalMargin = globalMarginPercent;
  
  for (const scopeType of selectedScopesArray) {
    const state = modularScopeStates[scopeType];
    if (state) {
      data[scopeType] = {
        scopeAnswers: state.scopeAnswers,
        moduleAnswers: state.moduleAnswers,
        customExclusions: state.customExclusions,
        calculatedTotal: state.calculatedTotal,
        doneModules: state.doneModules || [],  // NEW
      };
    }
  }
  
  return data;
};
```

### Phase 2: Update ModularCalculator to Pass and Restore `doneModules`

**File: `src/components/estimates/calculators/ModularCalculator.tsx`**

Add new prop for initial done modules:

```typescript
interface ModularCalculatorProps {
  // ... existing props
  initialDoneModules?: string[];  // NEW
}
```

Initialize `doneModules` from props:

```typescript
const [doneModules, setDoneModules] = useState<Set<string>>(
  () => new Set(initialDoneModules || [])
);
```

Update `notifyStateChange` to include `doneModules`:

```typescript
const notifyStateChange = useCallback(() => {
  if (onStateChange) {
    onStateChange({
      scopeAnswers,
      moduleAnswers,
      calculatedCosts: moduleCosts,
      exclusions: autoExclusions,
      customExclusions,
      marginPercent,
      subtotal: totals.subtotal,
      marginAmount: totals.marginAmount,
      gst: totals.gst,
      total: totals.total,
      doneModules: Array.from(doneModules),  // NEW: Convert Set to Array
    });
  }
}, [
  onStateChange,
  scopeAnswers,
  moduleAnswers,
  moduleCosts,
  autoExclusions,
  customExclusions,
  marginPercent,
  totals,
  doneModules,  // NEW: Add to dependencies
]);
```

### Phase 3: Pass `initialDoneModules` from Parent

**File: `src/components/estimates/EstimateFormDialog.tsx`**

In `renderScopeCalculator`, pass the restored done modules:

```typescript
return (
  <ModularCalculator
    key={calculatorKey}
    scope={scopeDefinition}
    initialScopeAnswers={initialScopeAnswers}
    initialModuleAnswers={initialModuleAnswers}
    initialCustomExclusions={currentState?.customExclusions}
    initialDoneModules={currentState?.doneModules}  // NEW
    onStateChange={(state) => handleModularStateChange(scope, state)}
    // ... rest of props
  />
);
```

### Phase 4: Restore from Database on Load

**File: `src/components/estimates/EstimateFormDialog.tsx`**

In `migrateLegacyScopeData`, ensure `doneModules` is preserved:

```typescript
if (legacyData.scopeAnswers !== undefined) {
  result[scopeType] = {
    scopeAnswers: legacyData.scopeAnswers || {},
    moduleAnswers: legacyData.moduleAnswers || {},
    customExclusions: legacyData.customExclusions || [],
    calculatedTotal: legacyData.calculatedTotal || 0,
    doneModules: legacyData.doneModules || [],  // NEW: Restore done modules
  };
  continue;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/EstimateFormDialog.tsx` | Add `doneModules` to `ModularScopeState` interface, update `handleModularStateChange`, `buildScopeDataForSave`, pass `initialDoneModules` prop, update `migrateLegacyScopeData` |
| `src/components/estimates/calculators/ModularCalculator.tsx` | Add `initialDoneModules` prop, initialize `doneModules` from prop, include `doneModules` in `notifyStateChange` callback |

---

## Testing Checklist

After implementation:
1. Create a new estimate with multiple scopes (e.g., Raft Slab + Piers)
2. On Configure step, mark a module as "done" (e.g., Reinforcement)
3. Switch to another scope tab (Piers)
4. Switch back to original scope (Raft Slab)
5. **Verify**: The "done" badge is still visible on the marked module
6. Navigate to Takeoff step and back to Configure
7. **Verify**: Done states are preserved
8. Click "Save Draft" and close the dialog
9. Re-open the draft estimate
10. **Verify**: All done states and form inputs are restored

---

## Expected Outcome

- Module "done" states persist across scope tab switches
- Module "done" states persist when navigating between wizard steps
- Module "done" states are saved to the database and restored on edit
- All form inputs (Y/N switches, text fields, numbers) remain populated

