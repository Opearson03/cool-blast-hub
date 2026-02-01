

# Enhanced Quote Templates - Detailed Scope & Second Page for Terms

## Overview

This plan enhances all three quote templates (Modern, Minimal, Classic) with:
1. A dedicated second page for Terms & Conditions and Exclusions
2. Detailed scope of work descriptions with technical specifications
3. Suggestions for additional scopes to add

---

## Current State

The quote templates currently:
- Display Terms & Conditions and Exclusions inline on page 1
- Show a basic "Scope of Works" section that just lists description parts (e.g., "Driveway | Paths")
- Don't extract detailed scope information like mesh type, finish, concrete strength per scope

---

## Changes Required

### 1. Enhanced Scope Breakdown Data Extraction

**File:** `src/lib/quote-pdf-data.ts`

Extend the `ScopeBreakdown` interface and `extractScopeBreakdowns` function to include:
- Concrete volume and strength
- Reinforcement type (mesh/rebar)
- Surface finish (exposed aggregate, sealed, etc.)
- Dimensions (area, thickness)

**New Interface:**
```typescript
export interface ScopeBreakdown {
  scopeName: string;
  volume: number;
  area?: number;
  details: string;
  areas?: Array<{ name: string; length: number; width: number; area: number }>;
  // NEW fields for detailed descriptions
  concreteStrength?: string;     // e.g., "32MPa"
  reinforcement?: string;        // e.g., "SL82 mesh"
  surfaceFinish?: string;        // e.g., "Exposed aggregate, sealed"
  thickness?: number;            // mm
}
```

**New Helper Function:**
```typescript
export function generateScopeDescription(scope: ScopeBreakdown): string {
  // Generates: "5m³ concrete to be supplied, reinforced with SL82 mesh, exposed aggregate, sealed"
  const parts: string[] = [];
  if (scope.volume > 0) parts.push(`${scope.volume.toFixed(1)}m³ concrete to be supplied`);
  if (scope.reinforcement) parts.push(`reinforced with ${scope.reinforcement}`);
  if (scope.surfaceFinish) parts.push(scope.surfaceFinish);
  return parts.join(', ') || scope.details;
}
```

---

### 2. New "Detailed Scope of Works" Component

**File:** `src/components/estimates/PrintableEstimate.tsx`

Create a new `DetailedScopeSection` component that displays each scope with its full technical specification:

```typescript
const DetailedScopeSection = ({ 
  data, 
  primaryColor, 
  secondaryColor,
  template 
}: { ... }) => {
  const { scopeBreakdowns } = data;
  if (scopeBreakdowns.length === 0) return null;

  return (
    <div className="page-break-avoid mb-6">
      <h3>Scope of Works</h3>
      {scopeBreakdowns.map((scope, index) => (
        <div key={index} className="mb-2">
          <p className="font-semibold">{scope.scopeName}</p>
          <p className="text-sm text-gray-600">
            {generateScopeDescription(scope)}
          </p>
        </div>
      ))}
    </div>
  );
};
```

**Example Output:**
| Scope | Description |
|-------|-------------|
| Driveway | 5.2m³ concrete to be supplied, reinforced with SL82 mesh, exposed aggregate, sealed |
| Paths | 1.8m³ concrete at 32MPa, reinforced with SL72 mesh, broom finish |
| Piers | 12 x 450mm diameter piers at 600mm deep, reinforced with N16 bars |

---

### 3. Second Page for Terms & Exclusions

**File:** `src/components/estimates/PrintableEstimate.tsx`

Create a new `TermsAndExclusionsPage` component with proper page break:

