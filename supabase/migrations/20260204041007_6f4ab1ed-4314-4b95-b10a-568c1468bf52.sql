-- Create pending_quotes table for supplier quote responses
CREATE TABLE pending_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_url TEXT,
  file_name TEXT,
  email_body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  linked_rfq_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  linked_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pending_quotes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage pending quotes" ON pending_quotes
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND business_id = get_user_business_id(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    AND business_id = get_user_business_id(auth.uid())
  );

CREATE POLICY "Users can view pending quotes for their business" ON pending_quotes
  FOR SELECT USING (business_id = get_user_business_id(auth.uid()));

-- Add index for faster queries
CREATE INDEX idx_pending_quotes_business_id ON pending_quotes(business_id);
CREATE INDEX idx_pending_quotes_status ON pending_quotes(status);
CREATE INDEX idx_pending_quotes_linked_rfq_id ON pending_quotes(linked_rfq_id);