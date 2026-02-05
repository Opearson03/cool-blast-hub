

# Comprehensive Review: Scope-Aware Inclusions and Exclusions System

## Executive Summary

The implementation is **mostly working correctly**, but I found several gaps in the module mappings that could cause unexpected behavior in certain scenarios. The demolition-only scenario should now work properly, but there are missing mappings for some modules that exist in the codebase.

---

## Current Implementation Status

### How It Works (Correctly Implemented)

1. **`getActiveModulesFromScopes()`** (Line 259-270) correctly extracts module IDs from `SCOPE_REGISTRY`
2. **`visibleInclusions`** (Line 818-825) correctly filters based on `relevantModules`
3. **`visibleExclusions`** (Line 828-835) correctly filters based on `relevantModules`
4. **Auto-selection on scope change** (Line 756-794) correctly auto-selects when going from 0 → N scopes

---

## Scope → Module Mappings (Current State)

| Scope | Module IDs |
|-------|-----------|
| **demolition** | `demolition`, `extra-items` |
| **piers** | `excavation`, `formwork`, `reinforcement-piers`, `labour-prep`, `concrete-supply`, `concrete-pumping`, `labour-place`, `cleanup`, `sundries`, `extra-items` |
| **standard_slab** | `excavation`, `base-preparation`, `formwork`, `reinforcement-raft`, `connections-joints`, `labour-prep`, `concrete-supply`, `concrete-pumping`, `labour-place`, `surface-finishing`, `joints-control`, `cleanup`, `sundries`, `extra-items` |
| **raft_slab** | `excavation`, `base-preparation`, `formwork`, `reinforcement-raft`, `labour-prep`, `concrete-supply`, `concrete-pumping`, `labour-place`, `surface-finishing`, `cleanup`, `sundries`, `extra-items` |
| **waffle_pod** | `excavation`, `base-preparation`, `formwork`, `pods`, `reinforcement-raft`, `labour-prep`, `concrete-supply`, `concrete-pumping`, `labour-place`, `surface-finishing`, `cleanup`, `sundries`, `extra-items` |
| **driveway** | `excavation`, `base-preparation`, `formwork`, `reinforcement-raft`, `connections-joints`, `plumbing`, `labour-prep`, `concrete-supply`, `concrete-pumping`, `labour-place`, `surface-finishing`, `joints-control`, `cleanup`, `sundries`, `extra-items` |
| **crossovers** | Same as driveway |
| **paths_surrounds** | Same as driveway |
| **strip_footings** | `excavation`, `formwork`, `reinforcement-footing`, `labour-prep`, `concrete-supply`, `concrete-pumping`, `labour-place`, `cleanup`, `sundries`, `extra-items` |
| **retaining_wall_footings** | Same as strip_footings |
| **pad_footings** | `excavation`, `formwork`, `reinforcement-pad`, `labour-prep`, `concrete-supply`, `concrete-pumping`, `labour-place`, `cleanup`, `sundries`, `extra-items` |

---

## Issues Found

### Issue 1: Missing Module Mappings in DEFAULT_INCLUSIONS

The following modules exist in scope definitions but have no corresponding inclusions:

| Module | Missing Inclusion |
|--------|-------------------|
| `pods` | "Supply and placement of waffle pods and accessories" |
| `sundries` | "Sundries and consumables" |
| `connections-joints` | "Dowels, tie bars, and connection accessories" |
| `joints-control` | "Control joint cutting" |
| `plumbing` | "Plumbing penetrations and pip-eyes" |

### Issue 2: Incomplete Exclusion Mappings

| Exclusion | Current Modules | Should Also Include |
|-----------|-----------------|---------------------|
| `exc_excavation` | `base-preparation`, `formwork` | Should NOT be shown when `excavation` IS enabled (inverted logic missing) |
| `exc_soil_removal` | `excavation`, `demolition` | Correct |
| `exc_saw_cutting` | `joints-control`, `surface-finishing` | Should also include `demolition` (already correct) |

