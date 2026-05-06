## Bring the logged-in app up to the landing page standard

The marketing landing page now uses a disciplined system: Space Grotesk display + Inter body, eyebrow labels, an 8-pt vertical rhythm, restrained effects, and clean asymmetric layouts. Once a user signs in, they drop into a much busier, less considered surface — generic shadcn cards everywhere, inconsistent heading sizes, default Inter weights only, dense gradients/blur on widgets, and chunky "Upgrade to Pro" boxes that fight the nav. This plan extends the landing-page language into the entire authenticated experience without changing any business logic.

### Design principles to carry over

- **One type system everywhere** — Display font for page titles and stat numbers, body font for everything else. Stop mixing `text-2xl font-bold` headings with un-styled card titles.
- **Eyebrow + title pattern** — Every page and major section gets a small uppercase tracked eyebrow above its title (`Dashboard · Today`, `Quotes · Drafts`), matching the landing.
- **Quiet cards** — Default card chrome becomes flatter: hairline border, no shadow, subtle hover lift only when interactive. Reserve gradient/glass for hero-equivalent surfaces (KPI row, empty states).
- **Consistent rhythm** — Page padding standardised (`px-6 py-8` desktop, `px-4 py-6` mobile), section gaps `space-y-8`, card internal padding `p-5`.
- **Restraint with colour** — Orange is reserved for primary actions, active nav, and one accent per screen. Status uses muted tokens (`text-muted-foreground`, `text-warning`, `text-destructive`) — no rainbow icon row.
- **Dark-first polish** — Tighten the dark palette: card surface lifted one step from background, borders at ~14% white, focus ring stays orange.

### What changes, screen by screen

```text
┌─ Sidebar (AdminLayout) ────────────────────────────────┐
│  Logo + wordmark in display font                        │
│  Nav items: smaller icon, body font, active = orange    │
│             left-bar + tinted bg (no full pill)         │
│  Tier badge moves under wordmark, not beside theme tog. │
│  Upgrade card: flat, single line + button, no gradient  │
└─────────────────────────────────────────────────────────┘

┌─ Page header (shared) ─────────────────────────────────┐
│  EYEBROW · CONTEXT                                      │
│  Page Title (display, 3xl)        [primary action btn]  │
│  one-line description (muted)                           │
└─────────────────────────────────────────────────────────┘

┌─ Dashboard ────────────────────────────────────────────┐
│  KPI row: 3 stat tiles, large display numbers,          │
│           eyebrow label, tiny delta/icon — no card      │
│           shadows, hairline divider between tiles        │
│  Today's Schedule — flat list, time column left,        │
│                     status chip right                   │
│  Pending Subbie Invites — same list pattern             │
│  Tomorrow Preview + Inbox — two-column on desktop       │
└─────────────────────────────────────────────────────────┘

┌─ Jobs / Quotes / Schedule / Contacts ──────────────────┐
│  Shared toolbar: search left, filters middle,           │
│                  primary "New …" button right           │
│  Tables: zebra removed, row hover = subtle bg,          │
│          column headers in eyebrow style                │
│  Empty states: display headline + one CTA, no card      │
└─────────────────────────────────────────────────────────┘

┌─ Settings ─────────────────────────────────────────────┐
│  Group headings already use eyebrow style — extend      │
│  to all settings panes; accordion gets thinner border   │
└─────────────────────────────────────────────────────────┘
```

### Files touched

**Foundation**
- `src/index.css` — extend tokens for `--surface-1 / --surface-2`, refine dark borders, add `.eyebrow`, `.page-title`, `.stat-number` utilities. Apply the `font-display` / `font-sans` families to the authenticated app (currently scoped only to the landing).
- `tailwind.config.ts` — already has `display`; add a `stat` size token and a softer `shadow-card`.
- `index.html` — already loads Space Grotesk + Inter, no change.

**Shared layout + primitives**
- `src/components/layout/AdminLayout.tsx` — restyle sidebar, nav items, tier badge placement, upgrade card; tighten mobile header.
- `src/components/layout/AdminBottomNav.tsx` — match active-state treatment to the new sidebar.
- New `src/components/layout/PageHeader.tsx` — reusable eyebrow + title + actions block, used by every admin page.
- `src/components/ui/card.tsx` — soften default border/shadow (variant-safe; no breaking API change).

**Dashboard**
- `src/pages/admin/AdminDashboard.tsx` — adopt `PageHeader`, restructure KPI row, two-column lower grid.
- `src/components/dashboard/SummaryCards.tsx` — convert from 3 boxed cards to a single hairline-divided stat row with display-font numbers.
- `src/components/dashboard/DailyScheduleWidget.tsx`, `PendingSubbieInvitesWidget.tsx`, `TomorrowPreviewWidget.tsx`, `InboxWidget.tsx` — use new `SectionCard` shell (eyebrow + title + content), drop redundant card chrome.

**Other authenticated pages (header + spacing pass only)**
- `src/pages/admin/AdminJobs.tsx`
- `src/pages/admin/AdminEstimates.tsx`
- `src/pages/admin/AdminSchedule.tsx`
- `src/pages/admin/AdminContacts.tsx`
- `src/pages/admin/AdminSettings.tsx`
- `src/pages/admin/WidgetSettings.tsx`
- `src/pages/admin/AdminJobDetail.tsx`

Each gets: `PageHeader` adoption, consistent `space-y-8` outer container, quieter card variant, eyebrowed sub-section titles. Tables, dialogs, and forms inside are **not** restructured.

### Out of scope

- Employee, Subcontractor, Supplier, and Staff portals — separate audit if you want them aligned.
- Quote builder / takeoff canvas internals — they have their own dense UI rules.
- Any data, routing, RLS, edge function, or business logic change.
- New illustrations or screenshots.

### Risk + verification

- Pure presentational changes; no hooks or data shapes touched.
- After implementation: visual QA at 1280, 1024, and 390 widths in dark and light mode on Dashboard, Jobs, Quotes, Schedule, Contacts, Settings.
