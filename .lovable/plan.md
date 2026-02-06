
# Plan: Add Industry Photos to Supplier Landing Page

## Overview

Add the two uploaded concrete industry photos to the `/suppliers` landing page to increase visual appeal and industry credibility. The photos will be placed strategically where they add the most value without cluttering the simplified layout.

---

## Image Placement Strategy

### Image 1: Concrete Pour (2.png)
**Placement**: Hero section background or accent image

This image shows concrete being poured from a chute - representing the supply/ordering moment that suppliers want to be part of. It reinforces the headline about "placing orders."

**Implementation**: Add as a subtle background image with overlay in the hero section, or as a decorative accent image.

---

### Image 2: Concrete Finishing (3.png)  
**Placement**: "How It Works" section

This image shows a worker finishing concrete with hand tools - representing the professional concreters who use PourHub. It connects the "operations platform concreters use" messaging to real craftspeople.

**Implementation**: Add as an inline image between the intro text and the 3-step cards.

---

## Technical Implementation

### 1. Copy Images to Project

```
src/assets/supplier-concrete-pour.png    <- user-uploads://2.png
src/assets/supplier-concrete-finish.png  <- user-uploads://3.png
```

### 2. Update SuppliersLanding.tsx

**Hero Section Changes:**
- Add the concrete pour image as a background with dark overlay
- Position the gradient overlay to ensure text remains readable
- Image will be visible on larger screens, subtle on mobile

**"How It Works" Section Changes:**
- Add the concrete finishing image as a full-width banner
- Apply rounded corners and subtle shadow for polish
- Use `object-cover` to maintain aspect ratio

---

## Visual Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
├─────────────────────────────────────────────────────────────┤
│ HERO (with concrete pour background image + overlay)        │
│ ┌─────────────────────────────┐  ┌───────────────────────┐  │
│ │ Headline + subtext          │  │ LOGIN CARD            │  │
│ │ [Register Interest]         │  │                       │  │
│ └─────────────────────────────┘  └───────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ HOW IT WORKS                                                │
│ Brief intro + category tags                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Concrete finishing image - worker troweling]           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│ │ RFQ     │ │ PO      │ │ Repeat  │                        │
│ └─────────┘ └─────────┘ └─────────┘                        │
├─────────────────────────────────────────────────────────────┤
│ WHY POURHUB (unchanged - 6 benefit cards)                   │
├─────────────────────────────────────────────────────────────┤
│ CTA - Register Interest                                     │
├─────────────────────────────────────────────────────────────┤
│ FOOTER                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Source |
|------|--------|
| `src/assets/supplier-concrete-pour.png` | `user-uploads://2.png` |
| `src/assets/supplier-concrete-finish.png` | `user-uploads://3.png` |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/suppliers/SuppliersLanding.tsx` | Import images, add to hero background and "How It Works" section |

---

## Code Changes Preview

**Hero Section** (lines 146-213):
- Add `relative overflow-hidden` to section
- Add absolute positioned image behind content with dark overlay gradient
- Content remains on top with `relative z-10`

**"How It Works" Section** (lines 215-256):
- Add the finishing image as a responsive banner between the category tags and the 3 placement cards
- Use `rounded-xl overflow-hidden shadow-lg` for polished appearance
- Include descriptive alt text for accessibility
