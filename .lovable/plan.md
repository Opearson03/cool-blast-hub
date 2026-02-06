

# Classic Quote Template: Aesthetic Improvement Plan

## Current State Analysis

After reviewing the Classic template code in `PrintableEstimate.tsx`, I've identified several aesthetic issues that make it feel dense and less polished compared to the Simple template.

### Identified Issues

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAGE 1 ISSUES                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. HEADER IS TOO HEAVY                                                     │
│     - Solid dark secondary color background dominates top of page           │
│     - Logo cramped with white background box looks awkward                  │
│     - Quote number colour (primaryColor) doesn't pop enough                 │
│                                                                             │
│  2. INFO BOXES LOOK CRAMPED                                                 │
│     - "Bill To" and "Quote Details" boxes sit too close to header           │
│     - Minimal breathing room between elements                               │
│     - Grey table stripes in Quote Details feel monotonous                   │
│                                                                             │
│  3. LINE ITEMS TABLE LACKS VISUAL HIERARCHY                                 │
│     - Header row blends into content with same dark background              │
│     - No visual separation between item rows and totals section             │
│     - Primary colour "Total Due" bar feels disconnected                     │
│                                                                             │
│  4. AUTHORISATION BLOCK UNDERWHELMING                                       │
│     - Sits at bottom with minimal visual weight                             │
│     - Same box style as everything else - doesn't feel like a call-to-action│
│     - Signature lines too thin                                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  PAGE 2 ISSUES                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  5. HEADER INCONSISTENT WITH PAGE 1                                         │
│     - Uses negative margins which can cause PDF rendering issues            │
│     - Letterhead feels disconnected from page 1 style                       │
│                                                                             │
│  6. SECTIONS TOO SMALL & CRAMPED                                            │
│     - Payment Terms, Inclusions, Exclusions boxes have tiny text (xs/10px)  │
│     - Dense list formatting makes it hard to scan                           │
│     - Too much whitespace at bottom, not enough between sections            │
│                                                                             │
│  7. AUTHORISATION BLOCK DUPLICATED                                          │
│     - Another signature block on page 2 is redundant with page 1            │
│     - Creates confusion about where to sign                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Design Improvements

### Design Philosophy
Create a **polished, professional invoice-style layout** that uses colour accents strategically rather than as solid blocks, improves typography hierarchy, and adds breathing room between elements.

### Visual Changes Summary

```text
BEFORE (Current)                          AFTER (Improved)
┌──────────────────────────────┐          ┌──────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│          │═══════════════════════════════│ ← Thin accent bar only
│▓▓ LOGO  Company     QUOTE ▓▓│          │                               │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│          │  LOGO  Company          QUOTE │ ← Clean white header
├──────────────────────────────┤          │                     Q-00001   │
│┌─────────┐  ┌─────────────┐ │          ├──────────────────────────────┤
││BILL TO  │  │QUOTE DETAILS││          │                               │
│├─────────┤  ├─────────────┤│          │  BILL TO         QUOTE INFO   │ ← Lighter section headers
││ cramped │  │  cramped    ││          │  ─────────       ──────────   │
│└─────────┘  └─────────────┘│          │  (more space)    (cleaner)    │
├──────────────────────────────┤          ├──────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│          │  SCOPE OF WORKS               │ ← Primary colour left border
│▓ Item │ Price │ Qty │ Total▓│          │  ────────────────────────────│
├──────────────────────────────┤          │  Item │ Price │ Qty │ Total │
│ row  │ row   │ row │ row    │          ├──────────────────────────────┤
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│          │        Subtotal    $X,XXX    │
│▓▓▓▓▓ TOTAL DUE  $XX,XXX ▓▓▓▓│          │        GST         $XXX      │
│                              │          │  ═══════════════════════════ │
│┌────────────────────────────┐│          │       TOTAL DUE   $XX,XXX    │ ← Bold, highlighted row
││ AUTHORISATION (small box)  ││          ├──────────────────────────────┤
│└────────────────────────────┘│          │                               │
└──────────────────────────────┘          │  ┌── AUTHORISATION ─────────┐│ ← Prominent CTA block
                                          │  │  Signature    │   Date   ││
                                          │  └──────────────────────────┘│
                                          └──────────────────────────────┘
```