### Issue 3: Logic Gap for "Exclude When Module NOT Present"

Some exclusions should appear when a module is **not** in the active set. For example:
- "Excavation works" exclusion should show when `excavation` module is NOT active
- "Subgrade preparation" exclusion should show when `base-preparation` is NOT active

The current implementation only shows exclusions when modules ARE active, but doesn't handle the inverse case.

---

## Recommended Fixes

### Fix 1: Add Missing Inclusions

Add these to `DEFAULT_INCLUSIONS`:

```typescript
// Waffle pod specific
{ id: "pods_supply", label: "Supply and placement of waffle pods and accessories", relevantModules: ["pods"] },

// Sundries (present in most scopes)
{ id: "sundries", label: "Sundries and consumables (pegs, plastic, etc.)", relevantModules: ["sundries"] },

// Connections/joints
{ id: "connections", label: "Dowels, tie bars, and connection accessories", relevantModules: ["connections-joints"] },

// Control joints
{ id: "control_joints", label: "Control joint cutting", relevantModules: ["joints-control"] },

// Plumbing penetrations
{ id: "plumbing", label: "Plumbing penetrations and pip-eyes", relevantModules: ["plumbing"] },
```

### Fix 2: Add "Inverse Logic" for Exclusions

Some exclusions should appear when a module is **absent**. Add a new property `excludeWhenModulesActive`:

```typescript
interface InclusionExclusionItem {
  id: string;
  label: string;
  relevantModules?: string[];         // Show when ANY of these modules are active
  excludeWhenModulesActive?: string[]; // Hide when ANY of these modules are active
}

// Example: Show "Excavation not included" only when excavation module is NOT present
{ 
  id: "exc_no_excavation", 
  label: "Excavation and site preparation not included", 
  excludeWhenModulesActive: ["excavation"]  // Hide this if excavation IS active
},
```

### Fix 3: Update Filtering Logic

Modify `visibleExclusions` to handle inverse logic:

```typescript
const visibleExclusions = useMemo(() => {
  return DEFAULT_EXCLUSIONS.filter(item => {
    // If excludeWhenModulesActive is set, hide when those modules are active
    if (item.excludeWhenModulesActive?.length) {
      if (item.excludeWhenModulesActive.some(m => activeModules.has(m))) {
        return false; // Hide - the work IS included
      }
      return true; // Show - the work is NOT included
    }
    
    // Standard relevantModules logic
    if (!item.relevantModules || item.relevantModules.length === 0) return true;
    return item.relevantModules.some(m => activeModules.has(m));
  });
}, [activeModules]);
```

---

## Demolition Scope Verification

For a **demolition-only estimate**, the active modules are:
- `demolition`
- `extra-items`

**Current visible inclusions** (after the previous fix):
- "Removal and disposal of demolished concrete" (maps to `demolition`)
- "Saw cutting as required" (maps to `demolition`)

**Excluded (correctly hidden)**:
- "Supply of concrete to site" (maps to `concrete-supply`)
- "Curing compound application" (maps to `surface-finishing`)
- "Power floating / finishing" (maps to `surface-finishing`, `architectural-finishing`)
- All other concrete-related items

**This is working correctly.**

---

## Complete Updated DEFAULT_INCLUSIONS

