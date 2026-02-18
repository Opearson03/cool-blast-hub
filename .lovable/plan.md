
## Hide Kerb & Insitu Walls from Non-Demo Users

### Root Cause

`ScopeSelector.tsx` is a **shared component** used by both `EstimateFormDialog.tsx` (V1, all users) and `EstimateFormDialogV2.tsx` (V2, demo only). The three new scopes — `pool_surround`, `kerb`, and `insitu_walls` — were added to the shared `SCOPE_OPTIONS` array, so every user on every plan can see and select them.

The `ScopeSelector` component has no concept of feature flags and no way to filter beta scopes out.

---

### The Fix (Two Small Changes)

**1. `src/components/estimates/ScopeSelector.tsx`**

Add an optional `featureGated?: string` field to the `ScopeOption` interface. Mark `kerb` and `insitu_walls` (and optionally `pool_surround`) with `featureGated: 'estimate_wizard_v2'`.

Add an optional `allowedFeatureFlags?: Set<string>` prop to `ScopeSelectorProps`. When provided, filter out any scope whose `featureGated` key is not in that set.

```typescript
// Interface change:
export interface ScopeOption {
  id: ScopeType;
  label: string;
  description: string;
  availableFor: EstimateType[];
  category: ScopeCategory;
  featureGated?: string; // <-- new optional field
}

// Props change:
interface ScopeSelectorProps {
  selectedScopes: Set<ScopeType>;
  onScopesChange: (scopes: Set<ScopeType>) => void;
  allowedFeatureFlags?: Set<string>; // <-- new optional prop
}
```

Scope option entries for `kerb` and `insitu_walls` get `featureGated: 'estimate_wizard_v2'`. `pool_surround` should also be gated since it has the cutout feature that is V2-only.

Inside the component, filter `SCOPE_OPTIONS` before grouping:
```typescript
const availableScopes = SCOPE_OPTIONS.filter(scope => {
  if (!scope.featureGated) return true; // ungated, always show
  return allowedFeatureFlags?.has(scope.featureGated) ?? false;
});
```

**2. `src/components/estimates/EstimateFormDialogV2.tsx`**

Pass the V2 feature flag set into `ScopeSelector`:
```tsx
<ScopeSelector
  selectedScopes={selectedScopes}
  onScopesChange={handleScopesChange}
  allowedFeatureFlags={new Set(['estimate_wizard_v2'])}
/>
```

**3. `src/components/estimates/EstimateFormDialog.tsx` (V1)**

No change needed. V1 passes no `allowedFeatureFlags` prop, so the default `undefined` value causes all feature-gated scopes to be filtered out automatically. This is a safe, backward-compatible default.

---

### Why This Approach

- **Zero risk to V1 users** — the prop is optional; V1 doesn't pass it, so gated scopes are invisible.
- **No hook in `ScopeSelector`** — the component stays pure/dumb. The parent dialog decides which flags are active. This keeps `ScopeSelector` reusable without adding auth coupling to it.
- **Extensible** — adding a new beta scope in the future just requires adding `featureGated: 'some_flag'` to its entry. No other changes needed.

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/estimates/ScopeSelector.tsx` | Add `featureGated?` to `ScopeOption`; add `allowedFeatureFlags?` prop; filter scopes before grouping; tag `kerb`, `insitu_walls`, `pool_surround` with `featureGated: 'estimate_wizard_v2'` |
| `src/components/estimates/EstimateFormDialogV2.tsx` | Pass `allowedFeatureFlags={new Set(['estimate_wizard_v2'])}` to `<ScopeSelector>` |

No database changes. No new files. No changes to V1 (`EstimateFormDialog.tsx`).
