

## Feature Flag Xero Integration to PourHub Demo Account Only

### What This Does
Wraps all Xero integration UI behind the existing feature flag system so it only appears for the PourHub demo business account (`302211e5-7b2c-4fb4-a5e0-a936c7f72364`). All other businesses will see no trace of the Xero integration.

### Changes

#### 1. Add feature flag: `src/hooks/useFeatureFlag.ts`
Add `'xero_integration'` to the `FEATURE_FLAGS` map, pointing to the existing `DEMO_BUSINESS_ID`.

#### 2. Gate Settings UI: `src/pages/admin/AdminSettings.tsx`
- Import `useFeatureFlag`
- Call `useFeatureFlag('xero_integration')`
- Conditionally render the "Integrations" `SettingsGroup` (containing `XeroIntegrationSettings`) only when the flag is true

#### 3. Gate Estimate "Send to Xero": `src/components/estimates/EstimateDetailSheet.tsx`
- Import `useFeatureFlag`
- Call `useFeatureFlag('xero_integration')`
- Skip rendering the "Send to Xero" button and Xero sync status when flag is false
- The Xero hooks can still be called (they'll just return null/false) but the UI won't render

#### 4. Gate Variations "Send to Xero": `src/components/jobs/tabs/JobVariationsTab.tsx`
- Import `useFeatureFlag`
- Call `useFeatureFlag('xero_integration')`
- Hide the "Send to Xero" dropdown actions when flag is false

### No backend changes needed
The edge functions and database tables remain in place -- they simply won't be reachable from the UI for non-flagged businesses.

