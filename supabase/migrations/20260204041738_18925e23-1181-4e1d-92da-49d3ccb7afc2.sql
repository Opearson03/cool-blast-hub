-- Add delivery_date and site_contact columns to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN delivery_date DATE,
ADD COLUMN site_contact_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN site_contact_name TEXT,
ADD COLUMN site_contact_phone TEXT;

-- Create internal_contacts table for site contacts/internal employees that aren't users
CREATE TABLE internal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE internal_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for internal_contacts
CREATE POLICY "Users can manage internal contacts for their business" ON internal_contacts
  FOR ALL USING (business_id = get_user_business_id(auth.uid()))
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_internal_contacts_business_id ON internal_contacts(business_id);