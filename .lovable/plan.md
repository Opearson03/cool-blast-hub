
## Fix: Two Broken Database Functions

### Problem 1 — Waitlist Table (Critical)
The migration added `phone` to the `get_waiting_list_entries` function's SELECT clause, but **never ran `ALTER TABLE public.waiting_list ADD COLUMN phone text NULL`**. The column simply doesn't exist in the table, causing every call to the RPC to fail with error code `42703`.

### Problem 2 — Signup Trends Chart
The `get_signup_trends` function has a SQL error: `column "b.created_at" must appear in the GROUP BY clause`. The query uses `generate_series` with a LEFT JOIN on businesses, then groups by `d.date` — but the join produces `b.created_at` in the output which isn't aggregated. This needs the GROUP BY to use `d.date` correctly.

### Fix: One Migration

**New migration file** containing:

1. Add the missing `phone` column:
```sql
ALTER TABLE public.waiting_list ADD COLUMN IF NOT EXISTS phone text NULL;
```

2. Fix `get_signup_trends` — the current function body uses `DATE(b.created_at)` in the GROUP BY check incorrectly. The fix is to ensure the join correctly aggregates:
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
    CURRENT_DATE - (days_back || ' days')::interval,
    CURRENT_DATE,
    '1 day'::interval
  ) AS d(date)
  LEFT JOIN public.businesses b ON DATE(b.created_at) = d.date::date
  LEFT JOIN public.profiles p ON DATE(p.created_at) = d.date::date
  GROUP BY d.date
  ORDER BY d.date;
END;
$$;
```

3. Reload the PostgREST schema cache so the new column is immediately visible:
```sql
NOTIFY pgrst, 'reload schema';
```

### No code changes needed
The TypeScript types, the RPC function signature, and `WaitlistTable.tsx` are all already correct. The only thing missing is the actual database column.
