
-- 1. Add the missing phone column to waiting_list
ALTER TABLE public.waiting_list ADD COLUMN IF NOT EXISTS phone text NULL;

-- 2. Fix get_signup_trends GROUP BY error
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

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