---

## Technical Changes

### File: `src/components/estimates/PrintableEstimate.tsx`

#### 1. Page 1 Header (Lines ~1052-1079)
**Current:** Full-width dark secondary colour background with cramped logo
**Change to:**
- Thin 4px primary colour accent bar at top
- Clean white background header area
- Logo without awkward white box (or subtle rounded container)
- "QUOTE" title in primary colour, quote number below in secondary colour
- Add subtle bottom border to separate from content

```tsx
{/* NEW: Refined header */}
<div className="page-break-avoid mb-6">
  <div style={{ height: "4px", backgroundColor: primaryColor }}></div>
  <div className="flex justify-between items-center py-4 px-6 border-b border-gray-200">
    <div className="flex items-center gap-4">
      {business?.logo_url && (
        <img src={business.logo_url} alt="Logo" 
          style={{ maxHeight: "50px", maxWidth: "120px" }} />
      )}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{business?.name}</h1>
        <p className="text-sm text-gray-500">{business?.address}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-2xl font-bold" style={{ color: primaryColor }}>QUOTE</p>
      <p className="text-base font-semibold text-gray-700">{estimate.estimate_number}</p>
    </div>
  </div>
</div>
```

#### 2. Info Boxes - Bill To & Quote Details (Lines ~1081-1123)
**Current:** Dark secondary headers on boxes, cramped spacing
**Change to:**
- Use primary colour left border accent instead of full header
- Lighter grey header backgrounds
- More vertical padding within cells
- Remove redundant "Quote #" (already in header)

```tsx
{/* Bill To box with accent border */}
<div className="border-l-4 border-gray-200 pl-4" 
     style={{ borderLeftColor: primaryColor }}>
  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Bill To</p>
  <p className="text-base font-semibold text-gray-900">{estimate.client_name}</p>
  ...
</div>
```

#### 3. Line Items Table (Lines ~1153-1212)
**Current:** Dark header row, cramped cells, disconnected totals bar
**Change to:**
- Lighter header (grey-100 background, dark text with primary colour accent)
- More row padding for readability
- Integrated totals section with clear visual hierarchy
- Subtle row hover states via alternating backgrounds

#### 4. Authorisation Block (Lines ~1261-1285)
**Current:** Same box style as other sections, easily overlooked
**Change to:**
- Larger signature lines with more height (12px instead of 8px)
- Primary colour left border accent to draw attention
- Slightly larger text for the acceptance statement
- Remove duplicate block from Page 2

#### 5. Page 2 Header (Lines ~419-441)
**Current:** Negative margins and full bleed causing potential render issues
**Change to:**
- Match Page 1 header style exactly (thin accent bar + white header)
- Remove negative margins
- Consistent "Terms & Conditions" branding

#### 6. Page 2 Content Sections (Lines ~473-639)
**Current:** Tiny text (xs/10px), cramped lists
**Change to:**
- Increase text to small (12-14px)
- Add more vertical spacing between items
- Use consistent accent border style from Page 1
- Remove redundant Authorisation block (user signs on Page 1)

---

## Files to Change

| File | Changes |
|------|---------|
| `src/components/estimates/PrintableEstimate.tsx` | Refactor Classic template header, info boxes, line items table, authorisation block styling on Page 1; Update Page 2 header and section styling; Remove duplicate authorisation |

---

## Expected Outcome

1. **Page 1:**
   - Clean, modern header with subtle colour accents
   - Well-spaced info boxes with clear hierarchy
   - Professional pricing table with integrated totals
   - Prominent authorisation block that invites signing

2. **Page 2:**
   - Consistent header matching Page 1
   - Readable terms, inclusions, and exclusions (no signature block)
   - Better use of vertical space

3. **Both pages:**
   - Conform to independent A4 page requirement
   - Maintain 277mm min-height for page 1
   - Use page-break-before for page 2
   - Preserve all branding colour customisation
