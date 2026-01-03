-- Create enum for estimate status
CREATE TYPE public.estimate_status AS ENUM ('draft', 'sent', 'accepted', 'declined');

-- Create estimates table
CREATE TABLE public.estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  estimate_number TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  site_address TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  total_amount NUMERIC DEFAULT 0,
  status estimate_status NOT NULL DEFAULT 'draft',
  valid_until DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate line items table
CREATE TABLE public.estimate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'm²',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for estimate numbers
CREATE SEQUENCE IF NOT EXISTS estimate_number_seq START 1;

-- Create function to generate estimate number
CREATE OR REPLACE FUNCTION public.generate_estimate_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.estimate_number := 'EST-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('estimate_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating estimate numbers
CREATE TRIGGER set_estimate_number
  BEFORE INSERT ON public.estimates
  FOR EACH ROW
  WHEN (NEW.estimate_number IS NULL)
  EXECUTE FUNCTION public.generate_estimate_number();

-- Create trigger for updating updated_at
CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimates
CREATE POLICY "Admins can manage their business estimates"
  ON public.estimates
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin') AND 
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') AND 
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can view business estimates"
  ON public.estimates
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- RLS policies for estimate items
CREATE POLICY "Users can manage estimate items via estimate access"
  ON public.estimate_items
  FOR ALL
  USING (
    estimate_id IN (
      SELECT e.id FROM public.estimates e
      WHERE e.business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
      )
    ) AND has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    estimate_id IN (
      SELECT e.id FROM public.estimates e
      WHERE e.business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
      )
    ) AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Staff can view estimate items"
  ON public.estimate_items
  FOR SELECT
  USING (
    estimate_id IN (
      SELECT e.id FROM public.estimates e
      WHERE e.business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_estimates_business_id ON public.estimates(business_id);
CREATE INDEX idx_estimates_status ON public.estimates(status);
CREATE INDEX idx_estimate_items_estimate_id ON public.estimate_items(estimate_id);