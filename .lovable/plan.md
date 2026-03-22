

# Roll Out V2 Estimate Wizard to All Users

## What Changes

1. **`src/pages/admin/AdminEstimates.tsx`** — Remove the feature flag check and always use `EstimateFormDialogV2`. Remove the `EstimateFormDialog` (V1) import.

2. **`src/components/estimates/ScopeSelector.tsx`** — Remove `featureGated` property from Pool Surround, Kerb, and Insitu Walls scope options. Remove the `featureGated` field from the `ScopeOption` interface. Remove the feature-flag filtering logic in the component.

3. **`src/components/estimates/EstimateFormDialogV2.tsx`** — Stop passing `allowedFeatureFlags` to `ScopeSelector` (no longer needed).

4. **`src/components/estimates/ScopeSelector.tsx` (props)** — Remove `allowedFeatureFlags` from the component props interface.

5. **`src/hooks/useFeatureFlag.ts`** — Remove the `estimate_wizard_v2` entry from the flags map. Keep the hook intact in case future flags are needed.

## Result

All users will see the V2 wizard with auto-save to contacts and all scope options (Pool Surround, Kerb, Insitu Walls) unlocked.

