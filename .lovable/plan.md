
# Fix: Align "Done" Tags in Demolition Scope Modules

## Problem

The demolition scope contains two modules: **Demolition** and **Extra Items**. Each uses a different component for rendering:

- **Demolition** uses `DemolitionModuleSection` -- a custom component with an inline header layout
- **Extra Items** uses the standard `ModuleSection` -- with fixed-width columns for alignment

The `DemolitionModuleSection` header uses a free-flowing inline layout for the "Done" badge and subtotal, while `ModuleSection` uses fixed-width containers (`w-16` for the badge, `w-24` for the subtotal). This mismatch causes the Done tags and dollar amounts to appear at different horizontal positions.

Additionally, the Done badge styling differs -- Demolition uses a custom green pill (`rounded-full`), while the standard component uses the shared `AccordionDoneBadge` with an outlined style.

## Solution

Update the `DemolitionModuleSection` header layout to match the standard `ModuleSection` pattern exactly.

## Changes

**File: `src/components/estimates/calculators/ModularCalculator.tsx`**

Update the header `div` inside `DemolitionModuleSection` (around lines 1707-1723) to use the same columnar layout as `ModuleSection`:

| Current (Demolition) | Updated (Matching Standard) |
|---|---|
| Inline badge with `ml-auto` flow | Fixed `w-16` container for badge |
| Custom green pill styling | Shared `AccordionDoneBadge` component |
| Subtotal with `ml-auto mr-4` | Fixed `w-24` container for subtotal |
| No spacer div | `flex-1` spacer between name and right-side elements |

The updated header structure will be:

```text
[Module Name] --- spacer --- [Done badge (w-16)] [Subtotal (w-24)] [Chevron]
```

This matches the existing pattern in `ModuleSection` (lines 455-475), ensuring vertical alignment across all modules in any scope.

No other files need to change -- the `AccordionDoneBadge` component and `ModuleSection` are already correct.
