

## Goal
1. Ensure Classic template page 2 fits on a single A4 page
2. Remove white margins from the page edges so the letterhead color extends edge-to-edge

---

## Current Issues Analysis

### Issue 1: Page 2 Content Overflowing
The Classic template's page 2 (`TermsAndExclusionsPage` component) contains:
- Letterhead header with accent bar and secondary color background
- Inclusions section (boxed with green header)
- Exclusions section (boxed with orange header)
- Payment Terms section (boxed with secondary color header)
- Authorization/Acceptance block

With large inclusion/exclusion lists, this content may exceed A4 height.

### Issue 2: White Margins Around Edges
The `TermsAndExclusionsPage` component has padding that creates white gaps:
- `pt-8` on the container adds top padding
- `mb-8` on sections adds spacing that could be reduced
- Header uses `px-4` padding instead of letting color fill full width
- The `.print-container` has `padding: 20px` which creates margins

---

## Solution

### 1. Full-bleed letterhead on page 2
- Remove `pt-8` from the page-2 container
- Make the header background extend full width (no horizontal padding on the background container)
- Apply internal padding only to the content inside the header

### 2. Reduce vertical spacing to fit on one page
- Reduce `mb-8` to `mb-4` on sections (Inclusions, Exclusions, Payment Terms)
- Reduce internal padding in boxed sections (`p-4` to `p-3`)
- Make the Authorization block more compact
- Reduce font sizes slightly where appropriate

### 3. Remove container padding for page 2
- The print-container padding should not apply to page 2's edge-to-edge elements
- Use negative margins or restructure to allow the letterhead to "break out" of container padding

---

## Technical Changes

### File: `src/components/estimates/PrintableEstimate.tsx`

#### Change 1: Page 2 container - remove top padding (line ~640)
```tsx
// Before
<div data-pdf-section="page-2" className="page-break-before pt-8">

// After
<div data-pdf-section="page-2" className="page-break-before">
```

#### Change 2: Classic header in TermsAndExclusionsPage - full-bleed with negative margins (lines ~418-439)
Apply negative horizontal margins to break out of container padding, and use smaller spacing:

```tsx
// Before
return (
  <div className="mb-6">
    <div style={{ height: "6px", backgroundColor: primaryColor }}></div>
    <div className="flex justify-between items-center py-4 px-4" style={{ backgroundColor: secondaryColor }}>

// After
return (
  <div className="mb-4 -mx-5"> {/* Negative margin to break out of container padding */}
    <div style={{ height: "6px", backgroundColor: primaryColor }}></div>
    <div style={{ backgroundColor: secondaryColor }}>
      <div className="flex justify-between items-center py-3 px-5">
```

#### Change 3: Reduce section margins (lines ~473-498, 524-541, 566-584)
Change all boxed sections from `mb-8` to `mb-4`:

```tsx
// Inclusions, Exclusions, Payment Terms sections
// Before
<div className="mb-8">

// After
<div className="mb-4">
```

#### Change 4: Reduce internal padding in sections
```tsx
// Before
<div className="p-4 bg-gray-50">

// After
<div className="p-3 bg-gray-50">
```

#### Change 5: Compact Authorization block (lines ~611-636)
```tsx
// Before
<div className="p-6 bg-white">
  <p className="text-xs text-gray-600 mb-6">
  ...
  <div className="border-b-2 border-gray-400 h-10 mb-1"></div>

// After
<div className="p-4 bg-white">
  <p className="text-xs text-gray-600 mb-4">
  ...
  <div className="border-b-2 border-gray-400 h-8 mb-1"></div>
```

#### Change 6: Smaller font and reduced line items
Make inclusion/exclusion list items more compact:
```tsx
// Before
<li key={index} className="text-sm text-green-700 flex items-start gap-2">

// After  
<li key={index} className="text-xs text-green-700 flex items-start gap-2">
```

#### Change 7: Print container padding adjustment
In `printStyles`, change the padding for screen mode to allow full-bleed sections:

```tsx
// Before
padding: 20px;

// After
padding: 20px 20px 20px 20px;
```

And for page 2, add a class that allows negative margins to work:
```tsx
.print-container {
  overflow: visible; // Allow negative margins to extend
}
```

---

## Visual Result
- Page 2 header: Primary accent bar + secondary color background extending to page edges (no white gaps)
- All sections fit on one page with compact spacing
- Professional appearance with consistent letterhead across both pages
- Content is still readable but uses space more efficiently

---

## Files to Change
- `src/components/estimates/PrintableEstimate.tsx` (TermsAndExclusionsPage component, lines 374-648)