```typescript
const TermsAndExclusionsPage = ({ 
  exclusions, 
  paymentTerms,
  customNotes,
  business,
  primaryColor, 
  secondaryColor,
  template 
}: { ... }) => {
  return (
    <div className="page-break-before">
      {/* Mini header with logo */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        {business?.logo_url && <img src={business.logo_url} alt="Logo" />}
        <span className="text-sm text-gray-500">Terms & Conditions</span>
      </div>
      
      {/* Terms Section */}
      <div className="mb-8">
        <h3>Terms & Conditions</h3>
        {/* Payment terms, validity, etc. */}
      </div>
      
      {/* Exclusions Section */}
      <div className="mb-8">
        <h3>Exclusions</h3>
        <p>The following items are NOT included in this quote:</p>
        <ul>
          {exclusions.map(exc => <li key={exc}>× {exc}</li>)}
        </ul>
      </div>
      
      {/* Acceptance Section moved here */}
      <div>
        <h3>Acceptance</h3>
        {/* Signature lines */}
      </div>
    </div>
  );
};
```

**CSS Addition:**
```css
.page-break-before {
  page-break-before: always;
  break-before: page;
}
```

---

### 4. Template Structure Changes

For each template (Modern, Minimal, Classic), the structure changes from:

**Current Flow:**
```
Page 1:
├── Header (logo, quote number, date)
├── Client & Site info
├── Project Summary
├── Scope Breakdown (basic table)
├── Scope of Works (simple list)
├── Line Items (if any)
├── Total
├── Exclusions ← MOVING TO PAGE 2
├── Terms & Conditions ← MOVING TO PAGE 2
├── Acceptance ← MOVING TO PAGE 2
└── Footer
```

**New Flow:**
```
Page 1:
├── Header (logo, quote number, date)
├── Client & Site info
├── Project Summary
├── Detailed Scope of Works (NEW - with specs)
├── Line Items (if any)
├── Total
└── Footer (simple)

Page 2:
├── Mini Header (logo + "Terms & Conditions")
├── Payment Terms
├── Exclusions (full list)
├── Additional Notes
├── Acceptance (signature section)
└── Footer
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/quote-pdf-data.ts` | Add new fields to ScopeBreakdown, new extraction functions |
| `src/components/estimates/PrintableEstimate.tsx` | Add DetailedScopeSection, TermsAndExclusionsPage, restructure all 3 templates |

---

## Additional Scope Suggestions

Based on the existing scope registry, here are scopes that could be valuable additions:

| Scope | Use Case | Already Exists? |
|-------|----------|-----------------|
| **Pool Surrounds** | Common residential work | No - could use Paths & Surrounds |
| **Shed Slabs** | Very common, separate from driveways | Defined but not in registry |
| **Garage Floors** | Often quoted separately | No - use Standard Slab |
| **Commercial Carparks** | Larger commercial projects | No |
| **Footpaths (Council)** | Municipal work | No - use Paths & Surrounds |
| **Loading Docks** | Industrial applications | No |
| **Ramps** | Accessibility, parking structures | No |

**Recommendation:** Consider adding these to `SCOPE_REGISTRY`:
1. `SUSPENDED_SLAB_SCOPE` - Already defined but not in registry
2. `ARCHITECTURAL_CONCRETE_SCOPE` - Already defined but not in registry
3. `OSD_TANK_SCOPE` - Already defined but not in registry
4. `KERBS_CHANNELS_SCOPE` - Already defined but not in registry
5. `CONCRETE_STAIRS_SCOPE` - Already defined but not in registry
6. `RETAINING_WALLS_SCOPE` - Already defined but not in registry
7. `PIT_BASES_SCOPE` - Already defined but not in registry
8. `BOLLARDS_SCOPE` - Already defined but not in registry

These scopes are already fully defined in `scopes.ts` but not exposed in the registry.

---

## Technical Considerations

1. **Print CSS**: Need to add `.page-break-before` class for second page
2. **Data Availability**: Detailed scope info (finish, mesh) must be extracted from `moduleAnswers` in scope_data
3. **Fallbacks**: If detailed data isn't available, fall back to basic description
4. **Template Consistency**: All three templates must get the same structural changes

---

## Impact

- Quotes will be more professional with a dedicated terms page
- Clients see clear technical specifications for each scope
- Better separation between commercial content (page 1) and legal/contractual content (page 2)
- Consistent structure across all three template styles

