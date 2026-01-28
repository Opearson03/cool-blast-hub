-- Add subfolder column to documents table for folder organization
ALTER TABLE documents ADD COLUMN subfolder TEXT DEFAULT 'general';

-- Create index for subfolder filtering
CREATE INDEX idx_documents_subfolder ON documents(reference_id, subfolder);

-- Create pending_documents table for delivery docket review workflow
CREATE TABLE pending_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  subject TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}',
  document_type TEXT NOT NULL DEFAULT 'delivery_docket',
  status TEXT NOT NULL DEFAULT 'pending',
  linked_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  linked_pour_id UUID REFERENCES job_pours(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE pending_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_documents
CREATE POLICY "Users can view pending documents for their business"
ON pending_documents FOR SELECT
USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage pending documents"
ON pending_documents FOR ALL
USING (
  has_role(auth.uid(), 'admin') 
  AND business_id = get_user_business_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin') 
  AND business_id = get_user_business_id(auth.uid())
);

-- Create index for common queries
CREATE INDEX idx_pending_documents_business_status ON pending_documents(business_id, status);
CREATE INDEX idx_pending_documents_job ON pending_documents(linked_job_id);