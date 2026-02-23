

## Advanced Subcontractor Dashboard with Navigation

### Overview

Transform the current single-page subcontractor dashboard into a full multi-page portal with sidebar navigation (mirroring the AdminLayout pattern), adding work management, scheduling, and settings pages.

### New Routes

| Route | Page | Description |
|---|---|---|
| `/sub-contractors/dashboard` | Dashboard | Overview with profile completion, availability, upcoming work |
| `/sub-contractors/work` | My Work | Accept/decline incoming job invites |
| `/sub-contractors/schedule` | Schedule | Weekly calendar of accepted jobs |
| `/sub-contractors/settings` | Settings | Edit profile, trade details, uploads, account |

### Architecture

**New layout component: `SubcontractorLayout`**

Mirrors the existing `AdminLayout` pattern with:
- Desktop: fixed left sidebar (w-64) with logo, nav items, sign out
- Mobile: hamburger menu header + bottom tab navigation
- Nav items: Dashboard, My Work, Schedule, Settings
- No subscription gating (standalone portal)

**New bottom nav: `SubcontractorBottomNav`**

Mobile-only bottom tab bar (same pattern as `AdminBottomNav`) with 4 tabs.

### Pages

**1. Dashboard (refactored)**
- Profile completion card (existing)
- Business details card (existing)
- Availability toggle (existing)
- NEW: "Upcoming Work" summary card showing next 7 days of accepted jobs
- NEW: "Pending Invites" count badge linking to My Work page
- Wrapped in `SubcontractorLayout` instead of custom header

**2. My Work page (new)**
- Fetches `external_invites` where `recipient_email` or `recipient_phone` matches the subcontractor's profile
- Shows pending invites as cards with:
  - Job/pour name, date, time
  - Business name
  - Role requested
  - Accept / Decline buttons
- Calls the existing `respond-subtrade-invite` edge function to accept/decline
- Tabs: "Pending" | "Accepted" | "Declined" for filtering
- Links accepted invites to the subcontractor's profile via a new `subcontractor_user_id` column on `external_invites` (or matched by email/phone)

**3. Schedule page (new)**
- Weekly view showing accepted jobs (from `external_invites` where status = "accepted")
- Each day card shows pour name, time, site address
- Week navigation (prev/next)
- Similar pattern to `EmployeeSchedule.tsx`

**4. Settings page (new)**
- Accordion-based settings (same pattern as `AdminSettings` with `SettingsGroup`/`SettingsAccordionItem`)
- Sections:
  - Personal Details (first name, last name, phone, email)
  - Business Details (ABN display, legal name -- read-only verified fields)
  - Trade Profile (trade types multi-select, years experience, service radius, base postcode, bio)
  - Documents (upload/replace insurance certificate, profile photo)
  - Account (change password, sign out)

### Database Changes

**Add column to `external_invites`:**
- `subcontractor_user_id uuid` (nullable, references no FK to avoid schema coupling) -- allows matching invites to logged-in subcontractors

**Or simpler approach (no schema change):** Match invites by email/phone from the subcontractor's profile. This avoids any migration and works with the existing invite flow.

We will use the simpler email/phone matching approach -- no database migration needed.

### Files to Create

| File | Purpose |
|---|---|
| `src/components/layout/SubcontractorLayout.tsx` | Sidebar + header layout |
| `src/components/layout/SubcontractorBottomNav.tsx` | Mobile bottom nav |
| `src/pages/subcontractors/SubcontractorWork.tsx` | Accept/decline invites |
| `src/pages/subcontractors/SubcontractorSchedule.tsx` | Weekly schedule view |
| `src/pages/subcontractors/SubcontractorSettings.tsx` | Profile/account settings |

### Files to Modify

| File | Change |
|---|---|
| `src/pages/subcontractors/SubcontractorDashboardPage.tsx` | Wrap in `SubcontractorLayout`, add upcoming work + pending invites cards |
| `src/App.tsx` | Add 3 new routes: `/sub-contractors/work`, `/sub-contractors/schedule`, `/sub-contractors/settings` |

### Technical Details

**Work invite matching query:**
```sql
SELECT ei.*, jp.pour_name, jp.pour_date, jp.scheduled_time,
       j.name as job_name, j.site_address, b.name as business_name
FROM external_invites ei
JOIN job_pours jp ON ei.job_pour_id = jp.id
JOIN jobs j ON ei.job_id = j.id
JOIN businesses b ON ei.business_id = b.id
WHERE (ei.recipient_email = {subcontractor_email}
   OR ei.recipient_phone = {subcontractor_phone})
  AND ei.invite_type = 'sub_trade'
ORDER BY jp.pour_date ASC
```

**Accept/decline:** Calls the existing `respond-subtrade-invite` edge function with the invite token -- but since subcontractors may not have the token, we'll need a new RPC or edge function that allows authenticated subcontractors to respond by invite ID. This will be a small new edge function `subcontractor-respond-invite`.

**Nav items:**
- Dashboard (LayoutDashboard icon)
- My Work (Briefcase icon)
- Schedule (Calendar icon)
- Settings (Settings icon)

