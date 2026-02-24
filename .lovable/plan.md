

## Add Unavailable Days and Directory Availability Visibility

### What this does
1. Subcontractors can mark specific dates as "unavailable" on their schedule page
2. Subcontractors can opt in/out of showing their availability status on the public directory card
3. The directory card shows a simple available/busy indicator only when the subcontractor has opted in -- no sensitive info exposed

### Database Changes

**New table: `subcontractor_unavailable_dates`**
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL) -- the subcontractor
- `date` (date, NOT NULL)
- `reason` (text, nullable) -- optional private note (never shown publicly)
- `created_at` (timestamptz)
- Unique constraint on `(user_id, date)`
- RLS: users can only manage their own rows

**New column on `subcontractor_directory_profiles`:**
- `show_availability_in_directory` (boolean, default false) -- opt-in toggle

### Frontend Changes

**1. Schedule page (`SubcontractorSchedule.tsx`)**
- Add ability to click on any day (week or month view) and toggle it as "unavailable"
- Unavailable days shown with a distinct visual (e.g. red/grey striped background, "Unavailable" label)
- Clicking an unavailable day opens a confirmation to remove the block
- New hook `useUnavailableDates` to fetch/insert/delete from the new table

**2. Settings page (`SubcontractorSettings.tsx`)**
- Add a toggle under the existing Availability section: "Show my availability on the directory"
- Description text: "When enabled, builders can see if you're available or busy. No schedule details are shared."

**3. Dashboard page (`SubcontractorDashboardPage.tsx`)**
- Auto-derive availability: if any unavailable date matches today, treat status as "busy". Otherwise "available". (Or keep manual toggle -- both work alongside each other.)

**4. Directory card (`DirectoryCard.tsx`)**
- Only show the green/grey availability dot if the profile has `show_availability_in_directory === true`
- No change to what info is displayed -- just the existing dot indicator, conditionally shown

**5. Directory RPC (`get_public_directory_profiles`)**
- Add `show_availability_in_directory` to the returned columns so the frontend knows whether to display the dot

### New Files
- `src/hooks/useUnavailableDates.ts` -- CRUD hook for the new table

### Privacy
- The `reason` field is never exposed publicly
- The directory only shows "available" or "busy" (the existing dot), and only when the subcontractor has explicitly opted in
- No schedule details, job names, or dates are visible to directory viewers
