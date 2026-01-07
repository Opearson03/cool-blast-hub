-- Create price list items table
CREATE TABLE public.price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  default_price DECIMAL(10,2) NOT NULL,
  custom_price DECIMAL(10,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, category, item_code)
);

-- Enable RLS
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage their business price list
CREATE POLICY "Admins can manage their business price list"
ON public.price_list_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id IN (
    SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id IN (
    SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid()
  )
);

-- Staff can view price list
CREATE POLICY "Staff can view business price list"
ON public.price_list_items
FOR SELECT
USING (
  business_id IN (
    SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_price_list_items_business_category ON public.price_list_items(business_id, category);

-- Create trigger for updated_at
CREATE TRIGGER update_price_list_items_updated_at
BEFORE UPDATE ON public.price_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();