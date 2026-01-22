-- Create job_variations table for tracking contract changes
CREATE TABLE public.job_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  variation_number TEXT NOT NULL,
  
  -- Core details
  description TEXT NOT NULL,
  reason TEXT, -- 'client_request' | 'site_condition' | 'design_change' | 'regulatory' | 'other'
  
  -- Financial
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of line items
  amount NUMERIC NOT NULL DEFAULT 0, -- Total (can be negative for omissions)
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'submitted' | 'approved' | 'declined' | 'invoiced'
  
  -- Approval tracking
  submitted_at TIMESTAMPTZ,
  submitted_to_email TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  approval_reference TEXT,
  
  -- Time impact
  days_extension INTEGER DEFAULT 0,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.job_variations ENABLE ROW LEVEL SECURITY;

-- RLS policies matching jobs pattern
CREATE POLICY "Admins can manage their business variations"
ON public.job_variations
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id = get_user_business_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND business_id = get_user_business_id(auth.uid())
);

CREATE POLICY "Users can view variations in their business"
ON public.job_variations
FOR SELECT
USING (business_id = get_user_business_id(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_variations_updated_at
BEFORE UPDATE ON public.job_variations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for job lookup
CREATE INDEX idx_job_variations_job_id ON public.job_variations(job_id);
CREATE INDEX idx_job_variations_business_id ON public.job_variations(business_id);