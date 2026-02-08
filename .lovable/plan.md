

# iPad and iPhone Optimization Audit

## Current State

The app already has solid mobile foundations:
- Safe area insets for notch/home-bar handling on native
- Touch-friendly target sizes (`touch-target`, `min-h-[44px]`)
- Mobile header with hamburger menu
- `useIsMobile`, `useIsTablet`, and `usePlatform` hooks
- Capacitor integration for native builds
- Pinch-to-zoom and touch gestures in the takeoff viewer

However, there are specific gaps that affect the iPad and iPhone experience. Here's what needs to change, grouped by impact:

---

## 1. iPad Layout: Sidebar/Header Breakpoint Gap

**Problem:** The layout switches from "mobile hamburger menu" to "desktop sidebar" at `lg` (1024px). iPad in portrait mode is 768-834px wide (gets the hamburger menu), but iPad in landscape is 1024-1194px (gets the desktop sidebar). This means:
- iPad portrait: Mobile header + hamburger menu, but no bottom tab bar (only the Employee layout has one)
- iPad landscape: Desktop sidebar works, but the 264px sidebar takes a lot of horizontal space

**Fix:** Add a bottom tab bar to `AdminLayout` for tablet/mobile users, matching the pattern already used in `EmployeeLayout`. This gives iPad portrait users persistent navigation instead of requiring the hamburger menu for every page switch.

---

## 2. AdminLayout Missing Bottom Tab Bar (Mobile/iPad)

**Problem:** The `EmployeeLayout` has a fixed bottom tab bar for quick navigation on mobile, but the `AdminLayout` does not -- it only has the hamburger menu. On iPhone and iPad (portrait), this means users must open the hamburger menu every time they want to switch pages.

**Fix:** Add a bottom navigation bar to `AdminLayout` (like `EmployeeLayout` line 123-143), showing the core nav items (Dashboard, Jobs, Quotes, Schedule, Contacts). Include safe-area-inset-bottom padding for iPhones with the home indicator bar.

---

## 3. MobileCostSummaryBar Overlapping Bottom Nav

**Problem:** The `MobileCostSummaryBar` uses `fixed bottom-0` positioning. If a bottom tab bar is added to AdminLayout, the cost summary bar will overlap the navigation tabs. Even without that, on iPhone the `pb-[calc(0.75rem+env(safe-area-inset-bottom))]` may not account for enough space.

**Fix:** Increase the bottom padding of the MobileCostSummaryBar when a bottom nav is present, or use a higher z-index and ensure proper stacking. Since the cost summary only shows inside the estimate wizard dialog (which is full-screen), this primarily matters if the dialog doesn't fully cover the bottom nav.

---

## 4. Estimate Wizard Dialog: iPad Optimization

**Problem:** The `EstimateFormDialog` uses `max-w-4xl` (max-width: 56rem = 896px) and `max-h-[95vh]`. On iPad, this creates a centered dialog that doesn't fully use the available screen space, especially in landscape mode. The 95vh height is good, but the dialog still floats in the center with dark overlay, losing usable space.

**Fix:** On iPad-sized screens, make the estimate wizard dialog nearly full-screen (`max-w-[98vw]` or `w-full`) since it's the primary workspace. The takeoff step already does this (`max-w-[95vw] w-full`), but other steps don't.

---

## 5. Schedule Calendar: Month View Too Cramped on iPad

**Problem:** The month view calendar uses a `grid grid-cols-7 gap-1` grid. On iPad portrait (~768px minus padding), each cell is only about 90px wide. The pour cards and estimate events inside each cell can overflow or appear truncated.

**Fix:** Use slightly larger cell padding and font sizes on iPad. The week view (list layout) works well on all devices since it's a single-column list.

---

## 6. Contacts Tab Labels Truncated on iPad

**Problem:** The contacts page uses `grid w-full grid-cols-5` for tab triggers (Inbox, Clients, Sub-Contractors, Suppliers, Internal). On smaller iPads or iPhones, "Sub-Contractors" gets truncated. The icons are hidden below `sm`.

