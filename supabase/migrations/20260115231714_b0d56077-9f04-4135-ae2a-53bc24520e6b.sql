-- Update get_subscription_stats to include demo accounts and fix tier counting
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
    'demo_accounts', (SELECT COUNT(*) FROM public.businesses WHERE subscription_exempt = true),
    'paid_100_plan', (SELECT COUNT(*) FROM public.business_subscriptions WHERE status = 'active'),
    'trial_100_plan', (SELECT COUNT(*) FROM public.business_subscriptions WHERE status = 'trialing'),
    'waiting_list_count', (SELECT COUNT(*) FROM public.waiting_list),
    'recent_signups_7d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '7 days'),
    'recent_signups_30d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '30 days')
  ) INTO result;
  
  RETURN result;
END;
$$;