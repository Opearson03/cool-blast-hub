
DROP FUNCTION IF EXISTS public.get_waiting_list_entries();

CREATE OR REPLACE FUNCTION public.get_waiting_list_entries()
 RETURNS TABLE(id uuid, email text, full_name text, business_name text, created_at timestamp with time zone, referral_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if caller is pourhub staff
  IF NOT is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: pourhub_staff role required';
  END IF;
  
  RETURN QUERY
  SELECT w.id, w.email, w.full_name, w.business_name, w.created_at, COALESCE(w.referral_count, 0)::integer
  FROM public.waiting_list w
  ORDER BY w.created_at DESC;
END;
$function$