**Fix:** On mobile, abbreviate the tab labels (e.g., "Subbies" instead of "Sub-Contractors") or make the tab list horizontally scrollable instead of a fixed 5-column grid.

---

## 7. VolumeBreakdown Text Size on iPhone

**Problem:** The recently added `VolumeBreakdown` component uses `text-[10px]` for notes and `text-xs` (12px) for dimensions. On iPhone screens this is very small and hard to read, especially for tradies on-site.

**Fix:** Increase the minimum font size to `text-xs` (12px) for all text in the breakdown, and use `text-sm` (14px) for the main labels. The `italic text-[10px]` notes should become `text-xs`.

---

## 8. Safe Area Handling Consistency

**Problem:** Some components handle safe area insets and some don't:
- `AdminLayout` header: Handles `safe-area-inset-top` for native
- `EmployeeLayout` bottom nav: Handles `safe-area-inset-bottom`
- `MobileCostSummaryBar`: Handles `safe-area-inset-bottom` via padding
- But: `AdminLayout` main content doesn't handle `safe-area-inset-bottom` for iPhone home bar

**Fix:** Add consistent bottom safe area padding to the `AdminLayout` main content area so content isn't hidden behind the iPhone home indicator. Use `pb-[env(safe-area-inset-bottom)]` or the existing `.safe-area-inset` utility class.

---

## 9. Takeoff Toolbar Wrapping on iPad Portrait

**Problem:** The `TakeoffToolbar` uses `flex flex-col sm:flex-row` which collapses to a column below 640px. On iPad portrait (~768px), it renders horizontally but the buttons can wrap awkwardly when multiple tools, calibration, undo/delete, and zoom controls all compete for space.

**Fix:** Group the toolbar into collapsible sections on tablet, or use a more compact icon-only layout for the secondary controls (undo, delete, zoom) to prevent wrapping.

---

## 10. Estimate Cards: Action Menu Clipping

**Problem:** The dropdown menu on estimate cards (the three-dot menu) can clip off the edge of the screen on narrower devices, particularly when the last card in the list triggers a menu that opens downward near the bottom of the viewport.

**Fix:** Already partially addressed in the memory notes ("responsive card-based grid...prevent action menu clipping"), but verify the `DropdownMenuContent` uses `align="end"` and `side="bottom"` with `collisionPadding` to stay within bounds.

---

## Summary of Changes

| Area | File(s) | Change |
|------|---------|--------|
| Admin bottom tab bar | `AdminLayout.tsx` | Add bottom nav matching EmployeeLayout pattern |
| Safe area bottom padding | `AdminLayout.tsx` | Add `safe-area-inset-bottom` to main content |
| Estimate dialog sizing | `EstimateFormDialog.tsx` | Use wider max-width on iPad-sized screens |
| VolumeBreakdown readability | `VolumeBreakdown.tsx` | Increase minimum font sizes from 10px to 12px |
| Contacts tab labels | `AdminContacts.tsx` | Abbreviate long labels on small screens or make tabs scrollable |
| Schedule month view | `AdminSchedule.tsx` (DroppablePourDay) | Minor padding/font adjustments for iPad |
| Takeoff toolbar | `TakeoffToolbar.tsx` | Compact layout for tablet to prevent wrapping |
| Cost summary bar stacking | `MobileCostSummaryBar.tsx` | Adjust z-index/padding for bottom nav coexistence |

## Priority Order

1. **Admin bottom tab bar** -- highest impact, affects every page on iPhone/iPad
2. **Safe area bottom padding** -- prevents content being hidden on modern iPhones
3. **Estimate dialog sizing** -- most-used feature on iPad
4. **VolumeBreakdown readability** -- recently added, immediately visible issue
5. **Contacts tab labels** -- quick fix, visible truncation
6. **Remaining items** -- polish and edge cases

