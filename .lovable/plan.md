
# Fix: Duplicate Scope Names in PDF Quote Summary

## Problem

In the PDF Quote "Summary of Customer Requirements" section, scopes are being displayed with duplicated names like "Piers: Piers" instead of showing meaningful scope details.

```text
┌────────────────────────────────────────────────┐
│  SUMMARY OF CUSTOMER REQUIREMENTS              │
├────────────────────────────────────────────────┤
│  28 John Street South Melbourne                │
│  Piers: Piers                        ← Bug!    │
└────────────────────────────────────────────────┘
```

## Root Cause

The issue originates in `EstimateFormDialog.tsx` where the `estimate.description` field is built:

1. **Line 559-573**: When calculating `scopeTotals`, if no specific measurements exist (area, num_piers, total_length), the description defaults to the scope name:
   ```typescript
   let desc = scopeDef?.name || scopeType;  // e.g., "Piers"
   ```

2. **Lines 1242-1245**: The estimate description is built by combining label + description:
   ```typescript
   `${label}: ${description || 'Not configured'}`
   // Results in: "Piers: Piers"
   ```

3. **PrintableEstimate.tsx line 842**: The PDF directly renders `estimate.description`, showing the duplicate.

## Solution

Fix the description building logic in `EstimateFormDialog.tsx` to avoid duplication. When the scope description equals the scope name, use a more meaningful fallback or skip the redundant label.

### Technical Changes

**File: `src/components/estimates/EstimateFormDialog.tsx`**

**Change 1: Fix scopeTotals description building (~lines 559-573)**

Instead of defaulting to the scope name, set description to empty string or a meaningful placeholder when no measurements are available:

```typescript
// Before
let desc = scopeDef?.name || scopeType;
if (state.scopeAnswers) {
  if (state.scopeAnswers.area) {
    desc = `${state.scopeAnswers.area}m²`;
  } else if (state.scopeAnswers.num_piers) {
    desc = `${state.scopeAnswers.num_piers} piers`;
  } else if (state.scopeAnswers.total_length) {
    desc = `${state.scopeAnswers.total_length}m`;
  }
}

// After
let desc = "";
if (state.scopeAnswers) {
  if (state.scopeAnswers.area) {
    desc = `${state.scopeAnswers.area}m²`;
  } else if (state.scopeAnswers.num_piers) {
    desc = `${state.scopeAnswers.num_piers} piers`;
  } else if (state.scopeAnswers.total_length) {
    desc = `${state.scopeAnswers.total_length}m`;
  }
  // Could also add more measurement fallbacks here if needed
}
```

**Change 2: Fix description assembly (~lines 1242-1246)**

When the description is empty or matches the scope name, only show the label:

```typescript
// Before
const descriptionParts = selectedScopesArray.map(scope => {
  const label = getScopeLabel(scope);
  const { description } = scopeTotals[scope];
  return `${label}: ${description || 'Not configured'}`;
});

// After
const descriptionParts = selectedScopesArray.map(scope => {
  const label = getScopeLabel(scope);
  const { description } = scopeTotals[scope];
  // If no meaningful description, just show the label
  return description ? `${label}: ${description}` : label;
});
```

## Files to Change

| File | Change |
|------|--------|
| `src/components/estimates/EstimateFormDialog.tsx` | Fix description fallback logic in scopeTotals (~line 560) and description assembly (~line 1245) |

## Expected Result

After the fix:
- Scopes with measurements will show: "Piers: 12 piers"
- Scopes without measurements will show: "Piers" (no duplication)

```text
┌────────────────────────────────────────────────┐
│  SUMMARY OF CUSTOMER REQUIREMENTS              │
├────────────────────────────────────────────────┤
│  28 John Street South Melbourne                │
│  Piers                               ← Fixed!  │
└────────────────────────────────────────────────┘
```

Or with measurements:
```text
│  Piers: 12 piers                     ← Better! │
```
