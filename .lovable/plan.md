

## Goal
Update the **Classic** quote template to have a more professional, distinguished appearance that clearly differentiates it from the **Minimal** template while maintaining all existing functionality.

---

## Current State Comparison

| Feature | Classic (Current) | Minimal |
|---------|------------------|---------|
| Header | Solid color banner with logo + title | Light "QUOTE" title with logo right-aligned |
| Info Tables | Gray background labels, plain borders | Same gray backgrounds, same borders |
| Line Items | Solid header, alternating rows | Bordered header, alternating rows |
| Grand Total | Primary color background row | Gray background row |
| Page 2 | Colored boxes (green/orange) for inclusions/exclusions | Clean gray text with minimal styling |
| Signature Area | Basic signature lines | Basic signature lines |

**Problem**: After recent updates, both templates now look too similar - same table structure, same gray info boxes.

---

## Design Direction for Classic Template

Make the Classic template look like a **traditional business invoice/quote form** with:
- **Stronger use of brand colors** throughout the document
- **Boxed sections with colored headers** (like official forms)
- **More formal typography** with clear section labels
- **Document reference number prominently displayed**
- **Company letterhead-style header**

---

## Implementation Plan

### File: `src/components/estimates/PrintableEstimate.tsx`

### 1. Enhanced Header Banner (Lines 1013-1028)

Replace the simple header banner with a more elaborate letterhead-style header:

```tsx
{/* Letterhead-style Header */}
<div className="page-break-avoid mb-6">
  {/* Top accent bar */}
  <div style={{ height: "8px", backgroundColor: primaryColor }}></div>
  
  {/* Main header area */}
  <div className="flex justify-between items-center py-4 px-6" style={{ backgroundColor: secondaryColor }}>
    <div className="flex items-center gap-4">
      {business?.logo_url && (
        <img
          src={business.logo_url}
          alt="Company logo"
          style={{ maxHeight: "60px", maxWidth: "140px", backgroundColor: "white", borderRadius: "4px", padding: "8px" }}
        />
      )}
      <div className="text-white">
        <h1 className="text-2xl font-bold tracking-wide">{business?.name || "Company Name"}</h1>
        <p className="text-sm opacity-90">{business?.address || ""}</p>
      </div>
    </div>
    <div className="text-right text-white">
      <p className="text-3xl font-bold tracking-wider">QUOTE</p>
      <p className="text-lg font-semibold" style={{ color: primaryColor }}>{estimate.estimate_number}</p>
    </div>
  </div>
</div>
```

### 2. Redesigned Info Tables (Lines 1030-1089)

Replace the matching gray tables with **colored header sections** that differentiate from Minimal:

