## Remove Widget from sidebar nav

Remove the standalone "Widget" entry from the admin sidebar and mobile menu so the page is only reachable via Settings.

### Changes
- `src/components/layout/AdminLayout.tsx` — delete the `{ href: "/admin/widget", label: "Widget", icon: Globe, ... }` entry from `navItems`. Drop the now-unused `Globe` import.
- `src/components/layout/AdminBottomNav.tsx` — no change (Widget isn't in bottom nav).
- Route in `App.tsx` stays; access continues via Settings.

### Out of scope
- No changes to `WidgetSettings.tsx`, routing, or the Settings link to the widget page.