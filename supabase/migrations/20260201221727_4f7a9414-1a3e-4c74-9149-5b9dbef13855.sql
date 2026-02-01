-- Create pending_plans table for incoming building plans
CREATE TABLE public.pending_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  linked_estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage pending plans"
ON public.pending_plans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND business_id = get_user_business_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can view pending plans for their business"
ON public.pending_plans FOR SELECT
USING (business_id = get_user_business_id(auth.uid()));