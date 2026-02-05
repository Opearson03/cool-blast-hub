
# Plan: Scope-Aware Inclusions and Exclusions System
 
 **STATUS: ✅ IMPLEMENTED**

## Problem Summary
When a user creates an estimate with only "demolition" as the scope, the automatic inclusions still show concrete-related items like "Supply of concrete to site", "Curing compound application", and "Power floating / finishing". These items are irrelevant to a demolition-only quote.

The root cause is that `DEFAULT_INCLUSIONS` and `DEFAULT_EXCLUSIONS` are **static lists** with no awareness of which scopes or modules are actually selected.

---

## Solution Overview
Transform the inclusions/exclusions system from a static checklist to a **dynamic, scope-aware system** that:
1. Maps each inclusion/exclusion to the modules that make it relevant
2. Only shows and pre-selects items when their associated modules are active
3. Maintains manual override capability (user can still toggle items on/off)

---

## Technical Implementation

### 1. Enhance Inclusion/Exclusion Data Structures
**File:** `src/components/estimates/EstimateFormDialog.tsx`

Update `DEFAULT_INCLUSIONS` and `DEFAULT_EXCLUSIONS` to include module mappings:

```text
Before:
  { id: "concrete_supply", label: "Supply of concrete to site" }

After:
  { 
    id: "concrete_supply", 
    label: "Supply of concrete to site",
    relevantModules: ["concrete-supply"]  // Only show when concrete-supply module is active
  }
```

Complete mappings:
| Inclusion ID | Relevant Modules |
|-------------|------------------|
| concrete_supply | concrete-supply |
| labour | labour-prep, labour-place |
| reo_supply | reinforcement-slab, reinforcement-raft, reinforcement-piers, reinforcement-footing, reinforcement-pad |
| finishing | surface-finishing, architectural-finishing |
| curing | surface-finishing (when curing enabled) |
| site_cleanup | cleanup |
| pump_hire | concrete-pumping |
| formwork | formwork |

| Exclusion ID | Relevant Modules (invert logic) |
|-------------|--------------------------------|
| exc_excavation | excavation (exclude when NOT enabled) |
| exc_soil_removal | excavation |
| exc_boxing | formwork |
| exc_waterproofing | (always available) |
| exc_drainage | plumbing |
| exc_saw_cutting | joints-control, demolition |
| exc_sealing | surface-finishing |
| exc_permits | (always available - global) |
| exc_engineering | (always available - global) |

### 2. Create Helper Function to Determine Active Modules
**File:** `src/components/estimates/EstimateFormDialog.tsx`

Add a function that collects all active modules from selected scopes:

```typescript
function getActiveModulesFromScopes(
  selectedScopes: Set<string>, 
  modularScopeStates: Record<string, ModularScopeState>
): Set<string> {
  const activeModules = new Set<string>();
  
  for (const scopeId of selectedScopes) {
    const scopeDef = SCOPE_REGISTRY[scopeId];
    if (scopeDef?.moduleIds) {
      scopeDef.moduleIds.forEach(m => activeModules.add(m));
    }
  }
  
  return activeModules;
}
```

### 3. Filter Visible Inclusions/Exclusions Based on Active Modules
**File:** `src/components/estimates/EstimateFormDialog.tsx`

In the "conditions" step, filter the displayed inclusions/exclusions:

```typescript
const visibleInclusions = useMemo(() => {
  const activeModules = getActiveModulesFromScopes(selectedScopes, modularScopeStates);
  
  return DEFAULT_INCLUSIONS.filter(item => {
    // Items with no module mapping are always shown (global items)
    if (!item.relevantModules || item.relevantModules.length === 0) return true;
    // Show only if at least one relevant module is active
    return item.relevantModules.some(m => activeModules.has(m));
  });
}, [selectedScopes, modularScopeStates]);

const visibleExclusions = useMemo(() => {
  // Similar logic for exclusions
});
```

### 4. Smart Pre-Selection Logic
**File:** `src/components/estimates/EstimateFormDialog.tsx`

Update the initialization logic to only pre-select relevant items:

```typescript
// When selectedScopes changes, update the pre-selected inclusions
useEffect(() => {
  const activeModules = getActiveModulesFromScopes(selectedScopes, modularScopeStates);
  
  // Auto-select inclusions that match active modules
  const newInclusions = new Set<string>();
  DEFAULT_INCLUSIONS.forEach(item => {
    const isRelevant = !item.relevantModules || 
      item.relevantModules.length === 0 || 
      item.relevantModules.some(m => activeModules.has(m));
    
    if (isRelevant) {
      newInclusions.add(item.id);
    }
  });
  
  setSelectedInclusions(newInclusions);
}, [selectedScopes]);
```

### 5. Update the Conditions UI to Only Show Relevant Items
**File:** `src/components/estimates/EstimateFormDialog.tsx`

Modify the "conditions" step JSX:

```tsx
{visibleInclusions.map((item) => (
  <label key={item.id} ...>
    {/* existing checkbox logic */}
  </label>
))}
```

Add a helper message when no inclusions are relevant:
```tsx
{visibleInclusions.length === 0 && (
  <p className="text-sm text-muted-foreground">
    No standard inclusions apply to this scope. Add custom notes if needed.
  </p>
)}
```

### 6. Demolition-Specific Inclusions
Since demolition is a unique scope with only 2 modules (`demolition`, `extra-items`), we should add demolition-specific inclusion options:

```typescript
// Add to DEFAULT_INCLUSIONS:
{ id: "demo_removal", label: "Removal and disposal of demolished concrete", relevantModules: ["demolition"] },
{ id: "demo_saw_cutting", label: "Saw cutting as required", relevantModules: ["demolition"] },
```

---

## Files to be Modified

| File | Changes |
|------|---------|
| `src/components/estimates/EstimateFormDialog.tsx` | - Update `DEFAULT_INCLUSIONS` and `DEFAULT_EXCLUSIONS` with module mappings<br>- Add `getActiveModulesFromScopes()` helper<br>- Add `visibleInclusions` and `visibleExclusions` memos<br>- Update conditions step UI to use filtered lists<br>- Update initialization and sync logic |

---

## Expected Behavior After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Demolition-only quote | Shows 8 inclusions including "concrete supply", "curing", "finishing" | Shows only "Removal and disposal of demolished concrete", "Site cleanup" |
| Raft slab quote | Shows all 8 inclusions | Shows all relevant inclusions (concrete, reo, finishing, etc.) |
| Piers + Demolition | Mixed inclusions | Shows pier-relevant + demolition-relevant items |

---

## Testing Checklist
1. ✅ Create new estimate with only "Demolition" scope → verify only demolition-relevant inclusions appear
2. ✅ Create new estimate with "Raft Slab" scope → verify all concrete-related inclusions appear
3. ✅ Create estimate, switch scopes, verify inclusions update accordingly
4. ✅ Load an existing estimate → verify saved inclusions persist correctly
5. ✅ Verify PDF output shows only the selected inclusions
