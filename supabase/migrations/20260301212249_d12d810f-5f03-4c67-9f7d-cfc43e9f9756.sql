
CREATE OR REPLACE FUNCTION public.get_subscription_stats()
RETURNS json
LANGUAGE plpgsql
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
    'active_subscriptions', (SELECT COUNT(*) FROM public.business_subscriptions WHERE status = 'active'),
    'trial_subscriptions', (SELECT COUNT(*) FROM public.business_subscriptions WHERE status = 'trialing'),
    'demo_accounts', (SELECT COUNT(*) FROM public.businesses WHERE subscription_exempt = true),
    'estimating_paid', (SELECT COUNT(*) FROM public.business_subscriptions WHERE plan_tier = 'estimating' AND status = 'active'),
    'estimating_trial', (SELECT COUNT(*) FROM public.business_subscriptions WHERE plan_tier = 'estimating' AND status = 'trialing'),
    'pro_paid', (SELECT COUNT(*) FROM public.business_subscriptions WHERE plan_tier = 'pro' AND status = 'active'),
    'pro_trial', (SELECT COUNT(*) FROM public.business_subscriptions WHERE plan_tier = 'pro' AND status = 'trialing'),
    'legacy_paid', (SELECT COUNT(*) FROM public.business_subscriptions WHERE plan_tier = 'standard' AND status IN ('active', 'trialing')),
    'waiting_list_count', (SELECT COUNT(*) FROM public.waiting_list),
    'recent_signups_7d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '7 days'),
    'recent_signups_30d', (SELECT COUNT(*) FROM public.businesses WHERE created_at > NOW() - INTERVAL '30 days'),
    'active_today', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '24 hours')
  ) INTO result;
  
  RETURN result;
END;
$$;
