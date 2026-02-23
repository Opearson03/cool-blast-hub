
-- Recreate subcontractor_reviews table (was dropped by failed migration rollback)
CREATE TABLE IF NOT EXISTS public.subcontractor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_profile_id uuid NOT NULL REFERENCES public.subcontractor_directory_profiles(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name text,
  reviewer_business_name text,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subcontractor_profile_id, reviewer_user_id)
);

ALTER TABLE public.subcontractor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reviews"
ON public.subcontractor_reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/staff can insert reviews"
ON public.subcontractor_reviews FOR INSERT TO authenticated
WITH CHECK (reviewer_user_id = auth.uid() AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')));

CREATE POLICY "Users can update their own reviews"
ON public.subcontractor_reviews FOR UPDATE TO authenticated
USING (reviewer_user_id = auth.uid()) WITH CHECK (reviewer_user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
ON public.subcontractor_reviews FOR DELETE TO authenticated
USING (reviewer_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_rating_trigger
BEFORE INSERT OR UPDATE ON public.subcontractor_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- Now drop and recreate RPCs with new return types
DROP FUNCTION IF EXISTS public.get_public_directory_profiles();
DROP FUNCTION IF EXISTS public.get_public_directory_profile(uuid);

CREATE FUNCTION public.get_public_directory_profiles()
RETURNS TABLE(
  id uuid, first_name text, last_name text, profile_photo_url text,
  trade_types text[], years_experience integer, service_radius_km integer,
  base_postcode text, bio text, availability_status text,
  abn_verified boolean, gst_registered boolean, has_white_card boolean,
  legal_name text, avg_rating numeric, review_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT sdp.id, sdp.first_name, sdp.last_name, sdp.profile_photo_url,
         sdp.trade_types, sdp.years_experience, sdp.service_radius_km,
         sdp.base_postcode, sdp.bio, sdp.availability_status,
         sdp.abn_verified, sdp.gst_registered, sdp.has_white_card, sdp.legal_name,
         COALESCE(r.avg_rating, 0) as avg_rating,
         COALESCE(r.review_count, 0) as review_count
  FROM subcontractor_directory_profiles sdp
  LEFT JOIN (
    SELECT subcontractor_profile_id, ROUND(AVG(rating)::numeric, 1) as avg_rating, COUNT(*) as review_count
    FROM subcontractor_reviews GROUP BY subcontractor_profile_id
  ) r ON r.subcontractor_profile_id = sdp.id
  WHERE sdp.abn_verified = true AND sdp.trade_types IS NOT NULL AND array_length(sdp.trade_types, 1) > 0
  ORDER BY sdp.availability_status = 'available' DESC, sdp.years_experience DESC NULLS LAST;
$$;

CREATE FUNCTION public.get_public_directory_profile(_id uuid)
RETURNS TABLE(
  id uuid, first_name text, last_name text, profile_photo_url text,
  trade_types text[], years_experience integer, service_radius_km integer,
  base_postcode text, bio text, availability_status text,
  abn_verified boolean, gst_registered boolean, has_white_card boolean,
  legal_name text, avg_rating numeric, review_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT sdp.id, sdp.first_name, sdp.last_name, sdp.profile_photo_url,
         sdp.trade_types, sdp.years_experience, sdp.service_radius_km,
         sdp.base_postcode, sdp.bio, sdp.availability_status,
         sdp.abn_verified, sdp.gst_registered, sdp.has_white_card, sdp.legal_name,
         COALESCE(r.avg_rating, 0) as avg_rating,
         COALESCE(r.review_count, 0) as review_count
  FROM subcontractor_directory_profiles sdp
  LEFT JOIN (
    SELECT subcontractor_profile_id, ROUND(AVG(rating)::numeric, 1) as avg_rating, COUNT(*) as review_count
    FROM subcontractor_reviews GROUP BY subcontractor_profile_id
  ) r ON r.subcontractor_profile_id = sdp.id
  WHERE sdp.id = _id AND sdp.abn_verified = true;
$$;
