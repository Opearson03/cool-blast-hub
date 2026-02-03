# Quote Template Cleanup & Live PDF Preview

## Status: ✅ COMPLETED

## Changes Made

### Phase 1: Removed "Modern" Template Option
- ✅ Removed from `AdminSettings.tsx` template selector (now 2-column grid)
- ✅ Removed from `OnboardingWizard.tsx` template selector (now 2-column grid)
- ✅ Removed all "modern" template rendering from `QuoteTemplatePreview.tsx`
- ✅ Removed main "modern" template block from `PrintableEstimate.tsx`
- ✅ Removed all "modern" branches from helper functions in `PrintableEstimate.tsx`

### Phase 2: Added Live PDF Preview
- ✅ Created `LivePDFPreview.tsx` component in `/src/components/settings/`
- ✅ Generates real PDF using `generateQuotePDF` function
- ✅ Displays PDF in embedded iframe
- ✅ 500ms debounce prevents excessive regeneration during color/font changes
- ✅ Memory-safe with proper `URL.revokeObjectURL()` cleanup
- ✅ Replaced static `QuoteTemplatePreview` in AdminSettings with live PDF iframe

## Technical Notes

### Data Migration
Users who had "modern" saved will automatically fall back to "classic" (the default) since the rendering code was removed and `template || "classic"` is used throughout.

### File Changes Summary
| File | Status |
|------|--------|
| `src/pages/admin/AdminSettings.tsx` | ✅ Updated |
| `src/components/onboarding/OnboardingWizard.tsx` | ✅ Updated |
| `src/components/onboarding/QuoteTemplatePreview.tsx` | ✅ Cleaned up |
| `src/components/estimates/PrintableEstimate.tsx` | ✅ Cleaned up |
| `src/components/settings/LivePDFPreview.tsx` | ✅ Created |
