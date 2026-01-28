-- Add inbound email alias column to businesses
ALTER TABLE public.businesses 
ADD COLUMN inbound_email_alias TEXT UNIQUE;

-- Create pending_test_results_status enum
CREATE TYPE public.pending_test_status AS ENUM ('pending', 'approved', 'rejected');

-- Create pending_test_results table
CREATE TABLE public.pending_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  subject TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lab_report_url TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  status pending_test_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  linked_job_id UUID REFERENCES public.jobs(id),
  linked_pour_id UUID REFERENCES public.job_pours(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_test_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_test_results
CREATE POLICY "Users can view pending results for their business"
ON public.pending_test_results
FOR SELECT
USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admins can manage pending results for their business"
ON public.pending_test_results
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND business_id = get_user_business_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND business_id = get_user_business_id(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_pending_test_results_updated_at
BEFORE UPDATE ON public.pending_test_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_pending_test_results_business_status ON public.pending_test_results(business_id, status);
CREATE INDEX idx_businesses_inbound_email_alias ON public.businesses(inbound_email_alias) WHERE inbound_email_alias IS NOT NULL;