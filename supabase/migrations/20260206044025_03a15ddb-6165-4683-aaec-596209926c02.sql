-- Create supplier_registrations table for interested suppliers
CREATE TABLE public.supplier_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  abn text,
  categories text[] DEFAULT '{}',
  service_areas text[] DEFAULT '{}',
  website text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a registration (public insert)
CREATE POLICY "Anyone can submit supplier registration"
  ON public.supplier_registrations
  FOR INSERT
  WITH CHECK (true);

-- Only PourHub staff can view registrations
CREATE POLICY "Staff can view supplier registrations"
  ON public.supplier_registrations
  FOR SELECT
  USING (is_pourhub_staff(auth.uid()));

-- Only PourHub staff can update registrations
CREATE POLICY "Staff can update supplier registrations"
  ON public.supplier_registrations
  FOR UPDATE
  USING (is_pourhub_staff(auth.uid()));

-- Only PourHub staff can delete registrations
CREATE POLICY "Staff can delete supplier registrations"
  ON public.supplier_registrations
  FOR DELETE
  USING (is_pourhub_staff(auth.uid()));