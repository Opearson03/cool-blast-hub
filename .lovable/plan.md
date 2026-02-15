

## Add Quote Stats to Staff Users Table

### What changes
Add two new columns to the Users table in the staff dashboard: **Quotes Created** and **Quotes Sent**, showing totals per business (since quotes are created at the business level, not per individual user).

### Changes

**1. Database Migration** -- Update `get_all_users_for_staff()` to include two additional return columns:
- `estimates_created` (integer): Total estimates for that user's business
- `estimates_sent` (integer): Estimates with status = 'sent' or 'accepted' for that business

These are computed via LEFT JOIN subqueries on the `estimates` table grouped by `business_id`.

```sql
CREATE OR REPLACE FUNCTION public.get_all_users_for_staff()
RETURNS TABLE (
  -- existing columns ...
  estimates_created bigint,
  estimates_sent bigint
)
-- Add LEFT JOINs:
LEFT JOIN (
  SELECT business_id, COUNT(*) as total_created,
    COUNT(*) FILTER (WHERE status IN ('sent','accepted')) as total_sent
  FROM public.estimates GROUP BY business_id
) est ON b.id = est.business_id
-- And include in SELECT:
COALESCE(est.total_created, 0) as estimates_created,
COALESCE(est.total_sent, 0) as estimates_sent
```

**2. Update `src/components/staff/UsersTable.tsx`**
- Add `estimates_created` and `estimates_sent` to the `UserEntry` interface
- Add two new table columns: "Quotes Created" and "Quotes Sent"
- Include these fields in the CSV export
- Display counts with a muted dash for zero values

### Notes
- Counts are per business, so all users in the same business will show the same numbers. This is the correct behaviour since quotes belong to the business, not individual users.
- The existing `is_pourhub_staff` security check in the function remains unchanged.
