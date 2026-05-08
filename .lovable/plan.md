## Goal

Bring back employee user accounts so businesses can manage staff, run timesheets (clock in/out + admin review), and process leave requests. The database tables (`profiles`, `timesheets`, `leave_requests`, `employee_tickets`, `pending_invites`, `crews`, `crew_members`) and most of the UI (`AdminEmployees`, `AdminCrews`, employee pages, timesheet components, leave components) are still in the codebase from a previous build — they're just commented out in `src/App.tsx`. This plan re-enables them, adds the missing onboarding plumbing, and wires everything into the admin dashboard.

## Scope (confirmed)

- Admin Employees page (list, invite, edit, deactivate, tickets/certifications)
- Timesheets — employee clock in/out + admin review table + CSV export
- Leave requests — employee submit, admin approve/decline
- Employee mobile dashboard (dashboard, schedule, contacts, profile, leave)
- Onboarding: **both** email invite *and* admin-creates-account-directly
- Access: gated as **Pro only** (matches Jobs/Schedule)

## What's already there vs what's new

**Already built — just needs re-enabling:**
- DB schema: `profiles`, `timesheets`, `leave_requests`, `employee_tickets`, `crews`, `crew_members`, `pending_invites` with RLS
- Pages: `AdminEmployees`, `AdminCrews`, `EmployeeDashboard`, `EmployeeSchedule`, `EmployeeContacts`, `EmployeeProfile`, `EmployeeLeave`
- Components: `InviteEmployeeDialog`, `EmployeeDetailsSheet`, `TicketFormDialog`, `ClockInButton`, `TimesheetTable`, `EditTimesheetDialog`, `TimesheetExport`, `LeaveRequestFormDialog`, `LeaveRequestsList`, `CrewFormDialog`, `CrewMembersDialog`
- Edge functions: `accept-invite`, `check-employee-limit`, `delete-employee`, `auto-clock-out`

**New / changed:**
1. New edge function `admin-create-employee` for the direct-create flow (admin enters name + email + temp password → creates `auth.users` + `profiles` + `staff` role using service role key, with employee-limit check).
2. New admin page section: **Timesheets** (`/admin/timesheets`) showing the existing `TimesheetTable` with date/employee filters and CSV export.
3. New admin page section: **Leave** (`/admin/leave`) listing `LeaveRequestsList` for approve/decline.
4. Update `InviteEmployeeDialog` to add a "Create directly" tab alongside the email invite tab.
5. Wire all new routes into `src/App.tsx` and add nav items to `AdminLayout` sidebar (Employees, Timesheets, Leave) under a "Team" section, all `requiresPro: true`.
6. Add a small "Today's clocked-in staff" widget to `AdminDashboard` for at-a-glance visibility.
7. Re-enable employee routes (`/employee`, `/employee/schedule`, `/employee/leave`, `/employee/contacts`, `/employee/profile`).
8. Update `Auth.tsx` redirect logic so users with `staff` role land on `/employee` (verify against `mem://auth/unified-login-redirection`).

## Information architecture

Admin sidebar (Pro-gated additions in **bold**):

```text
Dashboard
Jobs
Quotes
Schedule
Contact
— Team —
  Employees       (NEW link, page exists)
  Timesheets      (NEW link + page section)
  Leave           (NEW link + page section)
Settings
```

Employee bottom nav (mobile-first, existing layout):

```text
Dashboard | Schedule | Leave | Contacts | Profile
```

## Implementation steps

1. **DB / backend touch-ups** (single migration if anything is missing — most likely none, just verify):
   - Confirm `app_role` enum has `'staff'` value (it does — used by `has_role`).
   - Verify `pending_invites` table + accept-invite flow still resolves to `business_id` + assigns `staff` role.
   - Add a `is_active` boolean to `profiles` if we want soft-deactivate (otherwise rely on `delete-employee` edge function).

2. **Edge function — `admin-create-employee`**:
   - Input: `{ full_name, email, password, position?, phone?, hourly_rate? }`
   - Verifies caller is admin of a business, runs `check-employee-limit`, calls `supabase.auth.admin.createUser({ email, password, email_confirm: true })`, inserts `profiles` row with `business_id`, inserts `user_roles` row with `staff`.

3. **Re-enable routes in `src/App.tsx`**:
   - Uncomment `/admin/employees`, `/admin/crews` (optional), `/admin/equipment` (optional — leave commented unless you want it).
   - Add `/admin/timesheets`, `/admin/leave`.
   - Uncomment all `/employee/*` routes.

4. **New admin pages**:
   - `src/pages/admin/AdminTimesheets.tsx` — wraps `TimesheetTable` + filter bar + `TimesheetExport`.
   - `src/pages/admin/AdminLeave.tsx` — wraps `LeaveRequestsList` with admin actions.

5. **`AdminLayout` nav update** — add Employees / Timesheets / Leave items with `requiresPro: true` and appropriate icons (Users, Clock, CalendarOff).

6. **`InviteEmployeeDialog` — add "Create directly" tab** — calls the new edge function; on success closes dialog, refetches employees, toasts temp password for admin to share.

7. **Auth redirect** — in `Auth.tsx` after login, if user has `staff` role and no `admin` role, redirect to `/employee`.

8. **Dashboard widget** — `ClockedInTodayWidget` reading `timesheets` where `status='active'` for the business; placed below `DailyScheduleWidget`.

## Notes / risks

- `auto-clock-out` edge function exists — verify cron is still scheduled (check `supabase/config.toml` cron section); add it back if missing.
- `delete-employee` already handles cascading; reuse it.
- Mobile layout already in place via `AdminBottomNav` for admin and equivalent for employees; no new responsive work needed.
- Tier gating: keep `requiresPro: true` on all three new nav items; `FullAppAccessGate` already handles the upgrade prompt.
- All RLS policies are already in place and correct — no policy changes required.

## Out of scope (flag for later)

- Crews UI re-enable (kept commented; can re-enable in a follow-up if needed).
- Equipment UI re-enable.
- Payroll export integrations (Xero is purged per memory).
- Geofencing enforcement on clock-in (lat/lng columns exist but no enforcement logic).