```typescript
const DEFAULT_INCLUSIONS: InclusionExclusionItem[] = [
  // Concrete-related inclusions
  { id: "concrete_supply", label: "Supply of concrete to site", relevantModules: ["concrete-supply"] },
  { id: "labour", label: "All labour for concrete placement and finishing", relevantModules: ["labour-prep", "labour-place"] },
  { id: "reo_supply", label: "Supply and installation of reinforcement", relevantModules: ["reinforcement-slab", "reinforcement-raft", "reinforcement-piers", "reinforcement-footing", "reinforcement-pad"] },
  { id: "finishing", label: "Power floating / finishing to specified standard", relevantModules: ["surface-finishing", "architectural-finishing"] },
  { id: "curing", label: "Curing compound application", relevantModules: ["surface-finishing"] },
  { id: "site_cleanup", label: "Site cleanup on completion", relevantModules: ["cleanup"] },
  { id: "pump_hire", label: "Concrete pump hire", relevantModules: ["concrete-pumping"] },
  { id: "formwork", label: "Edge formwork supply and installation", relevantModules: ["formwork"] },
  
  // Demolition-specific inclusions
  { id: "demo_removal", label: "Removal and disposal of demolished concrete", relevantModules: ["demolition"] },
  { id: "demo_saw_cutting", label: "Saw cutting as required", relevantModules: ["demolition"] },
  
  // Base preparation inclusions
  { id: "base_prep", label: "Base preparation and compaction", relevantModules: ["base-preparation"] },
  
  // Excavation inclusions
  { id: "excavation", label: "Excavation works as required", relevantModules: ["excavation"] },
  
  // NEW - Missing module mappings
  { id: "pods_supply", label: "Supply and placement of waffle pods and accessories", relevantModules: ["pods"] },
  { id: "sundries", label: "Sundries and consumables", relevantModules: ["sundries"] },
  { id: "connections", label: "Dowels, tie bars, and connection accessories", relevantModules: ["connections-joints"] },
  { id: "control_joints", label: "Control joint cutting", relevantModules: ["joints-control"] },
  { id: "plumbing_penetrations", label: "Plumbing penetrations and pip-eyes", relevantModules: ["plumbing"] },
];
```

---

## Complete Updated DEFAULT_EXCLUSIONS

```typescript
const DEFAULT_EXCLUSIONS: InclusionExclusionItem[] = [
  // Global exclusions (always available regardless of scope)
  { id: "exc_permits", label: "Council permits and inspections" },
  { id: "exc_engineering", label: "Engineering certification" },
  { id: "exc_waterproofing", label: "Waterproofing membrane" },
  
  // Excavation-related exclusions
  { id: "exc_excavation", label: "Excavation and site preparation", relevantModules: ["base-preparation", "formwork"] },
  { id: "exc_soil_removal", label: "Removal of excavated material", relevantModules: ["excavation", "demolition"] },
  
  // Formwork-related exclusions
  { id: "exc_boxing", label: "Boxing and formwork beyond edge forms", relevantModules: ["formwork", "architectural-formwork"] },
  
  // Plumbing/drainage exclusions
  { id: "exc_drainage", label: "Drainage and stormwater works", relevantModules: ["plumbing"] },
  
  // Finishing-related exclusions
  { id: "exc_saw_cutting", label: "Saw cutting control joints", relevantModules: ["joints-control", "surface-finishing"] },
  { id: "exc_sealing", label: "Concrete sealing", relevantModules: ["surface-finishing", "architectural-finishing"] },
  
  // Demolition-specific exclusions
  { id: "exc_service_scanning", label: "Service scanning and locating", relevantModules: ["demolition"] },
  { id: "exc_asbestos", label: "Asbestos removal or handling", relevantModules: ["demolition"] },
  
  // NEW - Base preparation exclusion (show when base-prep IS active, in case user declines)
  { id: "exc_subgrade", label: "Subgrade preparation and compaction", relevantModules: ["base-preparation"] },
];
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/EstimateFormDialog.tsx` | Add missing inclusions for `pods`, `sundries`, `connections-joints`, `joints-control`, `plumbing` |

---

## Testing Checklist

1. **Demolition-only scope** → Should show only "Removal and disposal", "Saw cutting", and global exclusions
2. **Waffle Pod scope** → Should show "Supply of waffle pods" inclusion
3. **Driveway scope** → Should show plumbing and control joints inclusions
4. **Strip Footings scope** → Should NOT show surface finishing or curing inclusions
5. **Mixed scopes (Demolition + Raft Slab)** → Should show combined relevant items

---

## Risk Assessment

**Low Risk**: The existing implementation is fundamentally sound. The missing mappings are minor gaps that may cause some inclusions to be missing from certain scope combinations, but won't show irrelevant items (which was the original reported issue).

