

# Plan: Convert American English Spellings to British/Australian English

## Summary

I've scanned the PourHub codebase and identified all instances of American English spelling that should be changed to British/Australian English. The changes affect user-facing text only - technical terms (like CSS classes, component names, and code comments) are excluded.

---

## Findings

### Definite Changes Required (User-Facing Text)

| File | Current (American) | Change To (British/Australian) | Line |
|------|-------------------|-------------------------------|------|
| `src/pages/Index.tsx` | "Ready to Get Organized?" | "Ready to Get Organised?" | 337 |
| `src/pages/admin/AdminCrews.tsx` | "organize your team" | "organise your team" | 158 |
| `src/pages/Index.tsx` | "Customizable price lists" | "Customisable price lists" | 276 |
| `src/components/onboarding/OnboardingWizard.tsx` | "Customize how your estimates look" | "Customise how your estimates look" | 375 |
| `src/pages/admin/AdminSettings.tsx` | "Customize your logo, colors, and quote template style" | "Customise your logo, colours, and quote template style" | 512 |
| `src/components/estimates/PrintableEstimate.tsx` | "authorize commencement" (x3) | "authorise commencement" (x3) | 596, 620, 1268 |
| `src/components/estimates/PrintableEstimate.tsx` | "Authorization" (header text, x2) | "Authorisation" (x2) | 612, 616, 1264 |
| `src/components/estimates/PrintableEstimate.tsx` | "Authorized Signature" | "Authorised Signature" | 625, 1273 |
| `src/pages/public/SignVariation.tsx` | "authorizes the additional works" | "authorises the additional works" | 459 |
| `src/components/contacts/ContactFormDialog.tsx` | "Laborer" | "Labourer" | 46 |
| `src/hooks/usePriceList.ts` | "catalog" (in toast message) | "catalogue" | 121 |
| `src/pages/PrivacyPolicy.tsx` | "optimize our services" | "optimise our services" | 47 |
| `src/lib/estimate-components/modules/architectural-formwork.ts` | "Specialized formwork" | "Specialised formwork" | 1, 7 |
| `src/components/estimates/calculators/ModularCalculator.tsx` | "summarized line items" | "summarised line items" | 1299 |
| `src/components/staff/SubscribersTable.tsx` | "Canceled" (status label) | "Cancelled" | 84 |

---

### Items NOT Changed (With Reasoning)

| Pattern | Reason for Exclusion |
|---------|---------------------|
| `color` in CSS classes (`bg-gray-100`, `text-primary-foreground`) | Tailwind CSS framework classes - cannot be changed |
| `center` in CSS classes (`items-center`, `justify-center`) | Tailwind CSS framework classes - cannot be changed |
| `Dialog` component names | React component naming convention - technical, not user-facing |
| `behavior` in code comments | Technical comments, not user-facing |
| `canceled` in function names (`handleCancelEdit`, `cancelEditing`) | JavaScript function names - technical, not user-facing |
| `catalogue` variable names | Internal variable naming is acceptable as-is |
| `meter` / `perimeter` | These are correct technical/mathematical terms (not the same as "metre" for unit of length) |
| `finalize` / `finalizeMutation` | Technical function names, though the toast message "Quote finalized" should be changed |
| `grey` (in product names) | Already British spelling - correct! |
| `cancelled` (in statuses) | Already British spelling - correct! |

---

### Additional Finding: Quote Finalized Message

| File | Current | Change To |
|------|---------|-----------|
| `src/components/estimates/EstimateFormDialog.tsx` | "Quote finalized" (toast) | "Quote finalised" | 1347 |
| `src/pages/admin/AdminEstimates.tsx` | "Finalized" (status label) | "Finalised" | 63, 251 |
| `src/components/estimates/EstimateDetailSheet.tsx` | "Finalized" (status label) | "Finalised" | 81 |

---

## Technical Details

### Files to Modify

1. **`src/pages/Index.tsx`** (2 changes)
   - Line 337: "Organized" → "Organised"
   - Line 276: "Customizable" → "Customisable"

2. **`src/pages/admin/AdminCrews.tsx`** (1 change)
   - Line 158: "organize" → "organise"

3. **`src/components/onboarding/OnboardingWizard.tsx`** (1 change)
   - Line 375: "Customize" → "Customise"

4. **`src/pages/admin/AdminSettings.tsx`** (1 change)
   - Line 512: "Customize your logo, colors" → "Customise your logo, colours"

5. **`src/components/estimates/PrintableEstimate.tsx`** (7 changes)
   - Lines 596, 620, 1268: "authorize" → "authorise"
   - Lines 612, 616, 1264: "Authorization" → "Authorisation"
   - Lines 625, 1273: "Authorized" → "Authorised"

6. **`src/pages/public/SignVariation.tsx`** (1 change)
   - Line 459: "authorizes" → "authorises"

7. **`src/components/contacts/ContactFormDialog.tsx`** (1 change)
   - Line 46: "Laborer" → "Labourer"

8. **`src/hooks/usePriceList.ts`** (1 change)
   - Line 121: "catalog" → "catalogue"

9. **`src/pages/PrivacyPolicy.tsx`** (1 change)
   - Line 47: "optimize" → "optimise"

10. **`src/lib/estimate-components/modules/architectural-formwork.ts`** (2 changes)
    - Lines 1, 7: "Specialized" → "Specialised"

11. **`src/components/estimates/calculators/ModularCalculator.tsx`** (1 change)
    - Line 1299: "summarized" → "summarised"

12. **`src/components/staff/SubscribersTable.tsx`** (1 change)
    - Line 84: "Canceled" → "Cancelled"

13. **`src/components/estimates/EstimateFormDialog.tsx`** (1 change)
    - Line 1347: "finalized" → "finalised"

14. **`src/pages/admin/AdminEstimates.tsx`** (1 change)
    - Line 63: "Finalized" → "Finalised"

15. **`src/components/estimates/EstimateDetailSheet.tsx`** (1 change)
    - Line 81: "Finalized" → "Finalised"

---

## What's Already Correct

The codebase already uses British spelling in many places:
- "cancelled" for job/booking statuses
- "grey" for product colour names
- "enquiries" in Privacy Policy
- "metre" for units of measurement in calculations
- "labour" in module names (`labour-prep`, `labour-place`)

---

## Summary of Changes

| Category | Count |
|----------|-------|
| organize → organise | 2 |
| customize → customise | 3 |
| authorize → authorise | 8 |
| labor → labour | 1 |
| catalog → catalogue | 1 |
| optimize → optimise | 1 |
| specialized → specialised | 2 |
| summarized → summarised | 1 |
| canceled → cancelled | 1 |
| finalized → finalised | 3 |
| **Total changes** | **23** |

