
-- Brands (Boral, Heidelberg, etc.)
CREATE TABLE public.supplier_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  primary_color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_supplier_brands_updated_at
BEFORE UPDATE ON public.supplier_brands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.supplier_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active brands"
ON public.supplier_brands FOR SELECT TO authenticated
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff manage brands"
ON public.supplier_brands FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));


-- Reps / branch contacts
CREATE TABLE public.supplier_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.supplier_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  region TEXT,
  state TEXT,
  postcodes TEXT[] NOT NULL DEFAULT '{}',
  service_radius_km NUMERIC,
  branch_name TEXT,
  branch_address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_reps_brand ON public.supplier_reps(brand_id);
CREATE INDEX idx_supplier_reps_state ON public.supplier_reps(state);
CREATE INDEX idx_supplier_reps_postcodes ON public.supplier_reps USING GIN(postcodes);

CREATE TRIGGER update_supplier_reps_updated_at
BEFORE UPDATE ON public.supplier_reps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.supplier_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active reps"
ON public.supplier_reps FOR SELECT TO authenticated
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff manage reps"
ON public.supplier_reps FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));


-- Staging table for scraped results awaiting review
CREATE TABLE public.supplier_reps_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.supplier_brands(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  region TEXT,
  state TEXT,
  postcodes TEXT[] NOT NULL DEFAULT '{}',
  branch_name TEXT,
  branch_address TEXT,
  source_url TEXT,
  raw JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_staging_status ON public.supplier_reps_staging(status);
CREATE INDEX idx_supplier_staging_brand ON public.supplier_reps_staging(brand_id);

CREATE TRIGGER update_supplier_reps_staging_updated_at
BEFORE UPDATE ON public.supplier_reps_staging
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.supplier_reps_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage staging"
ON public.supplier_reps_staging FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));


-- Storage bucket for brand logos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-logos', 'supplier-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view supplier logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'supplier-logos');

CREATE POLICY "Staff can upload supplier logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'supplier-logos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);

CREATE POLICY "Staff can update supplier logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'supplier-logos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);

CREATE POLICY "Staff can delete supplier logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'supplier-logos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);


-- Seed initial two brands (logos populated by scraper)
INSERT INTO public.supplier_brands (name, slug, website)
VALUES
  ('Boral', 'boral', 'https://www.boral.com.au'),
  ('Heidelberg Materials', 'heidelberg', 'https://www.heidelbergmaterials.com.au')
ON CONFLICT (slug) DO NOTHING;
