
# Fix: No Line Items Showing in Quote Body

## Problem Identified

The scope breakdown is not appearing because the data extraction logic in `quote-pdf-data.ts` doesn't match the actual `scope_data` structure stored in the database.

### Actual Database Structure
```json
{
  "_globalMargin": 15,
  "raft_slab": {
    "calculatedTotal": 4039.31,
    "customExclusions": [],
    "doneModules": ["excavation", "base-preparation", "reinforcement-raft"],
    "moduleAnswers": { ... },
    "scopeAnswers": { "area": 29.94, "areas": [...], ... }
  },
  "retaining_wall_footings": {
    "calculatedTotal": 1293.27,
    "moduleAnswers": { ... },
    "scopeAnswers": { ... }
  }
}
```

### Current Extraction Logic (Broken)
```typescript
// Line 315 in quote-pdf-data.ts
const scopes = scopeData.scopes || { [scopeData.scopeId || 'default']: scopeData };
```

This looks for a `.scopes` wrapper that doesn't exist, then falls back to treating the entire `scopeData` as a single scope with key `'default'`. This causes the extraction to fail completely.

---

## Solution

Update `extractScopeBreakdowns` (and related functions) to correctly identify scope keys:

1. Iterate over all keys in `scopeData`
2. Skip non-scope keys (like `_globalMargin`, `exclusions`, `customExclusions`, etc.)
3. Identify scopes by checking if the value has `scopeAnswers` or `moduleAnswers`

### Updated Extraction Logic
```typescript
function getScopesFromData(scopeData: Record<string, any>): Record<string, any> {
  // Keys that are NOT scopes
  const nonScopeKeys = [
    '_globalMargin', 
    'exclusions', 
    'customExclusions', 
    'calculatedCosts',
    'scopes',
    'scopeId'
  ];
  
  // If there's a scopes wrapper, use it
  if (scopeData.scopes) {
    return scopeData.scopes;
  }
  
  // Otherwise, filter to find scope-like keys
  const scopes: Record<string, any> = {};
  for (const key of Object.keys(scopeData)) {
    if (nonScopeKeys.includes(key)) continue;
    if (key.startsWith('_')) continue; // Skip internal keys
    
    const value = scopeData[key];
    // Check if it looks like a scope (has scopeAnswers or moduleAnswers)
    if (value && typeof value === 'object' && 
        (value.scopeAnswers || value.moduleAnswers || value.calculatedTotal !== undefined)) {
      scopes[key] = value;
    }
  }
  
  return Object.keys(scopes).length > 0 ? scopes : {};
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/quote-pdf-data.ts` | Add `getScopesFromData()` helper and update `extractProjectSummary`, `extractReinforcementDetails`, `extractScopeBreakdowns` to use it |
| `src/components/estimates/PrintableEstimate.tsx` | Add fallback to parse scope breakdown from `estimate.notes` if `quotePDFData.scopeBreakdowns` is empty |

---

## Implementation Details

### Step 1: Fix Data Extraction (quote-pdf-data.ts)

Create a shared helper function to correctly identify scopes in the data:

```typescript
// Shared helper to extract scopes from the flexible data structure
function getScopesFromData(scopeData: Record<string, any> | null): Record<string, any> {
  if (!scopeData) return {};
  
  // If there's an explicit scopes wrapper, use it
  if (scopeData.scopes && typeof scopeData.scopes === 'object') {
    return scopeData.scopes;
  }
  
  // Non-scope keys to skip
  const nonScopeKeys = new Set([
    '_globalMargin', 'exclusions', 'customExclusions', 
    'calculatedCosts', 'scopes', 'scopeId'
  ]);
  
  const scopes: Record<string, any> = {};
  
  for (const key of Object.keys(scopeData)) {
    // Skip known non-scope keys and internal keys
    if (nonScopeKeys.has(key) || key.startsWith('_')) continue;
    
    const value = scopeData[key];
    
    // Identify scope by structure
    if (value && typeof value === 'object' && 
        (value.scopeAnswers || value.moduleAnswers || 
         value.calculatedTotal !== undefined || value.doneModules)) {
      scopes[key] = value;
    }
  }
  
  return scopes;
}
```

Update all three functions to use this helper:
- `extractProjectSummary()` - line 153
- `extractReinforcementDetails()` - line 228
- `extractScopeBreakdowns()` - line 315

### Step 2: Add Notes-Based Fallback (PrintableEstimate.tsx)

If `quotePDFData.scopeBreakdowns` is empty but `estimate.notes` contains a `SCOPE BREAKDOWN:` section, render a fallback table on Page 1:

```tsx
// After parsing notes with parseNotesContent()
const hasScopeData = quotePDFData.scopeBreakdowns.length > 0;
const hasFallbackScopes = parsedNotes.scopeBreakdownFromNotes.length > 0;

// In the template, render:
{hasScopeData ? (
  <ScopeLineItemsSection ... />
) : hasFallbackScopes ? (
  <NotesBasedScopeBreakdown 
    items={parsedNotes.scopeBreakdownFromNotes} 
    template={template}
    primaryColor={primaryColor}
    secondaryColor={secondaryColor}
  />
) : null}
```

Create a simple `NotesBasedScopeBreakdown` component that renders the scope names and amounts parsed from the notes field.

---

## Expected Result

### Before (Broken)
- Page 1: Empty (no scope breakdown visible)
- Page 2: Scope breakdown appearing under Terms (from notes)

### After (Fixed)
- Page 1: Scope breakdown table with scope names and specifications
- Page 2: Payment Terms + Exclusions only (no scope breakdown)

---

## Verification

After implementation, test with:
1. **Print Estimate** - should show scopes on Page 1
2. **Email to Client** - PDF attachment should show scopes on Page 1
3. **Estimates with empty scope_data** - should use notes fallback if available
4. **Old estimates** - notes-based fallback ensures they still display correctly
