
# Plan: Fix Manual Input Response Issues in Configure Pages

## Overview
The manual input fields on the configure pages for Slab on Ground, Raft Slab, and Waffle Pod Slab are not responding properly due to several state management issues in the `ModularCalculator` component. These issues cause unexpected re-renders, value overwrites, and potential infinite update loops.

---

## Root Cause Analysis

### Issue 1: Aggressive Auto-Calculation Overwriting Manual Inputs (Waffle Pod)

**Location**: `src/components/estimates/calculators/ModularCalculator.tsx` (lines 577-652)

The auto-calculation `useEffect` for waffle pod accessories runs on every change to `top_slab_thickness`, `pod_count`, and `perimeter`. It unconditionally overwrites manually entered values for:
- `bar_chairs_count` (always overwrites if value differs from calculated)
- `tm_chairs_count` (always overwrites if value differs from calculated)
- `spacer_4way_count` (overwrites if value is 0 or falsy)
- `spacer_2way_count` (overwrites if value is 0 or falsy)

**Problem**: When a user types in a manual value, the next render triggers this `useEffect`, which detects the value differs from the calculated value and immediately overwrites it.

```typescript
// Current problematic code (line 631-634):
const calculatedBarChairs = podCount * 3;
if (!scopeAnswers.bar_chairs_count || scopeAnswers.bar_chairs_count !== calculatedBarChairs) {
  updates.bar_chairs_count = calculatedBarChairs;  // Always overwrites!
}
```

---

### Issue 2: `useEffect` Dependency on `moduleAnswers` Causes Potential Infinite Loops

**Location**: `src/components/estimates/calculators/ModularCalculator.tsx` (lines 403-476)

The derived values `useEffect` has `moduleAnswers` in its dependency array while also calling `setModuleAnswers()` inside:

```typescript
useEffect(() => {
  // ... derives values and updates moduleAnswers
  if (hasChanges) {
    setModuleAnswers(newModuleAnswers);  // Triggers re-run of this effect!
  }
}, [scopeData, priceMap, modules, priceListLoading, priceListItems, userOverrides, moduleAnswers]);
```

This can cause:
- Rapid consecutive re-renders
- Input focus loss
- Values appearing to "flicker" or not respond

---

### Issue 3: Missing User Override Tracking for Waffle Pod Fields

**Location**: `src/components/estimates/calculators/ModularCalculator.tsx`

The `userOverrides` state tracks manually edited module-level fields, but **scope-level fields** (like waffle pod accessories) have no such protection. When a user manually edits `pod_count`, `bar_chairs_count`, etc., there's no mechanism to prevent the auto-calculation from overwriting them.

---

### Issue 4: Input Value Conversion Creates Unnecessary Re-renders

**Location**: `src/components/estimates/calculators/WafflePodConfigCard.tsx`

The `onChange` handler immediately converts empty strings to default values, which can trigger unexpected state updates:

```typescript
onChange={(e) => onChange('top_slab_thickness', Number(e.target.value) || 85)}
```

When the user clears the field to type a new value, it immediately sets to `85`, making it impossible to type values starting with a different digit.

---

## Implementation Plan

### Step 1: Add User Override Tracking for Scope-Level Fields

**File**: `src/components/estimates/calculators/ModularCalculator.tsx`

Add a new state to track which scope-level fields have been manually edited:

```typescript
const [scopeUserOverrides, setScopeUserOverrides] = useState<Set<string>>(new Set());
```

Modify `handleScopeAnswerChange` to track overrides:

```typescript
const handleScopeAnswerChange = (questionId: string, value: any) => {
  // Mark field as user-edited
  setScopeUserOverrides(prev => new Set([...prev, questionId]));
  
  // ... existing logic
  setScopeAnswers((prev) => ({ ...prev, [questionId]: value }));
};
```

---

### Step 2: Fix Waffle Pod Auto-Calculation to Respect Manual Overrides

**File**: `src/components/estimates/calculators/ModularCalculator.tsx`

Update the waffle pod auto-calculation `useEffect` to check for user overrides before updating:

