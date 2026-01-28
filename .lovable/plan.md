
# Plan: Redesign Settings Page with Collapsible Sections and Logical Grouping

## Current Issues

1. **Inconsistent Layout**: Mix of always-open cards and collapsible sections
2. **No Logical Grouping**: Related settings are scattered throughout the page
3. **Overwhelming Length**: The Branding section alone takes up ~250 lines of UI
4. **Poor Default State**: Most sections expanded by default, making the page overwhelming

## Proposed Structure

Reorganize into **4 logical groups**, all using a unified collapsible accordion pattern:

```text
┌─────────────────────────────────────────────────────────────┐
│  SETTINGS                                                   │
│  Manage your business information                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ ACCOUNT ──────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ▶ Subscription                    [collapsed]          │ │
│  │  ▶ Account Security                [collapsed]          │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ BUSINESS ─────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ▶ Business Details                [collapsed]          │ │
│  │  ▶ Preferred Suppliers             [collapsed]          │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ DOCUMENTS ────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ▶ Branding & Quote Templates      [collapsed]          │ │
│  │  ▶ My Price List                   [collapsed]          │ │
│  │  ▶ Test Result Email               [collapsed]          │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ SUPPORT ──────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ▶ Feedback                        [collapsed]          │ │
│  │  ▶ Legal                           [collapsed]          │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  [ Save Settings ]                                          │
│                                                             │
│  ▶ Advanced options (Danger Zone - hidden by default)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

1. **All Sections Collapsed by Default**: Clean initial view, user expands what they need
2. **Consistent Accordion Pattern**: Every section uses Radix Accordion for smooth animations
3. **Grouped by Purpose**:
   - **Account**: Your subscription and security
   - **Business**: Company info and suppliers
   - **Documents**: Quote templates, pricing, email ingestion
   - **Support**: Feedback and legal links
4. **Group Headers**: Light section dividers with category labels
5. **Unified Styling**: Each accordion item uses the same card-like appearance with chevron indicators

## Implementation Details

### Component Changes

**Create New Component: `SettingsAccordionItem.tsx`**
A reusable wrapper that provides consistent styling for each settings section:
- Icon + Title + Description in trigger
- Chevron that rotates on open
- Smooth height animation
- Card-like appearance with border

### Section Reorganization

| Group | Sections (in order) | Icon |
|-------|---------------------|------|
| Account | Subscription, Account Security | CreditCard, Lock |
| Business | Business Details, Preferred Suppliers | Building2, Truck |
| Documents | Branding & Templates, Price List, Test Email | Palette, DollarSign, Mail |
| Support | Feedback, Legal | MessageSquare, FileText |

### Technical Approach

1. Use Radix `Accordion` component with `type="multiple"` to allow multiple sections open
2. Create a consistent `AccordionItem` wrapper for uniform styling
3. Keep all existing logic and form fields - just restructure the layout
4. Use CSS transitions for smooth expand/collapse animations
5. Add light section header labels between groups

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminSettings.tsx` | Restructure into grouped accordions, all collapsed by default |

### Benefits

- **Cleaner Initial View**: User sees organized categories, not a wall of forms
- **Faster Navigation**: Users can jump to the section they need
- **Consistent UX**: Same interaction pattern throughout
- **Better Mobile Experience**: Less scrolling, more intentional navigation
- **Maintainable Code**: Grouped sections make future additions logical
