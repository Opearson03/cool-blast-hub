-- Update get_subscription_stats to use date-based trial detection
-- Trial = subscription created less than 30 days ago
-- Paid = subscription created 30+ days ago

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
    'recent_signups_30d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '30 days')
  ) INTO result;
  
  RETURN result;
END;
$$;