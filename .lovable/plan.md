
# Fix: Round Area and Length Values in Quote Description

## Problem

The "Summary of Customer Requirements" section on the quote PDF shows unrounded numbers like "Raft Slab: 126.05941839376057m²" because the raw `_actualArea` value from plan takeoff is stored directly in the description without any formatting.

## Root Cause

In `EstimateFormDialog.tsx` (line 564), the area value from `scopeAnswers` is interpolated directly into the description string without rounding:

```typescript
desc = `${state.scopeAnswers.area}m²`;
```

When areas come from takeoff measurements, they have full floating-point precision (e.g., 126.05941839376057). This unrounded value gets saved to the database as part of the estimate description and then displayed on the quote.

## Fix

Round all measurement values in the description builder to 2 decimal places.

### File: `src/components/estimates/EstimateFormDialog.tsx`

**Line 564** -- Round the area value:
```typescript
// Before
desc = `${state.scopeAnswers.area}m²`;

// After
desc = `${Number(state.scopeAnswers.area).toFixed(2)}m²`;
```

**Line 568** -- Round the length value (same potential issue):
```typescript
// Before
desc = `${state.scopeAnswers.total_length}m`;

// After
desc = `${Number(state.scopeAnswers.total_length).toFixed(2)}m`;
```

### Scope

- Only affects newly saved or re-saved estimates (the description is rebuilt on each save)
- No database changes needed
- Two lines changed in one file
