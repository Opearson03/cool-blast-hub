
# Fix Manual Input for Strip Footings and Retaining Wall Footings

## Problem Summary

When users try to manually enter or override dimensions (Width, Depth) for strip footings and retaining wall footings, the input loses focus and changes don't persist correctly. This occurs because:

1. **React Key Changes on Every Keystroke**: The component uses `key={groupKey}` where `groupKey = typeName-dimension1-dimension2`. When a user changes dimension1 from 450 to 500, the key changes from `SF1-450-300` to `SF1-500-300`, causing React to unmount and remount the entire group component.

2. **Expanded State Lost**: The `expandedTypes` Set uses keys that include dimensions. When dimensions change, the new key isn't in the Set, so the section collapses.

3. **Input Focus Lost**: Both issues above cause the input field to lose focus during typing, making manual entry frustrating or impossible.

---

## Root Cause Analysis

In `MultiLinearTypeInput.tsx`:

```typescript
// Line 357: groupKey includes dimensions - changes on every input
const groupKey = `${group.typeName}-${group.dimension1}-${group.dimension2}`;

// Line 356: expandedTypes check uses dimension-based key
const isExpanded = expandedTypes.has(`${group.typeName}-${group.dimension1}-${group.dimension2}`);

// Line 360: React key causes remount when dimensions change
<Collapsible key={groupKey} ...>
```

---

## Solution

### 1. Use Stable Keys for React Components

Change the `key` prop to use only the type name (or a stable identifier), not the dimensions:

```typescript
// Before
const groupKey = `${group.typeName}-${group.dimension1}-${group.dimension2}`;

// After - Use only typeName for stable key
const groupKey = group.typeName;
```

### 2. Fix Expanded State Tracking

Update the expanded state to track by type name only:

```typescript
// Before
const isExpanded = expandedTypes.has(`${group.typeName}-${group.dimension1}-${group.dimension2}`);

// After
const isExpanded = expandedTypes.has(group.typeName);
```

### 3. Update Toggle Function

Ensure `toggleExpand` uses the stable key:

```typescript
const toggleExpand = (typeName: string) => {
  setExpandedTypes(prev => {
    const next = new Set(prev);
    if (next.has(typeName)) {
      next.delete(typeName);
    } else {
      next.add(typeName);
    }
    return next;
  });
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/MultiLinearTypeInput.tsx` | Use stable keys for React components and expanded state tracking |

---

## Detailed Changes

### Lines 355-363

**Before:**
```typescript
{groups.map((group) => {
  const isExpanded = expandedTypes.has(`${group.typeName}-${group.dimension1}-${group.dimension2}`);
  const groupKey = `${group.typeName}-${group.dimension1}-${group.dimension2}`;
  
  return (
    <Collapsible
      key={groupKey}
      open={isExpanded}
      onOpenChange={() => toggleExpand(groupKey)}
    >
```

**After:**
```typescript
{groups.map((group) => {
  // Use stable key based only on typeName to prevent remounting when dimensions change
  const stableKey = group.typeName;
  const isExpanded = expandedTypes.has(stableKey);
  
  return (
    <Collapsible
      key={stableKey}
      open={isExpanded}
      onOpenChange={() => toggleExpand(stableKey)}
    >
```

---

## Edge Case: Multiple Groups with Same Type Name

The current grouping logic creates separate groups when the same type name has different dimensions (e.g., if someone manually edits one segment's dimensions differently). With the stable key fix:

- This scenario would now merge those segments visually (same key = same component)
- However, the `updateGroupDimensions` function uses `matchesGroup` which checks dimensions, so updates would still only apply to matching segments

This is actually the correct behavior since changing dimensions at the group level should update all segments of that type.

---

## Before / After

**Before (Broken):**
```text
1. User expands SF1 group
2. User clicks on Width input (value: 450)
3. User types "5" to change 450 to 4505 (or tries to clear and type 500)
4. onChange fires, sections update with new dimension1
5. groups recalculates, groupKey changes from "SF1-450-300" to "SF1-4505-300"
6. React unmounts old Collapsible, mounts new one
7. Input loses focus, user can't continue typing
8. expandedTypes still has "SF1-450-300", so new group shows collapsed
```

**After (Fixed):**
```text
1. User expands SF1 group (key: "SF1")
2. User clicks on Width input (value: 450)
3. User types to change value
4. onChange fires, sections update with new dimension
5. groups recalculates, but key remains "SF1"
6. React updates existing Collapsible (no remount)
7. Input retains focus
8. expandedTypes has "SF1", section stays expanded
```

---

## Impact

- Strip footings and retaining wall footings will allow proper manual dimension input
- Kerbs/channels and retaining walls (other linear scopes) will also benefit
- No functional changes to calculations
- Grouping by type name still works correctly
- Segment-level edits are unaffected (they already use stable `segment.id` keys)
