
## Feature Flag: Estimate Wizard V2 (Demo Business Only)

### The Concept

You want to build a new version of the Estimate Wizard while keeping the current version live for all real users. The safest way to do this is:

1. **Copy** the current `EstimateFormDialog.tsx` to a new file `EstimateFormDialogV2.tsx` — initially an identical copy
2. **Create a `useFeatureFlag` hook** that checks if the current user's business is the POURHUB DEMO BUSINESS
3. **Swap the component** at the single render point in `AdminEstimates.tsx` based on that flag

This gives you total isolation — changes to V2 never touch V1, and all real customers continue using the stable wizard unchanged.

### Architecture

```text
AdminEstimates.tsx
  ↓
useFeatureFlag("estimate_wizard_v2")
  ├── businessId === DEMO_BUSINESS_ID → EstimateFormDialogV2 (new, you can break things freely)
  └── everyone else → EstimateFormDialog (current, untouched, stable)
```

### The POURHUB DEMO BUSINESS

The demo business already exists in the database:
- **ID**: `302211e5-7b2c-4fb4-a5e0-a936c7f72364`
- **Name**: POURHUB DEMO BUSINESS
- **Flag**: `subscription_exempt: true`

The `businessId` is already available globally via `useAuth()` — no extra DB calls needed.

### Files to Create / Modify

**1. New hook: `src/hooks/useFeatureFlag.ts`** (new file)

A simple hook that checks if the current business matches the demo business ID:

```typescript
const DEMO_BUSINESS_ID = '302211e5-7b2c-4fb4-a5e0-a936c7f72364';

const FEATURE_FLAGS: Record<string, string[]> = {
  'estimate_wizard_v2': [DEMO_BUSINESS_ID],
};

export function useFeatureFlag(flagName: string): boolean {
  const { businessId } = useAuth();
  const allowedBusinesses = FEATURE_FLAGS[flagName] ?? [];
  return businessId ? allowedBusinesses.includes(businessId) : false;
}
```

This is hardcoded for now — clean, zero DB queries, and easy to expand later (e.g. pull from a `feature_flags` DB table when you need more control).

**2. New file: `src/components/estimates/EstimateFormDialogV2.tsx`** (copy of current)

An exact copy of the current `EstimateFormDialog.tsx` at this point in time. Immediately after creation it is byte-for-byte identical to V1. You then make all future wizard changes in this file only. V1 (`EstimateFormDialog.tsx`) becomes frozen — no more changes to it.

**3. Update: `src/pages/admin/AdminEstimates.tsx`**

Import both dialogs and the feature flag hook, then swap based on the flag:

```tsx
import { EstimateFormDialog } from "@/components/estimates/EstimateFormDialog";
import { EstimateFormDialogV2 } from "@/components/estimates/EstimateFormDialogV2";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

// Inside component:
const showWizardV2 = useFeatureFlag('estimate_wizard_v2');
const ActiveEstimateFormDialog = showWizardV2 ? EstimateFormDialogV2 : EstimateFormDialog;

// In JSX (single render, same props):
<ActiveEstimateFormDialog
  open={formOpen}
  onOpenChange={handleFormClose}
  editEstimate={editingEstimate}
  onFinalized={handleEstimateFinalized}
/>
```

### What this gives you

- All existing users → current wizard, completely untouched
- POURHUB DEMO BUSINESS login → sees EstimateFormDialogV2 (your development sandbox)
- You can freely restructure, break, and rebuild V2 without any risk to live users
- When V2 is ready to go live, you add more business IDs to the `FEATURE_FLAGS` array, then eventually remove V1 and make V2 the default

### What stays the same

- No database changes needed
- No edge functions needed
- The `EstimateFormDialog.tsx` (V1) is never touched again after this
- All imports/dependencies shared between V1 and V2 (modules, calculators, takeoff tools) remain shared — you only fork the top-level dialog shell

### Expanding the flag system later

The `FEATURE_FLAGS` object in `useFeatureFlag.ts` can be updated to add more businesses or flag names at any time. If you eventually need per-business admin control (e.g. toggle from the staff portal), the hook can be updated to query a `feature_flags` DB table while keeping the same API — no changes needed in consuming components.
