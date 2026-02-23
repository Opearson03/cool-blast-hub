
-- Function to check if a user's business has worked with a subcontractor (accepted invite)
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
    WHERE ei.business_id = get_user_business_id(_user_id)
      AND ei.invite_type = 'sub_trade'
      AND ei.status = 'accepted'
      AND (
        (sdp.email IS NOT NULL AND LOWER(ei.recipient_email) = LOWER(sdp.email))
        OR
        (sdp.phone IS NOT NULL AND ei.recipient_phone = sdp.phone)
      )
  );
$$;

-- Update INSERT policy on subcontractor_reviews to require working relationship
DROP POLICY IF EXISTS "Admin/staff can insert reviews" ON public.subcontractor_reviews;

CREATE POLICY "Admin/staff can insert reviews after working together"
ON public.subcontractor_reviews FOR INSERT TO authenticated
WITH CHECK (
  reviewer_user_id = auth.uid()
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
  AND has_worked_with_subcontractor(auth.uid(), subcontractor_profile_id)
);