```tsx
{/* Two-column info boxes with colored section headers */}
<div className="page-break-avoid grid grid-cols-2 gap-6 mb-6 px-4">
  {/* Left - Customer Details */}
  <div className="border border-gray-300 rounded overflow-hidden">
    <div className="px-4 py-2" style={{ backgroundColor: secondaryColor }}>
      <p className="text-sm font-bold text-white uppercase tracking-wide">Bill To</p>
    </div>
    <div className="p-4 space-y-2">
      <p className="text-base font-semibold text-gray-900">{estimate.client_name}</p>
      <p className="text-sm text-gray-600">{estimate.site_address}</p>
      {estimate.client_email && <p className="text-sm text-gray-600">{estimate.client_email}</p>}
      {estimate.client_phone && <p className="text-sm text-gray-600">{estimate.client_phone}</p>}
    </div>
  </div>

  {/* Right - Quote Details */}
  <div className="border border-gray-300 rounded overflow-hidden">
    <div className="px-4 py-2" style={{ backgroundColor: secondaryColor }}>
      <p className="text-sm font-bold text-white uppercase tracking-wide">Quote Details</p>
    </div>
    <table className="w-full text-sm">
      <tbody>
        <tr className="border-b border-gray-200">
          <td className="px-4 py-2 text-gray-600 font-medium">Quote #</td>
          <td className="px-4 py-2 text-gray-900 text-right font-semibold">{estimate.estimate_number}</td>
        </tr>
        <tr className="border-b border-gray-200">
          <td className="px-4 py-2 text-gray-600 font-medium">Date</td>
          <td className="px-4 py-2 text-gray-900 text-right">{format(new Date(estimate.created_at), "d MMMM yyyy")}</td>
        </tr>
        <tr className="border-b border-gray-200">
          <td className="px-4 py-2 text-gray-600 font-medium">Valid Until</td>
          <td className="px-4 py-2 text-gray-900 text-right">{estimate.valid_until ? format(new Date(estimate.valid_until), "d MMMM yyyy") : "-"}</td>
        </tr>
        <tr>
          <td className="px-4 py-2 text-gray-600 font-medium">ABN</td>
          <td className="px-4 py-2 text-gray-900 text-right">{business?.abn || "-"}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 3. Project/Site Description Section (Add after info boxes)

Add a distinct site/project description area:

```tsx
{/* Project Description */}
{estimate.description && (
  <div className="page-break-avoid mb-6 px-4">
    <div className="border border-gray-300 rounded overflow-hidden">
      <div className="px-4 py-2" style={{ backgroundColor: primaryColor }}>
        <p className="text-sm font-bold text-white uppercase tracking-wide">Project Description</p>
      </div>
      <div className="p-4 bg-gray-50">
        <p className="text-sm text-gray-700">{estimate.description}</p>
      </div>
    </div>
  </div>
)}
```

### 4. Enhanced Line Items Table (Lines 1126-1169)

Add more visual weight and professionalism:

```tsx
{/* Line Items with enhanced styling */}
<div className="page-break-avoid mb-6 border border-gray-300 rounded overflow-hidden">
  <table className="w-full">
    <thead>
      <tr style={{ backgroundColor: secondaryColor }}>
        <th className="text-left py-3 px-4 text-sm font-bold text-white uppercase tracking-wide">Item Description</th>
        <th className="text-right py-3 px-4 text-sm font-bold text-white uppercase tracking-wide w-24">Unit Price</th>
        <th className="text-center py-3 px-4 text-sm font-bold text-white uppercase tracking-wide w-16">Qty</th>
        <th className="text-center py-3 px-4 text-sm font-bold text-white uppercase tracking-wide w-16">GST</th>
        <th className="text-right py-3 px-4 text-sm font-bold text-white uppercase tracking-wide w-28">Amount</th>
      </tr>
    </thead>
    <tbody>
      {/* Line items with alternating rows */}
      {/* ... existing mapping logic ... */}
    </tbody>
  </table>
  
  {/* Totals section with accent bar */}
  <div className="border-t-2" style={{ borderColor: primaryColor }}>
    <table className="w-full">
      <tbody>
        <tr className="bg-gray-50">
          <td colSpan={4} className="py-2 px-4 text-sm font-medium text-right text-gray-700">Subtotal (ex GST)</td>
          <td className="py-2 px-4 text-sm text-right font-medium w-28">{formatCurrency(estimate.total_amount / 1.1)}</td>
        </tr>
        <tr className="bg-gray-50">
          <td colSpan={4} className="py-2 px-4 text-sm font-medium text-right text-gray-700">GST (10%)</td>
          <td className="py-2 px-4 text-sm text-right font-medium w-28">{formatCurrency(estimate.total_amount - (estimate.total_amount / 1.1))}</td>
        </tr>
        <tr style={{ backgroundColor: primaryColor }}>
          <td colSpan={4} className="py-3 px-4 text-base font-bold text-right text-white uppercase">Total Due</td>
          <td className="py-3 px-4 text-xl text-right font-bold text-white w-28">{formatCurrency(estimate.total_amount)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 5. Enhanced Signature Section (Lines 1212-1224)

More formal dual-signature block:

```tsx
{/* Formal Signature Block */}
<div className="page-break-avoid mt-8 border border-gray-300 rounded overflow-hidden">
  <div className="px-4 py-2" style={{ backgroundColor: secondaryColor }}>
    <p className="text-sm font-bold text-white uppercase tracking-wide">Authorization</p>
  </div>
  <div className="p-6">
    <p className="text-xs text-gray-600 mb-6">
      I accept this quotation and authorize commencement of the described works.
    </p>
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="border-b-2 border-gray-400 h-10 mb-1"></div>
        <p className="text-xs text-gray-500">Authorized Signature</p>
      </div>
      <div>
        <div className="border-b-2 border-gray-400 h-10 mb-1"></div>
        <p className="text-xs text-gray-500">Date</p>
      </div>
    </div>
    <div className="mt-4">
      <div className="border-b border-gray-300 h-8 mb-1"></div>
      <p className="text-xs text-gray-500">Print Name</p>
    </div>
  </div>
</div>
```

### 6. Update Page 2 Styling (TermsAndExclusionsPage sections)

Enhance the Classic template sections in `TermsAndExclusionsPage` with boxed headers:

- **Header**: Add accent bar and stronger branding
- **Inclusions/Exclusions**: Keep colored backgrounds but add section header bars
- **Terms**: More formal bordered section
- **Acceptance**: Match the enhanced signature block style

---

## Visual Comparison After Changes

| Feature | Classic (Updated) | Minimal |
|---------|------------------|---------|
| Header | Letterhead with accent bar, large QUOTE + number | Simple "QUOTE" text left, logo right |
| Info Layout | Boxed cards with colored headers ("Bill To", "Quote Details") | Aligned tables with gray label backgrounds |
| Line Items | Bordered container with header bar + accent totals | Simple table with underline header |
| Grand Total | Primary color band at bottom of table | Gray row in table footer |
| Signature | Boxed "Authorization" section | Simple signature lines |
| Page 2 | Colored section headers | Minimal gray headers |

---

## Key Differentiators

1. **Colored section headers** throughout the Classic template (secondary color backgrounds)
2. **Accent bars** using primary color for visual hierarchy
3. **"Bill To" / "Quote Details"** labeling vs Minimal's "Customer Details" / business name
4. **Bordered containers** around all sections vs Minimal's borderless flow
5. **Letterhead-style header** with company info vs Minimal's clean QUOTE title
6. **Quote number prominently displayed** in header vs inline in table

---

## Files to Change

- `src/components/estimates/PrintableEstimate.tsx`
  - Lines 1013-1028: Redesign header to letterhead style
  - Lines 1030-1089: Replace info tables with boxed card layout
  - Lines 1091-1100: Remove ProjectSummarySection or integrate differently
  - Lines 1101-1171: Enhance line items table with container + accent totals
  - Lines 1212-1224: Redesign signature block as formal Authorization section
  - Lines 410-609 (TermsAndExclusionsPage sections): Update Classic branch styling

No backend changes required. All changes are frontend styling only.

