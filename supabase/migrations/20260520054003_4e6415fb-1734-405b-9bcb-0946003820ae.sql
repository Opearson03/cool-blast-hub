-- 1. Add geo columns
ALTER TABLE public.supplier_reps
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric;

ALTER TABLE public.supplier_reps_staging
  ADD COLUMN IF NOT EXISTS postcode text;

-- Default service radius
ALTER TABLE public.supplier_reps
  ALTER COLUMN service_radius_km SET DEFAULT 75;

-- 2. Trigger to derive postcode from branch_address, then lat/lng from au_postcode_coords
CREATE OR REPLACE FUNCTION public.set_supplier_rep_geo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pc text;
  _coord record;
BEGIN
  -- If postcode missing, try to parse a 4-digit number from branch_address
  IF (NEW.postcode IS NULL OR NEW.postcode = '') AND NEW.branch_address IS NOT NULL THEN
    SELECT (regexp_matches(NEW.branch_address, '\b(\d{4})\b'))[1] INTO _pc;
    IF _pc IS NOT NULL THEN
      NEW.postcode := _pc;
    END IF;
  END IF;

  -- Fill lat/lng from postcode lookup (only on supplier_reps which has the columns)
  IF TG_TABLE_NAME = 'supplier_reps' AND NEW.postcode IS NOT NULL THEN
    SELECT lat, lng INTO _coord FROM public.au_postcode_coords WHERE postcode = NEW.postcode;
    IF FOUND THEN
      NEW.lat := _coord.lat;
      NEW.lng := _coord.lng;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_supplier_rep_geo ON public.supplier_reps;
CREATE TRIGGER trg_set_supplier_rep_geo
BEFORE INSERT OR UPDATE OF branch_address, postcode ON public.supplier_reps
FOR EACH ROW EXECUTE FUNCTION public.set_supplier_rep_geo();

DROP TRIGGER IF EXISTS trg_set_supplier_rep_geo_staging ON public.supplier_reps_staging;
CREATE TRIGGER trg_set_supplier_rep_geo_staging
BEFORE INSERT OR UPDATE OF branch_address, postcode ON public.supplier_reps_staging
FOR EACH ROW EXECUTE FUNCTION public.set_supplier_rep_geo();

-- 3. Seed Hanson + Holcim
INSERT INTO public.supplier_brands (name, slug, website, is_active)
VALUES
  ('Hanson', 'hanson', 'https://www.hanson.com.au', true),
  ('Holcim', 'holcim', 'https://www.holcim.com.au', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. RPC: nearest active rep per brand to a given postcode
CREATE OR REPLACE FUNCTION public.get_local_supplier_reps(_postcode text)
RETURNS TABLE(
  brand_id uuid,
  brand_name text,
  brand_logo_url text,
  rep_id uuid,
  rep_name text,
  rep_role text,
  email text,
  phone text,
  mobile text,
  branch_name text,
  branch_address text,
  postcode text,
  state text,
  region text,
  distance_km numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lat numeric;
  _lng numeric;
  _state text;
BEGIN
  SELECT pc.lat, pc.lng INTO _lat, _lng
  FROM public.au_postcode_coords pc WHERE pc.postcode = _postcode;

  RETURN QUERY
  WITH scored AS (
    SELECT
      b.id AS brand_id,
      b.name AS brand_name,
      b.logo_url AS brand_logo_url,
      r.id AS rep_id,
      r.name AS rep_name,
      r.role AS rep_role,
      r.email,
      r.phone,
      r.mobile,
      r.branch_name,
      r.branch_address,
      r.postcode,
      r.state,
      r.region,
      CASE
        WHEN _lat IS NULL OR r.lat IS NULL OR r.lng IS NULL THEN NULL
        ELSE ROUND(
          (2 * 6371 * asin(sqrt(
            power(sin(radians(r.lat - _lat) / 2), 2) +
            cos(radians(_lat)) * cos(radians(r.lat)) *
            power(sin(radians(r.lng - _lng) / 2), 2)
          )))::numeric, 1
        )
      END AS distance_km,
      COALESCE(r.service_radius_km, 75) AS svc_radius
    FROM public.supplier_reps r
    JOIN public.supplier_brands b ON b.id = r.brand_id
    WHERE r.is_active = true AND b.is_active = true
  ),
  ranked AS (
    SELECT s.*,
      ROW_NUMBER() OVER (
        PARTITION BY s.brand_id
        ORDER BY
          CASE WHEN s.distance_km IS NOT NULL AND s.distance_km <= s.svc_radius THEN 0 ELSE 1 END,
          s.distance_km NULLS LAST,
          s.rep_name
      ) AS rn
    FROM scored s
  )
  SELECT
    ranked.brand_id, ranked.brand_name, ranked.brand_logo_url,
    ranked.rep_id, ranked.rep_name, ranked.rep_role,
    ranked.email, ranked.phone, ranked.mobile,
    ranked.branch_name, ranked.branch_address, ranked.postcode,
    ranked.state, ranked.region, ranked.distance_km
  FROM ranked
  WHERE ranked.rn = 1
  ORDER BY ranked.distance_km NULLS LAST, ranked.brand_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_local_supplier_reps(text) TO authenticated;