
-- Update the has_worked_with_subcontractor function to require:
-- 1. An accepted invite exists linking the business to the subcontractor
-- 2. The associated pour has a date in the past
-- 3. The pour status is 'completed'
CREATE OR REPLACE FUNCTION public.has_worked_with_subcontractor(
  _user_id uuid,
  _profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM external_invites ei
    JOIN subcontractor_directory_profiles sdp ON sdp.id = _profile_id
    JOIN job_pours jp ON jp.id = ei.job_pour_id
    WHERE ei.business_id = get_user_business_id(_user_id)
      AND ei.invite_type = 'sub_trade'
      AND ei.status = 'accepted'
      AND jp.status = 'completed'
      AND jp.pour_date IS NOT NULL
      AND jp.pour_date < CURRENT_DATE
      AND (
        (sdp.email IS NOT NULL AND LOWER(ei.recipient_email) = LOWER(sdp.email))
        OR
        (sdp.phone IS NOT NULL AND ei.recipient_phone = sdp.phone)
      )
  );
$$;
