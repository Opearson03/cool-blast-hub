

## Fix Signup Trends to Use Sydney Timezone

The `get_signup_trends` database function currently uses UTC for date grouping. Since the business operates in Sydney (AEDT, UTC+11), signups made after 11am UTC appear on the previous day in the chart.

### Root Cause
The SQL function uses `CURRENT_DATE` (UTC) and `DATE(b.created_at)` (also UTC) to group signups by day. Three signups today (March 2nd Sydney time) are stored as March 1st UTC, so the chart shows them on the wrong day.

### Fix
Update the `get_signup_trends` database function to convert timestamps to `Australia/Sydney` timezone before grouping:

- Change `CURRENT_DATE` to `(NOW() AT TIME ZONE 'Australia/Sydney')::date`
- Change `DATE(b.created_at)` to `(b.created_at AT TIME ZONE 'Australia/Sydney')::date`
- Same for profiles: `(p.created_at AT TIME ZONE 'Australia/Sydney')::date`

### Technical Detail (single DB migration)

```sql
CREATE OR REPLACE FUNCTION public.get_signup_trends(days_back integer DEFAULT 30)
  RETURNS TABLE(signup_date date, business_count bigint, user_count bigint)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    d.date::date AS signup_date,
    COUNT(DISTINCT b.id) AS business_count,
    COUNT(DISTINCT p.id) AS user_count
  FROM generate_series(
    (NOW() AT TIME ZONE 'Australia/Sydney')::date - (days_back || ' days')::interval,
    (NOW() AT TIME ZONE 'Australia/Sydney')::date,
    '1 day'::interval
  ) AS d(date)
  LEFT JOIN public.businesses b
    ON (b.created_at AT TIME ZONE 'Australia/Sydney')::date = d.date::date
  LEFT JOIN public.profiles p
    ON (p.created_at AT TIME ZONE 'Australia/Sydney')::date = d.date::date
  GROUP BY d.date
  ORDER BY d.date;
END;
$$;
```

No frontend changes needed -- the chart component already works with whatever the function returns.

