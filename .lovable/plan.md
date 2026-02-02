

# Streamline "Start Estimate" from Inbox

## Problem

When creating an estimate from an emailed plan, users must enter client details twice:
1. First in the "Create Estimate from Plan" dialog in the Inbox
2. Again in the Estimate Wizard's client details section

This creates unnecessary friction and duplicate data entry.

## Solution

Remove the intermediate client details dialog and go directly to the standard estimate wizard flow. The AI-extracted data from the email (client name, site address, etc.) will be passed to the wizard to pre-fill the fields there.

---

## Changes

### File: `src/components/jobs/PendingPlansSheet.tsx`

#### 1. Remove client details form state (lines 61-65)

Delete these state variables as they'll no longer be needed:
- `clientName`
- `clientEmail`  
- `clientPhone`
- `siteAddress`

#### 2. Simplify "Start Estimate" button behavior (line 337)

Change from opening a dialog to directly triggering the conversion:

**Current:**
```typescript
onClick={() => openConvertDialog(plan)}
```

**New:**
```typescript
onClick={() => startEstimateFromPlan(plan)}
```

#### 3. Replace `openConvertDialog` with direct conversion function

Create a new `startEstimateFromPlan` function that:
- Sets the selected plan
- Immediately triggers the conversion mutation
- Uses extracted/email data for defaults (or placeholders that the wizard will populate)

```typescript
const startEstimateFromPlan = (plan: PendingPlan) => {
  setSelectedPlan(plan);
  // Trigger conversion immediately - wizard will handle client details
  convertMutation.mutate({ plan });
};
```

#### 4. Update `convertMutation` to use extracted data from the plan

Instead of using form state, pull defaults directly from the plan's extracted data:

```typescript
const extracted = selectedPlan.extracted_data || {};
const insertData = {
  business_id: businessId,
  client_name: extracted.client_name || selectedPlan.from_name || "New Client",
  client_email: selectedPlan.from_email || null,
  client_phone: extracted.phone || null,
  site_address: extracted.site_address || "Address TBD",
  // ... rest unchanged
};
```

#### 5. Remove the "Convert to Estimate" Dialog (lines 360-418)

Delete the entire dialog component as it's no longer needed.

#### 6. Keep the Reject Dialog

The reject dialog (lines 421-454) remains unchanged as it serves a different purpose.

---

## User Experience After Change

### Before (Current Flow)
1. User clicks "Start Estimate" button
2. Dialog opens asking for client name, email, phone, site address
3. User fills in details and clicks "Create Estimate"
4. Wizard opens with the same details pre-filled
5. User has to review/edit the same information again

### After (Simplified Flow)
1. User clicks "Start Estimate" button
2. Estimate is created with AI-extracted defaults
3. Wizard opens immediately
4. User reviews/edits details once in the wizard's standard flow

---

## Data Pre-filling

The estimate will be created with:
| Field | Source |
|-------|--------|
| Client Name | AI extracted → Email sender name → "New Client" |
| Client Email | Email sender address |
| Client Phone | AI extracted (if available) |
| Site Address | AI extracted → "Address TBD" |

These values appear in the wizard's client details section where users can edit them as part of the standard estimate creation workflow.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/jobs/PendingPlansSheet.tsx` | Remove dialog, simplify conversion flow, use extracted data directly |

