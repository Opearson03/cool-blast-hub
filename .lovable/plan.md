

# Fix: Footing Chairs Not Appearing in BOQ

## Problem Identified

After reviewing the codebase, I found that **footing chair costs are correctly calculated and added to the estimate total**, but they are **missing from the Bill of Quantities (BOQ)**.

### Root Cause

The BOQ generator (`src/lib/boq-generator.ts`) only handles **layer chairs** (chairs between TM layers when `tm_layers > 1`), but does not include the primary **footing TM chairs** that are configured via the UI.

```text
COST CALCULATION (Working ✓)
──────────────────────────────────────────────────────────────
src/lib/estimate-components/modules/reinforcement-footing.ts

Lines 172-216: Correctly calculates chairs when chairs_enabled = true
- Reads chairs_per_m from each section  
- Calculates total chairs needed
- Adds cost as "Footing TM Chairs (X × 25)" line item
- Cost flows into estimate total


BOQ GENERATION (Broken ✗)
──────────────────────────────────────────────────────────────
src/lib/boq-generator.ts

Lines 1120-1152: Only handles LAYER chairs (for 2-layer TM)
- Checks: if tmLayers <= 1, return  ← Skips single-layer TM!
- Checks: if !section.layer_chairs_enabled, return

MISSING: No code to add regular footing chairs when chairs_enabled = true
```

---

## Solution

Add a new section to the BOQ generator that extracts footing chair materials, matching the logic in the calculation module.

### Technical Changes

**File: `src/lib/boq-generator.ts`**

**Location:** After line 1118 (tie wire section), before the layer chairs section

**Add new code block:**

```typescript
// ═══════════════════════════════════════════════════════════════
// FOOTING TM CHAIRS (primary chairs for TM support)
// ═══════════════════════════════════════════════════════════════
const footings = scopeAnswers.linearSections || scopeAnswers.footings || [];
if (Array.isArray(footings) && footings.length > 0) {
  let totalFootingChairs = 0;
  let footingChairPrice = 12.50;
  let footingChairType = '5065C';
  
  footings.forEach((section: any) => {
    if (!section.chairs_enabled) return;
    
    const length = section._actualLength || Number(section.length) || 0;
    if (length <= 0) return;
    
    const chairsPerM = section.chairs_per_m ?? 1.4;
    footingChairPrice = section.chair_price_per_bag ?? 12.50;
    footingChairType = section.chair_type || '5065C';
    totalFootingChairs += Math.ceil(length * chairsPerM);
  });
  
  if (totalFootingChairs > 0) {
    const bags = Math.ceil(totalFootingChairs / 25);
    const chairLabels: Record<string, string> = {
      'TMCHAIR': 'TM Chairs',
      '2540C': '25-40mm',
      '5065C': '50-65mm',
      '7590C': '75-90mm',
      '100120C': '100-120mm',
      '125150C': '125-150mm',
    };
    
    addItem(
      "reinforcement",
      `Footing Chairs (${chairLabels[footingChairType] || footingChairType})`,
      bags,
      "bags",
      footingChairPrice,
      `${bags} × 25 pcs`
    );
  }
}
```

---

## Verification Checklist

After implementation, verify:

1. **Cost Calculation** (already working):
   - Enable chairs on a footing type
   - Set chair type and chairs per metre
   - Confirm cost appears in the estimate breakdown

2. **BOQ Generation** (needs fix):
   - Generate BOQ for a job with footing chairs
   - Verify "Footing Chairs" line item appears with correct:
     - Quantity (bags of 25)
     - Chair type label
     - Unit price

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/boq-generator.ts` | Add footing chairs section after tie wire, before layer chairs (~line 1119) |

---

## Impact

- **Estimates**: No change (chair costs already calculated correctly)
- **BOQ**: Footing chairs will now appear in the materials list
- **Purchase Orders**: Users can now order chairs via the BOQ order wizard

