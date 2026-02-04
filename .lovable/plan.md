# Plan: Add Standard Industry Exclusions with Auto-Generation Logic

## ✅ COMPLETED

All exclusions have been implemented as specified.

## Implementation Summary

### 1. Global Exclusions Added to All Scopes
The following 6 exclusions were added to `defaultExclusions` in all relevant scopes:
- Dewatering of excavations
- Blinding concrete, soft spots or unsuitable ground conditions
- Temporary shoring or support structures
- Surveyor costs and site setout
- Traffic control and management
- Protection or relocation of overhead services

**Scopes Updated:**
- PIERS_SCOPE
- STANDARD_SLAB_SCOPE
- RAFT_SLAB_SCOPE
- WAFFLE_POD_SCOPE
- DRIVEWAY_SCOPE
- CROSSOVERS_SCOPE
- PATHS_SURROUNDS_SCOPE
- STRIP_FOOTINGS_SCOPE
- RETAINING_WALL_FOOTINGS_SCOPE
- PAD_FOOTINGS_SCOPE
- BOLLARDS_SCOPE

### 2. Excavation Module Conditional Exclusions
Added to `getExclusions()` in `src/lib/estimate-components/modules/excavation.ts`:
- **Rock excavation or rock breaking** → Added when bulk OR detailed excavation is enabled
- **Backfilling or compaction of excavations** → Added when detailed excavation is enabled

### 3. Base Preparation Module Conditional Exclusion
Added to `getExclusions()` in `src/lib/estimate-components/modules/base-preparation.ts`:
- **Subgrade preparation, levelling and compaction** → Added when neither crusher dust NOR road base is included

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
