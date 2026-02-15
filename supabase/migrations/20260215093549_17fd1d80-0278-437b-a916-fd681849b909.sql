DROP FUNCTION IF EXISTS public.get_all_users_for_staff();

CREATE OR REPLACE FUNCTION public.get_all_users_for_staff()
 RETURNS TABLE(id uuid, full_name text, email text, last_sign_in_at timestamp with time zone, created_at timestamp with time zone, business_id uuid, business_name text, subscription_exempt boolean, subscription_status text, role text, estimates_created bigint, estimates_sent bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: pourhub_staff role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    au.email::text,
    au.last_sign_in_at,
    p.created_at,
    p.business_id,
    b.name as business_name,
    COALESCE(b.subscription_exempt, false) as subscription_exempt,
    bs.status as subscription_status,
    ur.role::text,
    COALESCE(est.total_created, 0) as estimates_created,
    COALESCE(est.total_sent, 0) as estimates_sent
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.businesses b ON p.business_id = b.id
  LEFT JOIN public.business_subscriptions bs ON b.id = bs.business_id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN (
    SELECT e.business_id, COUNT(*) as total_created,
      COUNT(*) FILTER (WHERE e.status IN ('sent','accepted')) as total_sent
    FROM public.estimates e GROUP BY e.business_id
  ) est ON b.id = est.business_id
  ORDER BY au.last_sign_in_at DESC NULLS LAST;
END;
$function$