
-- Public directory listing: returns safe fields for all verified subcontractors
CREATE OR REPLACE FUNCTION public.get_public_directory_profiles()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  profile_photo_url text,
  trade_types text[],
  years_experience integer,
  service_radius_km integer,
  base_postcode text,
  bio text,
  availability_status text,
  abn_verified boolean,
  gst_registered boolean,
  has_white_card boolean,
  legal_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT id, first_name, last_name, profile_photo_url,
         trade_types, years_experience, service_radius_km,
         base_postcode, bio, availability_status,
         abn_verified, gst_registered, has_white_card, legal_name
  FROM subcontractor_directory_profiles
  WHERE abn_verified = true
    AND trade_types IS NOT NULL
    AND array_length(trade_types, 1) > 0
  ORDER BY availability_status = 'available' DESC, years_experience DESC NULLS LAST;
$$;

-- Single profile lookup by ID
CREATE OR REPLACE FUNCTION public.get_public_directory_profile(_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  profile_photo_url text,
  trade_types text[],
  years_experience integer,
  service_radius_km integer,
  base_postcode text,
  bio text,
  availability_status text,
  abn_verified boolean,
  gst_registered boolean,
  has_white_card boolean,
  legal_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT sdp.id, sdp.first_name, sdp.last_name, sdp.profile_photo_url,
         sdp.trade_types, sdp.years_experience, sdp.service_radius_km,
         sdp.base_postcode, sdp.bio, sdp.availability_status,
         sdp.abn_verified, sdp.gst_registered, sdp.has_white_card, sdp.legal_name
  FROM subcontractor_directory_profiles sdp
  WHERE sdp.id = _id AND sdp.abn_verified = true;
$$;
