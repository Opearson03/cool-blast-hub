
-- Drop existing function to change return type
DROP FUNCTION IF EXISTS public.get_waiting_list_entries();

-- Recreate with new columns
CREATE OR REPLACE FUNCTION public.get_waiting_list_entries()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  business_name text,
  phone text,
  created_at timestamptz,
  referral_count integer,
  outreach_status text,
  invited_at timestamptz,
  checkout_url text,
  checkout_tier text,
  staff_notes text
)
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
    w.id, 
    w.email, 
    w.full_name, 
    w.business_name, 
    w.phone, 
    w.created_at, 
    COALESCE(w.referral_count, 0)::integer,
    COALESCE(w.outreach_status, 'pending'),
    w.invited_at,
    w.checkout_url,
    w.checkout_tier,
    w.staff_notes
  FROM public.waiting_list w
  ORDER BY 
    CASE w.outreach_status WHEN 'converted' THEN 3 WHEN 'invited' THEN 2 ELSE 1 END ASC,
    COALESCE(w.referral_count, 0) DESC,
    w.created_at ASC;
END;
$function$;

-- Helper function to update outreach status (used by edge functions with service role)
CREATE OR REPLACE FUNCTION public.update_waitlist_outreach(
  _id uuid,
  _outreach_status text,
  _invited_at timestamptz DEFAULT NULL,
  _checkout_url text DEFAULT NULL,
  _checkout_tier text DEFAULT NULL,
  _staff_notes text DEFAULT NULL,
  _stripe_session_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.waiting_list
  SET
    outreach_status = _outreach_status,
    invited_at = COALESCE(_invited_at, invited_at),
    checkout_url = COALESCE(_checkout_url, checkout_url),
    checkout_tier = COALESCE(_checkout_tier, checkout_tier),
    staff_notes = COALESCE(_staff_notes, staff_notes),
    stripe_session_id = COALESCE(_stripe_session_id, stripe_session_id)
  WHERE id = _id;
END;
$function$;
