-- Function to get all users with their last login time for staff portal
CREATE OR REPLACE FUNCTION public.get_all_users_for_staff()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  business_id uuid,
  business_name text,
  subscription_exempt boolean,
  subscription_status text,
  role text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is pourhub staff
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
    ur.role::text
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.businesses b ON p.business_id = b.id
  LEFT JOIN public.business_subscriptions bs ON b.id = bs.business_id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  ORDER BY au.last_sign_in_at DESC NULLS LAST;
END;
$$;

-- Update get_subscription_stats to include active_today count
CREATE OR REPLACE FUNCTION public.get_subscription_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: pourhub_staff role required';
  END IF;
  
  SELECT json_build_object(
    'total_businesses', (SELECT COUNT(*) FROM public.businesses),
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'active_subscriptions', (SELECT COUNT(*) FROM public.business_subscriptions WHERE created_at <= NOW() - INTERVAL '30 days'),
    'trial_subscriptions', (SELECT COUNT(*) FROM public.business_subscriptions WHERE created_at > NOW() - INTERVAL '30 days'),
    'demo_accounts', (SELECT COUNT(*) FROM public.businesses WHERE subscription_exempt = true),
    'paid_100_plan', (SELECT COUNT(*) FROM public.business_subscriptions WHERE created_at <= NOW() - INTERVAL '30 days'),
    'trial_100_plan', (SELECT COUNT(*) FROM public.business_subscriptions WHERE created_at > NOW() - INTERVAL '30 days'),
    'waiting_list_count', (SELECT COUNT(*) FROM public.waiting_list),
    'recent_signups_7d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '7 days'),
    'recent_signups_30d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '30 days'),
    'active_today', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '24 hours')
  ) INTO result;
  
  RETURN result;
END;
$$;