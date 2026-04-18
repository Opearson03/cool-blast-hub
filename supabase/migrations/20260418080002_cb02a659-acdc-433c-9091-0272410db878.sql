-- Create enterprise_redirects table
CREATE TABLE public.enterprise_redirects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  subdomain text NOT NULL,
  business_name text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enterprise_redirects ENABLE ROW LEVEL SECURITY;

-- Staff can manage all rows
CREATE POLICY "Staff can manage enterprise redirects"
ON public.enterprise_redirects
FOR ALL
TO authenticated
USING (is_pourhub_staff(auth.uid()))
WITH CHECK (is_pourhub_staff(auth.uid()));

-- Authenticated users can view their own mapping row (by email)
CREATE POLICY "Users can view own enterprise redirect"
ON public.enterprise_redirects
FOR SELECT
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email'::text)));

-- Trigger to lowercase email and update timestamp
CREATE OR REPLACE FUNCTION public.normalize_enterprise_redirect()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email = lower(NEW.email);
  NEW.subdomain = lower(NEW.subdomain);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_enterprise_redirect_trigger
BEFORE INSERT OR UPDATE ON public.enterprise_redirects
FOR EACH ROW
EXECUTE FUNCTION public.normalize_enterprise_redirect();

-- Index for fast lookup
CREATE INDEX idx_enterprise_redirects_email ON public.enterprise_redirects(lower(email));