
# Fix: Display Inclusions and Exclusions on Quote Template Page 2

## Problem
The inclusions and exclusions sections are not appearing on the second page of the generated quote PDF templates. While the data is being collected and stored correctly, it's not being passed through and rendered in the PDF output.

## Root Cause Analysis
1. **Missing inclusions in data structure**: The `QuotePDFData` interface only includes `exclusions`, not `inclusions`
2. **No inclusions extraction function**: There's a `collectExclusions()` function but no equivalent `collectInclusions()` function
3. **`TermsAndExclusionsPage` component missing inclusions prop**: The component only accepts `exclusions` as a prop
4. **Data source mismatch**: Inclusions/exclusions are stored in two places:
   - In `scopeData.inclusions` and `scopeData.exclusions` arrays (object format with `text` property)
   - In `estimate.notes` as text (parsed via `parseNotesContent`)
   
   Currently only the `scopeData` source is being used for exclusions, and inclusions aren't extracted at all.

## Solution

### 1. Update `src/lib/quote-pdf-data.ts`

Add `inclusions` to the `QuotePDFData` interface:
```typescript
export interface QuotePDFData {
  projectSummary: ProjectSummary;
  reinforcement: ReinforcementDetails | null;
  scopeBreakdowns: ScopeBreakdown[];
  lineItems: QuoteLineItem[];
  inclusions: string[];  // NEW
  exclusions: string[];
}
```

Add a new `collectInclusions` function (mirrors `collectExclusions`):
```typescript
export function collectInclusions(
  scopeData: Record<string, any> | null
): string[] {
  const inclusions: string[] = [];
  
  if (!scopeData) return inclusions;
  
  const stateInclusions = scopeData.inclusions || [];
  
  for (const inc of stateInclusions) {
    if (inc.text && !inclusions.includes(inc.text)) {
      inclusions.push(inc.text);
    }
  }
  
  return inclusions;
}
```

Update `extractQuotePDFData` to include inclusions:
```typescript
return {
  projectSummary: extractProjectSummary(scopeData, selectedScopes),
  reinforcement: extractReinforcementDetails(scopeData),
  scopeBreakdowns: extractScopeBreakdowns(scopeData, selectedScopes),
  lineItems: generateLineItems(scopeData),
  inclusions: collectInclusions(scopeData),  // NEW
  exclusions: collectExclusions(scopeData),
};
```

### 2. Update `src/components/estimates/PrintableEstimate.tsx`

**Update `TermsAndExclusionsPage` component props:**
```typescript
const TermsAndExclusionsPage = ({
  inclusions,    // NEW
  exclusions, 
  paymentTerms,
  customNotes,
  business,
  estimate,
  primaryColor, 
  secondaryColor,
  template 
}: { 
  inclusions: string[];  // NEW
  exclusions: string[]; 
  paymentTerms: string[] | null;
  customNotes: string | null;
  business: PrintableEstimateProps['business'];
  estimate: PrintableEstimateProps['estimate'];
  primaryColor: string; 
  secondaryColor: string;
  template: string;
}) => {
```

**Add `renderInclusions` function** (styled similar to exclusions but with green/positive colors):
- Modern template: green background box with checkmark icons
- Minimal template: simple list with bullet points  
- Classic template: green tinted box with checkmark icons

**Update the component render order:**
```tsx
return (
  <div data-pdf-section="page-2" className="page-break-before pt-8">
    {renderHeader()}
    {renderInclusions()}   {/* NEW - before exclusions */}
    {renderExclusions()}
    {renderTerms()}
    {renderAcceptance()}
  </div>
);
```

**Update all template usages** (lines ~1036, ~1221, ~1442) to pass inclusions:

Merge inclusions from both `quotePDFData.inclusions` and `parsedNotes.inclusionsFromNotes`:
```typescript
const allInclusions = [
  ...quotePDFData.inclusions,
  ...parsedNotes.inclusionsFromNotes.filter(
    inc => !quotePDFData.inclusions.includes(inc)
  )
];
```

Pass to component:
```tsx
<TermsAndExclusionsPage
  inclusions={allInclusions}
  exclusions={quotePDFData.exclusions.length > 0 
    ? quotePDFData.exclusions 
    : parsedNotes.exclusionsFromNotes}
  paymentTerms={paymentTerms}
  customNotes={parsedNotes.userNotes}
  business={business}
  estimate={estimate}
  primaryColor={primaryColor}
  secondaryColor={secondaryColor}
  template="modern"  // or "minimal" or "classic"
/>
```

### 3. Inclusions Section Styling

**Modern Template:**
```tsx
<div className="mb-8">
  <h3 className="text-sm font-bold uppercase mb-3" style={{ color: secondaryColor }}>
    Inclusions
  </h3>
  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
    <p className="text-xs text-green-800 mb-3">This quote includes:</p>
    <ul className="space-y-1">
      {inclusions.map((inc, index) => (
        <li key={index} className="text-sm text-green-700 flex items-start gap-2">
          <span className="text-green-500">✓</span>
          <span>{inc}</span>
        </li>
      ))}
    </ul>
  </div>
</div>
```

**Minimal Template:**
```tsx
<div className="mb-8">
  <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Inclusions</p>
  <p className="text-xs text-gray-500 mb-2">This quote includes:</p>
  <div className="text-sm text-gray-600 space-y-1">
    {inclusions.map((inc, index) => (
      <p key={index} className="flex items-start gap-2">
        <span className="text-green-500">✓</span>
        <span>{inc}</span>
      </p>
    ))}
  </div>
</div>
```

**Classic Template:**
```tsx
<div className="mb-8">
  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Inclusions</h3>
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <p className="text-xs text-green-800 mb-3">This quote includes:</p>
    <ul className="space-y-1">
      {inclusions.map((inc, index) => (
        <li key={index} className="text-sm text-green-700 flex items-start gap-2">
          <span style={{ color: primaryColor }}>✓</span>
          <span>{inc}</span>
        </li>
      ))}
    </ul>
  </div>
</div>
```

## Files to Modify
1. `src/lib/quote-pdf-data.ts` - Add inclusions to interface and extraction function
2. `src/components/estimates/PrintableEstimate.tsx` - Update component to accept and render inclusions

## Expected Result
After this fix, the generated quote PDF will show:
- **Page 1**: Quote header, client info, scope of works, totals
- **Page 2**: 
  - Terms & Conditions header
  - **Inclusions section** (green styling with checkmarks)
  - **Exclusions section** (red/orange styling with X marks)
  - Payment terms
  - Acceptance/signature block
