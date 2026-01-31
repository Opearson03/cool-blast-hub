

# Remove "By Category" Section from Cost Summary Sidebars

## Summary

Remove the "By Category" breakdown (Labour, Materials, Plant & Equipment, Subcontractors, Other) from both the desktop and mobile cost summary components. The "By Module" breakdown and the totals section will be kept.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/calculators/ModularCostSummary.tsx` | Remove category calculation logic and "By Category" UI section |
| `src/components/estimates/calculators/MobileCostSummaryBar.tsx` | Remove category calculation logic and "By Category" UI section |

---

## Technical Changes

### 1. `ModularCostSummary.tsx`

**Remove lines 26-70** - Delete all category total calculations:
```typescript
// DELETE: labourTotal, materialsTotal, plantTotal, subcontractorTotal, otherTotal
```

**Remove lines 98-137** - Delete the separator and "By Category" section:
```typescript
// DELETE: <Separator /> and the entire category breakdown div
```

### 2. `MobileCostSummaryBar.tsx`

**Remove lines 38-73** - Delete all category total calculations:
```typescript
// DELETE: labourTotal, materialsTotal, plantTotal, subcontractorTotal
```

**Remove lines 140-173** - Delete the separator and "By Category" section:
```typescript
// DELETE: <Separator /> and the entire category breakdown div
```

---

## Before / After

**Before:**
```text
┌─────────────────────────────┐
│ Cost Summary                │
├─────────────────────────────┤
│ BY MODULE                   │
│   Reinforcement    $5,000   │
│   Concrete Supply  $3,000   │
├─────────────────────────────┤
│ BY CATEGORY        ← DELETE │
│   Labour           $4,000   │
│   Materials        $3,500   │
│   Plant            $500     │
├─────────────────────────────┤
│ Subtotal           $8,000   │
│ Margin (15%)       $1,200   │
│ GST (10%)          $920     │
│ Total              $10,120  │
└─────────────────────────────┘
```

**After:**
```text
┌─────────────────────────────┐
│ Cost Summary                │
├─────────────────────────────┤
│ BY MODULE                   │
│   Reinforcement    $5,000   │
│   Concrete Supply  $3,000   │
├─────────────────────────────┤
│ Subtotal           $8,000   │
│ Margin (15%)       $1,200   │
│ GST (10%)          $920     │
│ Total              $10,120  │
└─────────────────────────────┘
```

---

## What Stays Unchanged

- "By Module" cost breakdown
- Concrete Volume display
- Subtotal, Margin, GST, and Total calculations
- Rate per m² display
- All calculation logic and data structures

