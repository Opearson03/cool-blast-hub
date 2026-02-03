

## Goal
1. **Remove the "Modern" template option** from all template selection UIs
2. **Replace the static preview thumbnail** with an interactive in-app PDF viewer that shows a real-time preview of the selected template

---

## Current State

### Template Selection Locations
| Location | Current Behavior |
|----------|------------------|
| `AdminSettings.tsx` (lines 569-592) | Shows 3 template buttons: Classic, Modern, Minimal |
| `OnboardingWizard.tsx` (lines 426-446) | Shows 3 template buttons: Classic, Modern, Minimal |
| `QuoteTemplatePreview.tsx` | Renders static HTML previews for all 3 templates |
| `PrintableEstimate.tsx` | Contains full PDF rendering logic for all 3 templates |

### Preview System
Currently, the "Live Preview" in settings displays a tiny static HTML thumbnail (`QuoteTemplatePreview` component) that simulates what the quote looks like, but it's not an actual PDF preview.

---

## Implementation Plan

### Phase 1: Remove "Modern" Template Option

#### File: `src/pages/admin/AdminSettings.tsx`
- **Line 572**: Remove the "Modern" entry from the template array
- Change from:
  ```tsx
  [
    { id: "classic", name: "Classic", desc: "Traditional professional layout" },
    { id: "modern", name: "Modern", desc: "Clean, bold design" },
    { id: "minimal", name: "Minimal", desc: "Simple and elegant" },
  ]
  ```
- To:
  ```tsx
  [
    { id: "classic", name: "Classic", desc: "Traditional professional layout" },
    { id: "minimal", name: "Minimal", desc: "Simple and elegant" },
  ]
  ```
- Update grid to `grid-cols-2` (from `grid-cols-3`)

#### File: `src/components/onboarding/OnboardingWizard.tsx`
- **Lines 426-431**: Remove "Modern" from template options
- Update grid to `grid-cols-2`

#### File: `src/components/onboarding/QuoteTemplatePreview.tsx`
- **Lines 22-163**: Remove the entire "Modern" template conditional block

#### File: `src/components/estimates/PrintableEstimate.tsx`
- **Lines 916-1111**: Remove the entire `if (template === "modern")` block
- **Lines 175-285**: Remove "modern" branch from `ProjectSummarySection`
- **Lines 289-391**: Remove "modern" branch from helper sections
- **Lines 394-485**: Remove "modern" branch from additional sections
- **Lines 489-555**: Remove "modern" branch from `ClientInfoHeader`
- **Lines 560-630**: Remove "modern" branch from `ScopeLineItemsSection`
- **Lines 634-688**: Remove "modern" branch from other sections
- **Lines 692-748**: Remove "modern" branch from `NotesBasedScopeBreakdown`
- **Lines 752-847**: Remove "modern" branch from `TermsAndExclusionsPage`

---

### Phase 2: Add In-App PDF Preview

#### Approach
Replace the static `QuoteTemplatePreview` component with an embedded PDF viewer that:
1. Generates a real PDF blob using the existing `generateQuotePDF` function
2. Displays it in an `<iframe>` or using PDF.js for in-app viewing
3. Updates in real-time when template/colors/font settings change

#### File: `src/pages/admin/AdminSettings.tsx`

**New state variables:**
```tsx
const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
const [generatingPreview, setGeneratingPreview] = useState(false);
```

**New effect to generate preview PDF:**
```tsx
// Debounced PDF preview generation
useEffect(() => {
  const timer = setTimeout(async () => {
    if (!business) return;
    
    setGeneratingPreview(true);
    try {
      // Generate a sample PDF using current branding settings
      const sampleEstimate = {
        estimate_number: "Q-PREVIEW",
        client_name: "Sample Customer",
        company_name: null,
        client_email: "customer@example.com",
        client_phone: "0400 000 000",
        site_address: "123 Example Street, Sydney NSW 2000",
        description: "Sample concrete work",
        total_amount: 12500,
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        notes: null,
        created_at: new Date().toISOString(),
      };
      
      const tempBusiness = {
        name: name || "Your Business",
        logo_url: logoUrl,
        address: address || "123 Business Street",
        phone: phone || "0400 000 000",
        email: email || "email@company.com",
        abn: abn,
        quote_template: quoteTemplate,
        quote_primary_color: quotePrimaryColor,
        quote_secondary_color: quoteSecondaryColor,
        quote_font: quoteFont,
      };
      
      const pdfBase64 = await generateQuotePDF({
        estimate: sampleEstimate,
        business: tempBusiness,
        scopeData: { _selectedScopes: ["Raft Slab"], _globalMargin: 15 },
      });
      
      // Convert base64 to blob URL
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Revoke previous URL to prevent memory leaks
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error("Failed to generate preview:", error);
    } finally {
      setGeneratingPreview(false);
    }
  }, 500); // 500ms debounce
  
  return () => clearTimeout(timer);
}, [quoteTemplate, quotePrimaryColor, quoteSecondaryColor, quoteFont, logoUrl, name, business]);
```

**Replace the Live Preview section (lines 665-682):**
```tsx
{/* Live Preview - Embedded PDF */}
<div>
  <Label className="text-sm font-medium mb-3 flex items-center gap-2">
    <Eye className="w-4 h-4" />
    Live Preview
  </Label>
  <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: "400px" }}>
    {generatingPreview ? (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Generating preview...</span>
      </div>
    ) : pdfPreviewUrl ? (
      <iframe
        src={pdfPreviewUrl}
        className="w-full h-full"
        title="Quote Preview"
      />
    ) : (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Preview will appear here</p>
      </div>
    )}
  </div>
  <p className="text-xs text-muted-foreground mt-2">
    This is a live preview of your quote template with sample data.
  </p>
</div>
```

**Add cleanup on unmount:**
```tsx
useEffect(() => {
  return () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
  };
}, [pdfPreviewUrl]);
```

**Add import:**
```tsx
import { generateQuotePDF } from "@/lib/generate-quote-pdf";
```

---

## Files to Change

| File | Changes |
|------|---------|
| `src/pages/admin/AdminSettings.tsx` | Remove "Modern" option, replace preview with PDF iframe |
| `src/components/onboarding/OnboardingWizard.tsx` | Remove "Modern" option from template selection |
| `src/components/onboarding/QuoteTemplatePreview.tsx` | Remove "Modern" template code block |
| `src/components/estimates/PrintableEstimate.tsx` | Remove all "modern" template branches |

---

## Technical Notes

### PDF Preview Approach
- Uses the existing `generateQuotePDF` function which returns a base64-encoded PDF
- Converts to a Blob URL for embedding in an `<iframe>`
- Debounced (500ms) to prevent excessive regeneration during rapid color/font changes
- Memory-safe with proper `URL.revokeObjectURL()` cleanup

### Why iframe instead of PDF.js?
- Native browser PDF viewer is sufficient for preview purposes
- No additional library code needed
- Works reliably across modern browsers
- PDF.js is already used elsewhere in the app if needed for fallback

### Data Migration Note
Users who previously had "modern" as their saved template will fall back to "classic" (the default) since the "modern" rendering code will be removed and `template || "classic"` is used throughout.

