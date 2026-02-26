
CREATE OR REPLACE FUNCTION public.get_total_quoted_value()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM public.estimates
  WHERE status IN ('sent', 'accepted')
     OR signed_at IS NOT NULL;
$$;
