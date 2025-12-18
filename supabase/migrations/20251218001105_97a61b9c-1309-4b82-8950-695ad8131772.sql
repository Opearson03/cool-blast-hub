-- Add break fields to timesheets
ALTER TABLE public.timesheets
ADD COLUMN break_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN break_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN break_applied_by UUID REFERENCES public.profiles(id),
ADD COLUMN break_applied_at TIMESTAMP WITH TIME ZONE;

-- Add terms_accepted to track T&C acceptance
ALTER TABLE public.profiles
ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Storage policy for business-logos bucket to allow authenticated uploads
-- First drop existing policies if any
DROP POLICY IF EXISTS "Users can upload own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Business logos are publicly accessible" ON storage.objects;

-- Create proper policies for business-logos bucket
CREATE POLICY "Business logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

CREATE POLICY "Authenticated users can upload to business-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-logos');

CREATE POLICY "Authenticated users can update business-logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-logos');

CREATE POLICY "Authenticated users can delete business-logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-logos');