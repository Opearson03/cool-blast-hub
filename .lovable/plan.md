
# Fix: Scopes Appearing in Payment Terms Section of PDF Quotes

## Problem

Scopes are incorrectly appearing within the "Payment Terms" section on Page 2 of the PDF quotes instead of being properly positioned as line items on Page 1 above the totals.

## Root Cause Analysis

After reviewing the `PrintableEstimate.tsx` file, I found that there are **two** scope-related components rendering on Page 1:

1. **`ScopeLineItemsSection`** (lines 150-271) - Displays scopes as line items with technical descriptions
2. **`ScopeBreakdownSection`** (lines 273-354) - Displays a quantitative table with volume/area breakdown

Both components render on Page 1, and the `ScopeBreakdownSection` appears **after** `ScopeLineItemsSection`. When there are multiple scopes, this second table can overflow onto Page 2 where it visually appears to be part of the "Payment Terms" section.

Additionally, the `ScopeBreakdownSection` only renders when there are 2+ scopes (line 289: `if (scopeBreakdowns.length <= 1) return null`), but when it does render, it creates duplicate scope information that bleeds across the page break.

## Solution

### 1. Remove the Duplicate ScopeBreakdownSection

Since `ScopeLineItemsSection` now serves as the primary scope display (with technical specs), the `ScopeBreakdownSection` is redundant and causes the overflow issue.

**Action:** Remove the `ScopeBreakdownSection` component calls from all three templates.

### 2. Ensure Page Break Isolation

Add CSS to ensure content before the page break stays on Page 1 and the Terms page starts cleanly on Page 2.

---

## Technical Changes

### File: `src/components/estimates/PrintableEstimate.tsx`

#### Change 1: Remove ScopeBreakdownSection from Modern Template
**Lines 844-851** - Delete these lines:
```typescript
// DELETE THIS BLOCK
{/* Scope Breakdown Table (if multiple scopes) */}
<ScopeBreakdownSection 
  data={quotePDFData} 
  primaryColor={primaryColor} 
  secondaryColor={secondaryColor}
  template="modern"
  formatCurrency={formatCurrency}
/>
```

#### Change 2: Remove ScopeBreakdownSection from Minimal Template
**Lines 1000-1007** - Delete these lines:
```typescript
// DELETE THIS BLOCK
{/* Scope Breakdown */}
<ScopeBreakdownSection 
  data={quotePDFData} 
  primaryColor={primaryColor} 
  secondaryColor={secondaryColor}
  template="minimal"
  formatCurrency={formatCurrency}
/>
```

#### Change 3: Remove ScopeBreakdownSection from Classic Template
**Lines 1158-1165** - Delete these lines:
```typescript
// DELETE THIS BLOCK
{/* Scope Breakdown */}
<ScopeBreakdownSection 
  data={quotePDFData} 
  primaryColor={primaryColor} 
  secondaryColor={secondaryColor}
  template="classic"
  formatCurrency={formatCurrency}
/>
```

#### Change 4: (Optional Cleanup) Remove the ScopeBreakdownSection Component Definition
**Lines 273-354** - The entire component can be removed since it's no longer used.

---

## Impact

| Before | After |
|--------|-------|
| Two scope tables on Page 1 (line items + breakdown) | Single scope line items table on Page 1 |
| Second scope table overflows into Page 2 Terms section | Clean page break, no overflow |
| Duplicate scope information | Single, consolidated scope presentation |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/estimates/PrintableEstimate.tsx` | Remove 3 `ScopeBreakdownSection` calls from templates + optionally remove component definition |

---

## Visual Result

**Page 1 (Commercial):**
```text
├── Header (logo, quote number, date)
├── Client & Site info
├── Project Summary (volume, area, etc.)
├── Scope of Works (line items with technical specs)
├── Additional Line Items (if any)
├── Totals (Subtotal, GST, Total)
└── Footer
```

**Page 2 (Terms & Conditions):**
```text
├── Mini Header (logo + "Terms & Conditions")
├── Payment Terms
├── Exclusions
├── Acceptance (signature section)
└── Footer
```

Scopes will no longer bleed into the Payment Terms section.
