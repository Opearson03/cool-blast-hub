CREATE OR REPLACE FUNCTION public.get_waiting_list_entries()
 RETURNS TABLE(id uuid, email text, full_name text, business_name text, phone text, created_at timestamp with time zone, referral_count integer, outreach_status text, invited_at timestamp with time zone, checkout_url text, checkout_tier text, staff_notes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: pourhub_staff role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    w.id, 
    w.email, 
    w.full_name, 
    w.business_name, 
    w.phone, 
    w.created_at, 
    COALESCE(w.referral_count, 0)::integer,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM auth.users u
        JOIN public.profiles p ON p.id = u.id
        JOIN public.business_subscriptions bs ON bs.business_id = p.business_id
        WHERE LOWER(u.email) = LOWER(w.email)
          AND bs.status IN ('active', 'trialing')
      ) THEN 'converted'
      ELSE COALESCE(w.outreach_status, 'pending')
    END,
    w.invited_at,
    w.checkout_url,
    w.checkout_tier,
    w.staff_notes
  FROM public.waiting_list w
  ORDER BY 
    CASE 
      WHEN EXISTS (
        SELECT 1
        FROM auth.users u
        JOIN public.profiles p ON p.id = u.id
        JOIN public.business_subscriptions bs ON bs.business_id = p.business_id
        WHERE LOWER(u.email) = LOWER(w.email)
          AND bs.status IN ('active', 'trialing')
      ) THEN 3
      WHEN w.outreach_status = 'converted' THEN 3
      WHEN w.outreach_status = 'invited' THEN 2
      ELSE 1 
    END ASC,
    COALESCE(w.referral_count, 0) DESC,
    w.created_at ASC;
END;
$$;