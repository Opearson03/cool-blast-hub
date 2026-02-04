
# Plan: Add Standard Industry Exclusions with Auto-Generation Logic

## Overview
Add the following exclusions to the estimator system with intelligent auto-generation based on user selections:

| Exclusion | Auto-Add Trigger |
|-----------|------------------|
| Dewatering | Always (default scope exclusion) |
| Blinding concrete, soft spots or unsuitable ground | Always (default scope exclusion) |
| Rock excavation | When any excavation is enabled |
| Back filling or compaction | When detailed excavation is enabled |
| Subgrade preparation | When road base OR crusher dust is NOT included |
| Temporary shoring or structures | Always (default scope exclusion) |
| Surveyor costs | Always (default scope exclusion) |
| Traffic control | Always (default scope exclusion) |
| Overhead services | Always (default scope exclusion) |

## Current Exclusion System Architecture

The exclusion system works at two levels:
1. **Scope-level defaults** (`defaultExclusions` in each scope definition) - always added
2. **Module-level dynamic** (`getExclusions()` function in each module) - conditional based on user answers

## Implementation Details

### 1. Add Global Exclusions to All Scopes
**File:** `src/lib/estimate-components/scopes.ts`

Add these exclusions to the `defaultExclusions` array for all relevant scopes (slabs, footings, piers, driveways, etc.):

```typescript
defaultExclusions: [
  // Existing exclusions...
  { id: 'dewatering', text: 'Dewatering of excavations', moduleId: 'scope' },
  { id: 'unsuitable_ground', text: 'Blinding concrete, soft spots or unsuitable ground conditions', moduleId: 'scope' },
  { id: 'temporary_shoring', text: 'Temporary shoring or support structures', moduleId: 'scope' },
  { id: 'surveyor', text: 'Surveyor costs and site setout', moduleId: 'scope' },
  { id: 'traffic_control', text: 'Traffic control and management', moduleId: 'scope' },
  { id: 'overhead_services', text: 'Protection or relocation of overhead services', moduleId: 'scope' },
]
```

### 2. Add Excavation-Related Exclusions to Excavation Module
**File:** `src/lib/estimate-components/modules/excavation.ts`

Update the `getExclusions` function to add conditional exclusions:

```typescript
getExclusions: (answers, scopeData): ExclusionItem[] => {
  const exclusions: ExclusionItem[] = [];
  // ... existing logic ...

  // Add rock excavation exclusion when any excavation is enabled
  if (bulkEnabled || detailedEnabled) {
    exclusions.push({
      id: 'rock_excavation',
      text: 'Rock excavation or rock breaking',
      moduleId: 'excavation',
    });
  }

  // Add backfill exclusion when detailed excavation is enabled
  if (detailedEnabled) {
    exclusions.push({
      id: 'backfill',
      text: 'Backfilling or compaction of excavations',
      moduleId: 'excavation',
    });
  }

  return exclusions;
}
```

### 3. Add Subgrade Preparation Exclusion to Base Preparation Module
**File:** `src/lib/estimate-components/modules/base-preparation.ts`

Update the `getExclusions` function:

```typescript
getExclusions: (answers): ExclusionItem[] => {
  const exclusions: ExclusionItem[] = [];
  
  // If neither crusher dust nor road base is included, add subgrade exclusion
  if (!answers.crusher_dust_required && !answers.road_base_required) {
    exclusions.push({
      id: 'subgrade_preparation',
      text: 'Subgrade preparation, levelling and compaction',
      moduleId: 'base-preparation',
    });
  }

  // ... existing exclusions ...
  return exclusions;
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/estimate-components/scopes.ts` | Add 6 new default exclusions to: PIERS_SCOPE, STANDARD_SLAB_SCOPE, RAFT_SLAB_SCOPE, WAFFLE_POD_SCOPE, DRIVEWAY_SCOPE, CROSSOVERS_SCOPE, PATHS_SURROUNDS_SCOPE, STRIP_FOOTINGS_SCOPE, RETAINING_WALL_FOOTINGS_SCOPE, PAD_FOOTINGS_SCOPE, BOLLARDS_SCOPE |
| `src/lib/estimate-components/modules/excavation.ts` | Add rock excavation and backfill exclusions when excavation is enabled |
| `src/lib/estimate-components/modules/base-preparation.ts` | Add subgrade preparation exclusion when no base materials are included |

## Exclusion Trigger Summary

```text
┌─────────────────────────────────────────────────────────────────┐
│ ALWAYS INCLUDED (Scope Defaults)                                │
├─────────────────────────────────────────────────────────────────┤
│ • Dewatering of excavations                                     │
│ • Blinding concrete, soft spots or unsuitable ground            │
│ • Temporary shoring or support structures                       │
│ • Surveyor costs and site setout                                │
│ • Traffic control and management                                │
│ • Protection or relocation of overhead services                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CONDITIONAL (Module-Based)                                      │
├─────────────────────────────────────────────────────────────────┤
│ Excavation Module:                                              │
│ • Rock excavation → when bulk OR detailed excavation ON         │
│ • Backfilling/compaction → when detailed excavation ON          │
│                                                                 │
│ Base Preparation Module:                                        │
│ • Subgrade preparation → when crusher dust AND road base OFF    │
└─────────────────────────────────────────────────────────────────┘
```

## Expected Behaviour

1. **New Estimate Created**: User sees 6 default exclusions automatically
2. **Excavation Module Opened**: When user enables excavation, rock excavation exclusion auto-adds
3. **Detailed Excavation Enabled**: Backfill exclusion auto-adds
4. **Base Prep Module**: If user doesn't include crusher dust or road base, subgrade preparation exclusion appears
5. **All Exclusions**: Visible in the Exclusions Summary card and printed on PDF quotes
