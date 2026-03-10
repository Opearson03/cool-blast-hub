

## Root Cause: Hardcoded AEST Offset During Daylight Saving Time

The bug is in `src/pages/Bookings.tsx` line 63. The timezone offset is hardcoded as `+10:00` (AEST), but Sydney is currently in **AEDT (Australian Eastern Daylight Time)** which is `+11:00`.

**What happens:**
1. User selects 4:00 PM on the calendar
2. Code builds: `2026-03-14T16:00:00+10:00` (wrong — assumes AEST)
3. This converts to UTC `06:00:00Z`
4. Zoom receives this with `timezone: "Australia/Sydney"` and correctly interprets/displays it as 4:00 PM AEDT
5. Staff portal reads the UTC value `06:00Z` and converts to Sydney time (AEDT +11) = **5:00 PM** — off by one hour

The core issue: `const aestOffset = "+10:00"` doesn't account for daylight saving. Sydney switches between +10:00 (AEST, Apr–Oct) and +11:00 (AEDT, Oct–Apr).

## Fix

**File: `src/pages/Bookings.tsx`** — Replace the hardcoded offset with a proper timezone-aware conversion. Instead of manually constructing an ISO string with a fixed offset, use the `Intl.DateTimeFormat` API to determine the actual current Sydney UTC offset, or construct the date string without an offset and let the backend handle timezone context.

The cleanest approach: use JavaScript's timezone-aware formatting to get the real offset for `Australia/Sydney` on the selected date, accounting for DST automatically.

**File: `supabase/functions/create-booking/index.ts`** — No changes needed; the Zoom side already handles timezone correctly via the `timezone: "Australia/Sydney"` setting.

**File: `src/components/bookings/BookingCalendar.tsx`** — The `isSlotBooked` and `isSlotPast` comparisons may also be slightly off during DST but are lower priority since they compare local-to-local.

This is a single-file fix in `Bookings.tsx` replacing ~8 lines of manual offset construction with a DST-aware approach.

