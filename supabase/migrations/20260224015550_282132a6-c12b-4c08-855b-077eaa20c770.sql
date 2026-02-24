
-- Update RPCs to include show_availability_in_directory
DROP FUNCTION IF EXISTS public.get_public_directory_profiles();
DROP FUNCTION IF EXISTS public.get_public_directory_profile(uuid);

CREATE FUNCTION public.get_public_directory_profiles()
RETURNS TABLE(
  id uuid, first_name text, last_name text, profile_photo_url text,
  trade_types text[], years_experience integer, service_radius_km integer,
  base_postcode text, bio text, availability_status text,
  abn_verified boolean, gst_registered boolean, has_white_card boolean,
  legal_name text, avg_rating numeric, review_count bigint,
  show_availability_in_directory boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT sdp.id, sdp.first_name, sdp.last_name, sdp.profile_photo_url,
         sdp.trade_types, sdp.years_experience, sdp.service_radius_km,
         sdp.base_postcode, sdp.bio, sdp.availability_status,
         sdp.abn_verified, sdp.gst_registered, sdp.has_white_card, sdp.legal_name,
         COALESCE(r.avg_rating, 0) as avg_rating,
         COALESCE(r.review_count, 0) as review_count,
         sdp.show_availability_in_directory
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
  legal_name text, avg_rating numeric, review_count bigint,
  show_availability_in_directory boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT sdp.id, sdp.first_name, sdp.last_name, sdp.profile_photo_url,
         sdp.trade_types, sdp.years_experience, sdp.service_radius_km,
         sdp.base_postcode, sdp.bio, sdp.availability_status,
         sdp.abn_verified, sdp.gst_registered, sdp.has_white_card, sdp.legal_name,
         COALESCE(r.avg_rating, 0) as avg_rating,
         COALESCE(r.review_count, 0) as review_count,
         sdp.show_availability_in_directory
  FROM subcontractor_directory_profiles sdp
  LEFT JOIN (
    SELECT subcontractor_profile_id, ROUND(AVG(rating)::numeric, 1) as avg_rating, COUNT(*) as review_count
    FROM subcontractor_reviews GROUP BY subcontractor_profile_id
  ) r ON r.subcontractor_profile_id = sdp.id
  WHERE sdp.id = _id AND sdp.abn_verified = true;
$$;
