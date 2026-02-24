
-- Step 1: Create Australian postcode coordinates lookup table
CREATE TABLE public.au_postcode_coords (
  postcode text PRIMARY KEY,
  locality text,
  lat numeric NOT NULL,
  lng numeric NOT NULL
);

-- Allow public read access (reference data)
ALTER TABLE public.au_postcode_coords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read postcode coords" ON public.au_postcode_coords FOR SELECT USING (true);

-- Step 2: Create the radius-based directory search RPC
CREATE OR REPLACE FUNCTION public.get_directory_profiles_near_postcode(_postcode text)
RETURNS TABLE(
  id uuid, first_name text, last_name text, profile_photo_url text,
  trade_types text[], years_experience integer, service_radius_km integer,
  base_postcode text, bio text, availability_status text,
  abn_verified boolean, gst_registered boolean, has_white_card boolean,
  legal_name text, avg_rating numeric, review_count bigint,
  show_availability_in_directory boolean,
  distance_km numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  _lat numeric;
  _lng numeric;
BEGIN
  -- Look up the searcher's postcode coordinates
  SELECT pc.lat, pc.lng INTO _lat, _lng
  FROM au_postcode_coords pc
  WHERE pc.postcode = _postcode;

  -- If postcode not found, return empty (frontend will handle fallback)
  IF _lat IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    sdp.id, sdp.first_name, sdp.last_name, sdp.profile_photo_url,
    sdp.trade_types, sdp.years_experience, sdp.service_radius_km,
    sdp.base_postcode, sdp.bio, sdp.availability_status,
    sdp.abn_verified, sdp.gst_registered, sdp.has_white_card, sdp.legal_name,
    COALESCE(r.avg_rating, 0)::numeric as avg_rating,
    COALESCE(r.review_count, 0)::bigint as review_count,
    sdp.show_availability_in_directory,
    ROUND(
      (2 * 6371 * asin(sqrt(
        power(sin(radians(sub_coords.lat - _lat) / 2), 2) +
        cos(radians(_lat)) * cos(radians(sub_coords.lat)) *
        power(sin(radians(sub_coords.lng - _lng) / 2), 2)
      )))::numeric, 1
    ) as distance_km
  FROM subcontractor_directory_profiles sdp
  INNER JOIN au_postcode_coords sub_coords ON sub_coords.postcode = sdp.base_postcode
  LEFT JOIN (
    SELECT subcontractor_profile_id, ROUND(AVG(rating)::numeric, 1) as avg_rating, COUNT(*) as review_count
    FROM subcontractor_reviews GROUP BY subcontractor_profile_id
  ) r ON r.subcontractor_profile_id = sdp.id
  WHERE sdp.abn_verified = true
    AND sdp.trade_types IS NOT NULL
    AND array_length(sdp.trade_types, 1) > 0
    AND sdp.base_postcode IS NOT NULL
    AND (2 * 6371 * asin(sqrt(
        power(sin(radians(sub_coords.lat - _lat) / 2), 2) +
        cos(radians(_lat)) * cos(radians(sub_coords.lat)) *
        power(sin(radians(sub_coords.lng - _lng) / 2), 2)
      ))) <= COALESCE(sdp.service_radius_km, 50)
  ORDER BY distance_km ASC;
END;
$$;
