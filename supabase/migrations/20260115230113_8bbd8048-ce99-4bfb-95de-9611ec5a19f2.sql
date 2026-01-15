-- Create function to check if user is pourhub staff
CREATE OR REPLACE FUNCTION public.is_pourhub_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'pourhub_staff'
  )
$$;

-- Create function to get platform-wide subscription stats (only for staff)
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
  -- Check if caller is pourhub staff
  IF NOT is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: pourhub_staff role required';
  END IF;
  
  SELECT json_build_object(
    'total_businesses', (SELECT COUNT(*) FROM public.businesses),
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'active_subscriptions', (SELECT COUNT(*) FROM public.business_subscriptions WHERE status = 'active'),
    'trial_subscriptions', (SELECT COUNT(*) FROM public.business_subscriptions WHERE status = 'trialing'),
    'starter_count', (SELECT COUNT(*) FROM public.business_subscriptions WHERE plan_tier = 'starter' AND status = 'active'),
    'professional_count', (SELECT COUNT(*) FROM public.business_subscriptions WHERE plan_tier = 'professional' AND status = 'active'),
    'enterprise_count', (SELECT COUNT(*) FROM public.business_subscriptions WHERE plan_tier = 'enterprise' AND status = 'active'),
    'waiting_list_count', (SELECT COUNT(*) FROM public.waiting_list),
    'recent_signups_7d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '7 days'),
    'recent_signups_30d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '30 days')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create function to get waiting list entries (only for staff)
CREATE OR REPLACE FUNCTION public.get_waiting_list_entries()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  business_name text,
  created_at timestamptz
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
  SELECT w.id, w.email, w.full_name, w.business_name, w.created_at
  FROM public.waiting_list w
  ORDER BY w.created_at DESC;
END;
$$;

-- Create function to get signup trends (only for staff)
CREATE OR REPLACE FUNCTION public.get_signup_trends(days_back integer DEFAULT 30)
RETURNS TABLE(
  signup_date date,
  business_count bigint,
  user_count bigint
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
    DATE(b.created_at) as signup_date,
    COUNT(DISTINCT b.id) as business_count,
    COUNT(DISTINCT p.id) as user_count
  FROM generate_series(
    CURRENT_DATE - (days_back || ' days')::interval,
    CURRENT_DATE,
    '1 day'::interval
  ) AS d(date)
  LEFT JOIN public.businesses b ON DATE(b.created_at) = d.date
  LEFT JOIN public.profiles p ON DATE(p.created_at) = d.date
  GROUP BY d.date
  ORDER BY d.date;
END;
$$;