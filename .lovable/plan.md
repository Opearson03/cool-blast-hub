
## Remove All Xero Integration Code

Complete removal of the Xero accounting integration from the codebase, including edge functions, frontend components, hooks, database tables, and feature flags.

### Files to Delete
- `supabase/functions/xero-auth/index.ts` -- OAuth initiation edge function
- `supabase/functions/xero-auth-callback/index.ts` -- OAuth callback edge function
- `supabase/functions/xero-api/index.ts` -- Xero API operations edge function
- `src/components/settings/XeroIntegrationSettings.tsx` -- Settings UI component
- `src/hooks/useXeroConnection.ts` -- All Xero hooks (connection, sync log, send)

### Files to Edit

1. **`src/pages/admin/AdminSettings.tsx`**
   - Remove `XeroIntegrationSettings` import
   - Remove `useFeatureFlag('xero_integration')` and `showXero` variable
   - Remove the entire `{showXero && (...Integrations group...)}` block (lines ~722-734)
   - Remove the `Plug` icon import if no longer used

2. **`src/components/estimates/EstimateDetailSheet.tsx`**
   - Remove `useXeroConnection, useXeroSyncLog, useSendToXero` import
   - Remove `isXeroConnected`, `showXero`, `xeroSync`, `sendToXero` variables
   - Remove the "Send to Xero" section (the entire Xero Invoice block for accepted quotes, ~lines 806-873)
   - Remove `useFeatureFlag` import if no longer used elsewhere in this file

3. **`src/components/jobs/tabs/JobVariationsTab.tsx`**
   - Remove `useXeroConnection, useSendToXero` import
   - Remove `isXeroConnected`, `showXero`, `sendToXero` variables
   - Remove both "Send to Xero" dropdown menu items (mobile and desktop table views)
   - Remove `useFeatureFlag` import if no longer used elsewhere in this file

4. **`src/hooks/useFeatureFlag.ts`**
   - Remove the `'xero_integration'` entry from `FEATURE_FLAGS`

### Database Migration
- Drop tables: `xero_sync_log` and `xero_connections`

### Edge Function Cleanup
- Delete the three deployed edge functions: `xero-auth`, `xero-auth-callback`, `xero-api`

### Secrets
- The `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, and `APP_URL` secrets will remain but become unused. They can be left as-is since they cause no harm.

### Technical Notes
- No other features depend on the Xero code; it is fully gated behind the `xero_integration` feature flag
- The `useFeatureFlag` hook itself stays since `estimate_wizard_v2` still uses it
- No routing changes needed -- there are no dedicated Xero routes
