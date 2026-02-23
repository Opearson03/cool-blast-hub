
-- Create subcontractor directory profiles table
CREATE TABLE public.subcontractor_directory_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  email text,
  abn text,
  legal_name text,
  gst_registered boolean DEFAULT false,
  entity_type text,
  abn_verified boolean DEFAULT false,
  trade_types text[],
  years_experience integer,
  service_radius_km integer,
  base_postcode text,
  insurance_certificate_url text,
  profile_photo_url text,
  bio text,
  availability_status text DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subcontractor_directory_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view all subcontractor profiles"
  ON public.subcontractor_directory_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own subcontractor profile"
  ON public.subcontractor_directory_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subcontractor profile"
  ON public.subcontractor_directory_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subcontractor profile"
  ON public.subcontractor_directory_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_subcontractor_profiles_updated_at
  BEFORE UPDATE ON public.subcontractor_directory_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: is_subcontractor
CREATE OR REPLACE FUNCTION public.is_subcontractor(_user_id uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'subcontractor'
  )
$$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('subcontractor-documents', 'subcontractor-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('subcontractor-photos', 'subcontractor-photos', true);

-- Storage policies: subcontractor-documents (private)
CREATE POLICY "Subcontractors can upload own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'subcontractor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Subcontractors can view own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'subcontractor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Subcontractors can update own documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'subcontractor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: subcontractor-photos (public read, owner write)
CREATE POLICY "Anyone can view subcontractor photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'subcontractor-photos');

CREATE POLICY "Subcontractors can upload own photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'subcontractor-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Subcontractors can update own photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'subcontractor-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin RPC to get all subcontractor profiles
CREATE OR REPLACE FUNCTION public.get_all_subcontractor_profiles()
  RETURNS SETOF public.subcontractor_directory_profiles
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: pourhub_staff role required';
  END IF;
  RETURN QUERY SELECT * FROM public.subcontractor_directory_profiles ORDER BY created_at DESC;
END;
$$;
