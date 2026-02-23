

## Optimise Staff Dashboard for Mobile

### Problems Identified

1. **Tab bar overflow** -- 6 tabs with icons and full text labels don't fit on small screens
2. **Data tables too wide** -- UsersTable (8 columns), WaitlistTable (8 columns), SubscribersTable (6 columns), CrmContactsTable (7 columns), and SupplierRegistrationsTable (7 columns) all overflow horizontally
3. **Toolbar buttons wrapping** -- filter and action buttons in table headers stack awkwardly
4. **Card headers** -- title + export button layout can collide on narrow screens

### Solution

Make the dashboard responsive without changing the desktop experience. On mobile, tables switch to a stacked card layout and the tab bar becomes scrollable with abbreviated labels.

### Changes by File

| File | What Changes |
|---|---|
| `StaffDashboard.tsx` | Make `TabsList` horizontally scrollable on mobile; hide tab icons below `sm` breakpoint; reduce main padding on mobile |
| `UsersTable.tsx` | Wrap table in `overflow-x-auto`; on mobile, hide less critical columns (Business, Quotes Created, Quotes Sent, Joined) using `hidden sm:table-cell` classes |
| `WaitlistTable.tsx` | Hide Business Name, Phone, Referrals, and Joined columns on mobile; make filter buttons wrap cleanly; stack card header vertically on small screens |
| `SubscribersTable.tsx` | Hide Email, Subscription End columns on mobile; stack card header |
| `CrmContactsTable.tsx` | Hide Company, Phone, Source columns on mobile; toolbar already uses `flex-col sm:flex-row` (good) |
| `SupplierRegistrationsTable.tsx` | Hide Categories, Service Areas, Submitted columns on mobile |
| `CrmTab.tsx` | Make sub-tab list scrollable on mobile; abbreviate labels below `sm` |

### Detailed Approach

**Tab bar (StaffDashboard.tsx)**
- Add `overflow-x-auto` and `w-full` to `TabsList`
- Hide icon text on very small screens: icons only below 640px, icons + text above
- Use `flex-nowrap` to prevent wrapping

**Table responsive pattern (applied to all 5 table components)**
- Keep the existing `<Table>` structure (no card layout rewrite -- simpler, less risk)
- Use Tailwind `hidden md:table-cell` on non-essential columns to progressively show more data on wider screens
- Essential columns that always show:
  - **Users**: Name/Email, Role, Status, Last Login
  - **Waitlist**: Email, Status, Actions
  - **Subscribers**: Business, Status, Actions
  - **CRM Contacts**: Checkbox, Type, Name, Email
  - **Suppliers**: Company, Contact, Status, Actions

**Card headers**
- Change `flex-row` to `flex-col sm:flex-row` on `CardHeader` where title and export button collide

### What Stays the Same

- Desktop layout is untouched -- `hidden md:table-cell` only hides columns below the `md` breakpoint
- No data or functionality is removed -- hidden columns are still in CSV exports
- No component architecture changes -- same files, same structure
- KPI stats cards already use `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (already responsive)

