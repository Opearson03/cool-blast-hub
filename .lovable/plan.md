
# Plan: Attach Building Plans to Quote Requests

## Overview
Add the ability to include building plans when sending a Quote Request (RFQ) to suppliers. This is essential for items like waffle pods, reo cages, and fabricated steel where suppliers need to see the plans to provide accurate pricing.

## Current State
- Jobs can have building plans stored in two places:
  1. **documents table** (category: "job") - Plans copied from estimates when job is created
  2. **estimate_takeoffs + takeoff_files** - Original plans linked to the source estimate
- The Order Wizard supports Quote Requests (RFQ) and Purchase Orders (PO)
- Email sending is handled by the `send-purchase-order` edge function
- Resend API is used for sending emails and supports attachments

## User Experience

### Flow
1. User selects "Request Quote" in the BOQ Order Wizard
2. User proceeds through Type → Items → Supplier → Delivery steps
3. **NEW**: In the Delivery step (or a new step), a toggle appears:
   - "Include building plans for supplier to quote from"
4. If toggled ON:
   - If job has plans attached: Show the list of available plans with checkboxes
   - If no plans exist: Show an upload area to add plans now
5. Selected plans are sent as email attachments with the RFQ

### UI Mockup (Delivery Step Addition)
```
┌──────────────────────────────────────────┐
│ ☐ Include building plans                 │
│                                          │
│   Some items require suppliers to see    │
│   the plans for accurate pricing.        │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │ ☑ Floor Plan - Page 1.pdf        │   │
│   │ ☑ Foundation Plan.pdf            │   │
│   │ ☐ Elevation Drawing.pdf          │   │
│   └──────────────────────────────────┘   │
│                                          │
│   [+ Upload additional plan]             │
└──────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Update Types
**File: `src/components/jobs/boq/order-wizard/types.ts`**

Add new state fields:
```typescript
export interface OrderWizardData {
  // ... existing fields
  includePlans: boolean;
  selectedPlanIds: string[];
}

export interface JobPlan {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
}
```

### 2. Update OrderWizardDialog
**File: `src/components/jobs/boq/order-wizard/OrderWizardDialog.tsx`**

- Add state for `includePlans` (boolean, default false) and `selectedPlanIds` (string[])
- Add query to fetch job's building plans from `documents` table
- Pass these to DeliveryStep (for RFQ only)
- Include selected plan URLs in the edge function call when `orderType === "quote"`
- Add mutation for uploading new plans if needed

### 3. Update DeliveryStep
**File: `src/components/jobs/boq/order-wizard/DeliveryStep.tsx`**

Add a new section (only shown when `isQuote === true`):
- Switch toggle: "Include building plans"
- When enabled, show:
  - List of existing plans with checkboxes
  - Button to upload additional plans
- File upload uses the existing `documents` bucket pattern

### 4. Update ReviewStep
**File: `src/components/jobs/boq/order-wizard/ReviewStep.tsx`**

- Add props for `includePlans` and selected plan count
- Show "Attachments: X building plan(s)" in the review summary when plans are included

### 5. Update Edge Function
**File: `supabase/functions/send-purchase-order/index.ts`**

- Accept new `planUrls` array parameter in request body
- For Quote Requests, download each plan file and attach to the email
- Resend supports attachments via the `attachments` array:
```typescript
await resend.emails.send({
  // ...existing config
  attachments: [
    {
      filename: 'Building-Plans.pdf',
      content: base64Content,
    }
  ]
});
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/jobs/boq/order-wizard/types.ts` | Add `includePlans`, `selectedPlanIds`, `JobPlan` interface |
| `src/components/jobs/boq/order-wizard/OrderWizardDialog.tsx` | Add plan state, fetch plans query, upload mutation, pass to steps |
| `src/components/jobs/boq/order-wizard/DeliveryStep.tsx` | Add "Include building plans" section with toggle, checklist, and upload |
| `src/components/jobs/boq/order-wizard/ReviewStep.tsx` | Display attachment summary |
| `supabase/functions/send-purchase-order/index.ts` | Handle plan attachments in RFQ emails |

---

## Edge Cases

1. **No existing plans**: Show upload area with message "No plans uploaded yet - add one now"
2. **Large files**: Limit total attachment size (Resend has 40MB limit per email)
3. **Private bucket files**: Generate signed URLs for downloading files in edge function
4. **Multiple suppliers**: Same plans attached to all supplier emails

---

## Testing Checklist

1. Open BOQ → Order → Request Quote
2. Proceed to Delivery step
3. Verify "Include building plans" toggle appears (not for PO)
4. Toggle ON → see list of existing plans (if any)
5. Select plans and proceed to Review
6. Verify Review shows attachment count
7. Send RFQ → verify email arrives with PDF attachments
8. Test with no existing plans → upload new plan → verify it's saved and attached