```typescript
useEffect(() => {
  if (scope.id !== 'waffle_pod') return;
  
  const updates: Record<string, any> = {};
  
  // Only auto-calculate if user hasn't manually edited the field
  if (podCount > 0 && !scopeUserOverrides.has('bar_chairs_count')) {
    const calculatedBarChairs = podCount * 3;
    if (scopeAnswers.bar_chairs_count !== calculatedBarChairs) {
      updates.bar_chairs_count = calculatedBarChairs;
    }
  }
  
  if (perimeter > 0 && !scopeUserOverrides.has('tm_chairs_count')) {
    const calculatedTmChairs = Math.round(perimeter / 1.2);
    if (scopeAnswers.tm_chairs_count !== calculatedTmChairs) {
      updates.tm_chairs_count = calculatedTmChairs;
    }
  }
  
  // ... similar for spacer counts
  
  if (Object.keys(updates).length > 0) {
    setScopeAnswers(prev => ({ ...prev, ...updates }));
  }
}, [scope.id, scopeAnswers.top_slab_thickness, scopeAnswers.pod_count, scopeAnswers.perimeter, scopeUserOverrides]);
```

---

### Step 3: Fix `moduleAnswers` Dependency Loop

**File**: `src/components/estimates/calculators/ModularCalculator.tsx`

Remove `moduleAnswers` from the dependency array and use the functional update pattern to access current values:

```typescript
useEffect(() => {
  if (priceListLoading || !priceListItems) return;

  setModuleAnswers(prevModuleAnswers => {
    const newModuleAnswers = { ...prevModuleAnswers };
    let hasChanges = false;

    modules.forEach((module) => {
      const currentModuleAnswers = prevModuleAnswers[module.id] || {};
      
      module.questions.forEach((question) => {
        const isOverridden = userOverrides[module.id]?.has(question.id);
        const isVisible = !question.showIf || question.showIf(currentModuleAnswers, scopeData);
        
        if (!isOverridden && isVisible) {
          // ... derive values logic
        }
      });
    });

    return hasChanges ? newModuleAnswers : prevModuleAnswers;
  });
}, [scopeData, priceMap, modules, priceListLoading, priceListItems, userOverrides]);
```

---

### Step 4: Fix Empty Input Handling in WafflePodConfigCard

**File**: `src/components/estimates/calculators/WafflePodConfigCard.tsx`

Allow empty values during editing to prevent premature conversion:

```typescript
// Before:
onChange={(e) => onChange('top_slab_thickness', Number(e.target.value) || 85)}

// After:
onChange={(e) => {
  const val = e.target.value;
  onChange('top_slab_thickness', val === '' ? '' : Number(val));
}}
onBlur={(e) => {
  // Apply default on blur if empty
  if (!e.target.value) {
    onChange('top_slab_thickness', 85);
  }
}}
```

Apply similar pattern to all numeric inputs in the component.

---

### Step 5: Add `useCallback` Memoization for Change Handlers

**File**: `src/components/estimates/calculators/ModularCalculator.tsx`

Wrap change handlers in `useCallback` to prevent unnecessary re-renders:

```typescript
const handleScopeAnswerChange = useCallback((questionId: string, value: any) => {
  setScopeUserOverrides(prev => new Set([...prev, questionId]));
  setScopeAnswers((prev) => ({ ...prev, [questionId]: value }));
}, []);

const handleAreasChange = useCallback((areas: MeasurementArea[]) => {
  // ... existing logic
}, [scope.id]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/ModularCalculator.tsx` | Add `scopeUserOverrides` state, fix `useEffect` dependencies, wrap handlers in `useCallback` |
| `src/components/estimates/calculators/WafflePodConfigCard.tsx` | Fix empty input handling, add `onBlur` defaults |

---

## Testing Checklist

After implementation:

1. **Waffle Pod Slab**:
   - [ ] Manually edit Pod Count - value persists without being overwritten
   - [ ] Manually edit Bar Chairs Count - value persists
   - [ ] Manually edit TM Chairs Count - value persists
   - [ ] Clear and retype Top Slab Thickness - can type any value

2. **Raft Slab**:
   - [ ] Edit area dimensions - values persist without flickering
   - [ ] Edit thickness - input responds immediately
   - [ ] Switch toggles work smoothly

3. **Slab on Ground**:
   - [ ] Edit area dimensions - values persist
   - [ ] Edit thickness - input responds immediately

4. **General**:
   - [ ] No console errors during editing
   - [ ] Price calculations update after edits complete
   - [ ] Values save correctly when navigating away
