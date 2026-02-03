
## Goal
1. Fit the Classic template's first page content onto a single A4 page
2. Remove white margins from the header/letterhead area so colors extend edge-to-edge

---

## Current Issues Analysis

### Issue 1: Content Overflowing Page 1
The Classic template currently includes too many sections on page 1:
- Letterhead header (accent bar + company info)
- Two-column info boxes (Bill To / Quote Details)
- Project Description section
- Project Summary section
- Line Items table with totals
- Authorization block

This is too much vertical content for 277mm (A4 minus margins).

### Issue 2: White Margins in Header
The header currently has:
```tsx
<div className="px-6" style={{ backgroundColor: secondaryColor }}>
```
And content sections use:
```tsx
<div className="page-break-avoid grid grid-cols-2 gap-6 mb-6 px-4">
```

These padding values create white gaps on the sides of the colored areas.

---

## Solution

### 1. Simplify the Classic template layout
- **Remove the Project Summary section** from page 1 (it duplicates information already shown in line items)
- **Reduce vertical spacing** (mb-6 → mb-4, padding reductions)
- **Make the Authorization block more compact** (reduce internal padding)
- **Remove redundant Project Description** since the site address is already in Bill To

### 2. Full-bleed letterhead header
- Remove `px-6` padding from the header container
- Let the accent bar and secondary color header extend full width
- Add padding only to the inner flex content, not the background container
- Remove `px-4` from content sections below since print-container already has padding

### 3. Cleaner color usage
- Header: Primary accent bar + secondary color background (full width)
- Section headers: Keep secondary color for "Bill To", "Quote Details", etc.
- Line items table header: Use secondary color
- Total row: Use primary color
- Remove the separate "Project Description" section header

---

## Technical Changes

### File: `src/components/estimates/PrintableEstimate.tsx`

#### Change 1: Full-bleed header (lines ~1041-1066)
Remove px-6 from the header container, apply internal padding to the flex content only:

```tsx
// Before
<div className="page-break-avoid mb-6">
  <div style={{ height: "8px", backgroundColor: primaryColor }}></div>
  <div className="flex justify-between items-center py-4 px-6" style={{ backgroundColor: secondaryColor }}>

// After
<div className="page-break-avoid mb-4">
  <div style={{ height: "8px", backgroundColor: primaryColor }}></div>
  <div style={{ backgroundColor: secondaryColor }}>
    <div className="flex justify-between items-center py-3 px-6">
```

#### Change 2: Remove px-4 from content sections (lines ~1069, 1114, 1128)
The print-container already has padding, so sections don't need additional horizontal padding:

```tsx
// Before
<div className="page-break-avoid grid grid-cols-2 gap-6 mb-6 px-4">

// After
<div className="page-break-avoid grid grid-cols-2 gap-4 mb-4">
```

#### Change 3: Remove Project Description section (lines ~1112-1125)
The site address is already shown in "Bill To", so this is redundant. Remove the entire conditional block.

#### Change 4: Remove Project Summary from page 1 (lines ~1129-1135)
Remove the `<ProjectSummarySection>` call from the Classic template's page 1 to save vertical space.

#### Change 5: Compact Authorization block (lines ~1259-1283)
Reduce padding and vertical spacing:

```tsx
// Before
<div className="page-break-avoid mt-8 border...">
  <div className="p-6 bg-white">
    <p className="text-xs text-gray-600 mb-6">

// After
<div className="page-break-avoid mt-auto border...">  {/* mt-auto pushes to bottom */}
  <div className="p-4 bg-white">
    <p className="text-xs text-gray-600 mb-4">
```

#### Change 6: Reduce table row padding
In the line items table, reduce py-3 to py-2 for more compact rows.

---

## Visual Result
- Header accent bar + company name area: Full width colored block, no white gaps
- Content sections: Properly padded but no horizontal offsets from header
- All content fits on page 1 with Authorization block at the bottom
- Cleaner, more professional appearance

---

## Files to Change
- `src/components/estimates/PrintableEstimate.tsx` (Classic template section, lines 1019-1285)
