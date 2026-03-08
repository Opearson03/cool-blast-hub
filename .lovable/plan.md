

## Booking System for PourHub

### Overview

Public `/bookings` page with calendar-based time slot selection, form capture, Zoom meeting auto-creation, and staff management in the staff dashboard.

### 1. Database

Create a `bookings` table:

```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  quotes_per_week TEXT,
  booking_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Australia/Sydney',
  status TEXT NOT NULL DEFAULT 'booked',
  zoom_link TEXT,
  zoom_meeting_id TEXT,
  staff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: public can insert (anonymous booking), staff can read/update
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read booking times" ON public.bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.is_pourhub_staff(auth.uid()));
CREATE POLICY "Staff can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.is_pourhub_staff(auth.uid()));
```

The SELECT policy is open so the public page can check which slots are taken (only `booking_time` and `status` are queried publicly).

### 2. Zoom Integration

**Secret required**: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` (Server-to-Server OAuth app from Zoom Marketplace).

**Edge function**: `create-zoom-meeting`
- Authenticates via Zoom Server-to-Server OAuth (account credentials grant)
- Creates a 30-min meeting for the booked time
- Returns the join URL and meeting ID
- Called from a `create-booking` edge function

**Edge function**: `create-booking`
- Receives booking details from the public form
- Validates no double-booking for the requested time slot
- Calls `create-zoom-meeting` internally
- Inserts the booking row with zoom_link
- Sends confirmation email via Resend (already configured)
- Returns confirmation to the client

### 3. Public Page — `/bookings`

New file: `src/pages/Bookings.tsx`

- PourHub-branded header with logo
- Description text as specified
- Two-column layout (desktop): calendar on left, time slots + form on right
- Mobile: stacked vertically
- Calendar component using the existing `Calendar` (react-day-picker)
- Only Mon-Fri selectable, past dates disabled
- Time slots: 9:00-17:00 AEST in 30-min blocks, greyed out if already booked
- Auto-detect user timezone, convert display times
- Form fields: Name, Email, Phone (optional), Company, Quotes per week (select)
- "Book Zoom Call" CTA button
- On success: confirmation screen with Zoom link, "Start Free Trial" button linking to `/signup`

### 4. Staff Dashboard — Bookings Tab

Add a "Bookings" tab to `StaffDashboard.tsx` with a `CalendarIcon`.

New component: `src/components/staff/BookingsTab.tsx`
- Two views: calendar view (mini calendar with dot indicators) and list view (table of upcoming bookings)
- Columns: Name, Email, Phone, Company, Quotes/week, Booking Time, Status
- Actions per row: Mark Complete, Cancel, Reschedule (date picker dialog)
- Filter by status (all/booked/completed/cancelled)
- Add realtime subscription for the `bookings` table

### 5. Routing

Add to `App.tsx`:
```tsx
<Route path="/bookings" element={<Bookings />} />
```

### 6. Zoom API Setup

Before implementation, I will need you to:
1. Create a **Server-to-Server OAuth app** in the [Zoom Marketplace](https://marketplace.zoom.us/)
2. Grant the `meeting:write:admin` scope
3. Provide the Account ID, Client ID, and Client Secret (I will prompt you securely)

### 7. File Summary

| File | Action |
|------|--------|
| `src/pages/Bookings.tsx` | Create — public booking page |
| `src/components/bookings/BookingCalendar.tsx` | Create — calendar + slot picker |
| `src/components/bookings/BookingForm.tsx` | Create — contact form |
| `src/components/bookings/BookingConfirmation.tsx` | Create — success screen |
| `src/components/staff/BookingsTab.tsx` | Create — staff management |
| `supabase/functions/create-booking/index.ts` | Create — booking + Zoom creation |
| `src/pages/staff/StaffDashboard.tsx` | Edit — add Bookings tab |
| `src/App.tsx` | Edit — add /bookings route |
| Database migration | Create `bookings` table + RLS |

### Future Extensibility

The `bookings` table includes `staff_notes` and `zoom_meeting_id` fields. The edge function architecture separates Zoom meeting creation, making it straightforward to later add multiple staff calendars (add `staff_user_id` column), different meeting types (add `meeting_type` column), Google Calendar sync (additional edge function), and automated reminders (scheduled edge function).

