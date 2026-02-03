-- Create pending_general table for emails that don't fit other categories
CREATE TABLE public.pending_general (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  file_url TEXT,
  file_name TEXT,
  email_body TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_general ENABLE ROW LEVEL SECURITY;

-- Admins can manage pending general items
CREATE POLICY "Admins can manage pending general" 
ON public.pending_general 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) AND (business_id = get_user_business_id(auth.uid())))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND (business_id = get_user_business_id(auth.uid())));

-- Users can view pending general for their business
CREATE POLICY "Users can view pending general for their business" 
ON public.pending_general 
FOR SELECT 
USING (business_id = get_user_business_id(auth.uid()));