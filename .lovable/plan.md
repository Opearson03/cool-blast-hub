

## Add Availability Calendar to Directory Cards

### Overview
Show a small mini-calendar on each directory card (and profile page) for subcontractors who have opted in to sharing their availability. The calendar displays the current month with unavailable dates marked in red/grey -- no job names, reasons, or any other sensitive information is exposed. Just "available" vs "busy" per day.

### Database Changes

**New RPC: `get_public_unavailable_dates`**
- Accepts a subcontractor profile `_id` (uuid)
- Returns only the `date` column (no reason, no id) from `subcontractor_unavailable_dates`
- Only returns dates if the profile has `show_availability_in_directory = true`
- Filters to current + next month only (no historical data exposure)
- This is a SECURITY DEFINER function so it bypasses RLS safely and only returns the minimum data

### Frontend Changes

**New component: `src/components/directory/AvailabilityCalendar.tsx`**
- A compact read-only mini-calendar showing the current month
- Uses a simple CSS grid (7 columns, Mon-Sun headers)
- Unavailable dates shown with a red/muted background
- Available dates shown normally (or with a subtle green tint)
- Today highlighted
- No click interaction -- purely visual
- Small enough to fit within the card without overwhelming it

**Updated: `src/components/directory/DirectoryCard.tsx`**
- When `profile.show_availability_in_directory` is true, render the `AvailabilityCalendar` between the verification badges and the "View Profile" button
- Fetch unavailable dates using a new hook

**New hook: `src/hooks/usePublicUnavailableDates.ts`**
- Calls the new RPC `get_public_unavailable_dates` with the profile ID
- Returns an array of date strings
- Only enabled when `show_availability_in_directory` is true
- Cached with 5-minute stale time

### Privacy
- Only date values are returned -- no reasons, no job names, no times
- Only shown for subcontractors who have explicitly opted in
- RPC only returns current/future dates
- The calendar simply shows "busy" or "available" per day with colour coding

### Technical Notes
- Using a custom mini-calendar (not the full shadcn Calendar) to keep the card compact
- The RPC joins `subcontractor_unavailable_dates` with `subcontractor_directory_profiles` to verify opt-in status server-side
- No changes to existing RLS policies needed -- the new RPC handles access control
