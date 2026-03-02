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