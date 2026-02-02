-- Create supplier_contacts table for storing supplier contact details
CREATE TABLE supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  category TEXT DEFAULT 'general',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on supplier_contacts
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policy for supplier_contacts
CREATE POLICY "Users can manage supplier contacts for their business"
ON supplier_contacts FOR ALL
USING (business_id = get_user_business_id(auth.uid()))
WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- Create purchase_orders table for tracking sent POs
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  boq_id UUID NOT NULL REFERENCES job_boq(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_contact_id UUID REFERENCES supplier_contacts(id),
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  supplier_phone TEXT,
  delivery_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  sent_via TEXT,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on purchase_orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS policy for purchase_orders
CREATE POLICY "Users can manage POs for their business"
ON purchase_orders FOR ALL
USING (business_id = get_user_business_id(auth.uid()))
WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- Add updated_at trigger for supplier_contacts
CREATE TRIGGER update_supplier_contacts_updated_at
BEFORE UPDATE ON supplier_contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for purchase_orders
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();