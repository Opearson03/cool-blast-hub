
CREATE OR REPLACE FUNCTION public.join_waitlist(
  _email text,
  _full_name text DEFAULT NULL,
  _business_name text DEFAULT NULL,
  _referred_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row waiting_list;
BEGIN
  INSERT INTO public.waiting_list (email, full_name, business_name, referred_by)
  VALUES (_email, _full_name, _business_name, _referred_by)
  RETURNING * INTO _row;
  
  RETURN jsonb_build_object('id', _row.id, 'referral_code', _row.referral_code);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'already_exists');
END;
$$;
