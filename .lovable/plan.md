
# Plan: Simplify Supplier Landing Page

## Overview

The current page has 10 sections spanning 520 lines. This plan consolidates it into 4 focused sections while retaining all core value propositions, reducing visual noise and improving user focus.

---

## Current Structure (10 sections)

1. Hero + Login
2. What is PourHub?
3. What is Preferred Supplier Placement?
4. Where Your Brand Appears (3 workflow moments)
5. Categories We Support
6. Why This Works Better (3 reasons)
7. What Suppliers Receive (4 benefits)
8. What You Don't Pay For
9. Expected Commercial Impact
10. CTA + Footer

---

## Proposed Simplified Structure (4 sections)

### Section 1: Hero + Login (keep as-is)
- Strong headline about reaching concreters at the moment they order
- "Register Interest" button
- Login card for existing suppliers

### Section 2: How It Works
Merge sections 2-5 into one clean section:
- Brief "What is PourHub?" intro (1-2 sentences)
- Inline category tags (Concrete, Reinforcement, etc.)
- 3 placement moments in a compact format

### Section 3: Why Choose PourHub
Merge sections 6-8 into one benefits section:
- Key benefits in a 2x3 or 3x2 grid
- Include: Confirmed intent buyers, No price-shopping, Geographic targeting, Category exclusivity, Direct RFQs/POs, No commissions/revenue share

### Section 4: CTA + Footer
- Simple call to action with "Register Interest"
- Footer

---

## Content Being Preserved

| Core Message | Where It Goes |
|--------------|---------------|
| PourHub is used by concreters to quote, schedule, and order | Section 2 intro |
| Supplier categories (Concrete, Reinforcement, etc.) | Section 2 inline tags |
| 3 placement moments (RFQ, PO, Repeat) | Section 2 cards |
| Buyers with confirmed intent | Section 3 |
| Bypass price-shopping | Section 3 |
| Geographic targeting | Section 3 |
| Category exclusivity | Section 3 |
| Direct RFQs & POs | Section 3 |
| No commissions/revenue share | Section 3 |

## Content Being Removed/Condensed

- Separate "What is Preferred Supplier Placement?" section (merged into hero copy)
- "What Suppliers Receive" 4-card grid (consolidated into benefits grid)
- "Expected Commercial Impact" section (implied by other benefits)
- Redundant explanatory text

---

## Technical Changes

### File: `src/pages/suppliers/SuppliersLanding.tsx`

**Before:** ~520 lines, 10 sections
**After:** ~280 lines, 4 sections

Changes:
1. Keep hero section with login card (lines 189-266)
2. Create new "How It Works" section combining PourHub intro + categories + 3 placement moments
3. Create new "Why PourHub" section with 6 concise benefit cards
4. Keep CTA + Footer (simplified)
5. Remove standalone sections for:
   - "What is Preferred Supplier Placement"
   - "Categories We Support" (inline into How It Works)
   - "Why This Works Better" (merged)
   - "What Suppliers Receive" (merged)
   - "What You Don't Pay For" (merged)
   - "Expected Commercial Impact" (removed)

---

## Visual Layout

```text
┌─────────────────────────────────────────────┐
│ HEADER                                      │
├─────────────────────────────────────────────┤
│ HERO                          │ LOGIN CARD  │
│ Headline + subtext            │             │
│ [Register Interest]           │             │
├─────────────────────────────────────────────┤
│ HOW IT WORKS                                │
│ Brief intro + category tags                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ RFQ     │ │ PO      │ │ Repeat  │        │
│ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────┤
│ WHY POURHUB                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │Confirmed│ │No Price │ │Geographic│       │
│ │Intent   │ │Shopping │ │Targeting │       │
│ ├─────────┤ ├─────────┤ ├─────────┤        │
│ │Category │ │Direct   │ │No       │        │
│ │Exclusive│ │RFQs/POs │ │Commission│       │
│ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────┤
│ CTA - Register Interest                     │
├─────────────────────────────────────────────┤
│ FOOTER                                      │
└─────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/suppliers/SuppliersLanding.tsx` | Consolidate 10 sections into 4 focused sections |
