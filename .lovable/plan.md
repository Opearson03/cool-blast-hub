

# Fix: Clients Not Appearing in Contacts

## Root Cause

The PourHub demo account (`admin@pourhub.com.au`, business ID `600d2b3e-f736-4533-8957-52aa3e8e18cc`) is using the **old** estimate wizard (`EstimateFormDialog`), which does **not** have the `saveEstimateClient` call. The `saveEstimateClient` logic was only added to `EstimateFormDialogV2`, but the `estimate_wizard_v2` feature flag only includes `DEMO_BUSINESS_ID` (`302211e5-...`), not the PourHub business.

The database confirms: 0 client records exist for this business, and estimates do exist with client data that should have been saved.

## Fix

**File: `src/hooks/useFeatureFlag.ts`**

Add `POURHUB_BUSINESS_ID` to the `estimate_wizard_v2` feature flag list so the demo account uses the V2 wizard (which already contains the client-save logic).

```ts
const FEATURE_FLAGS: Record<string, string[]> = {
  'estimate_wizard_v2': [DEMO_BUSINESS_ID, POURHUB_BUSINESS_ID],
};
```

This single-line change will:
1. Switch the demo account to the V2 estimate wizard
2. Enable the automatic client saving on step 1 "Continue"
3. Make the `ClientAutocomplete` start populating with saved clients

