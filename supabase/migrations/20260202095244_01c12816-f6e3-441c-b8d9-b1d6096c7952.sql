-- Create clients table for storing client contact information
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subcontractors table for storing subcontractor contact information
CREATE TABLE public.subcontractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  trade TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_clients_business_id ON public.clients(business_id);
CREATE INDEX idx_clients_name ON public.clients(business_id, name);
CREATE INDEX idx_subcontractors_business_id ON public.subcontractors(business_id);
CREATE INDEX idx_subcontractors_name ON public.subcontractors(business_id, name);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients
CREATE POLICY "Users can view their business clients"
  ON public.clients FOR SELECT
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can create clients for their business"
  ON public.clients FOR INSERT
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can update their business clients"
  ON public.clients FOR UPDATE
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can delete their business clients"
  ON public.clients FOR DELETE
  USING (business_id = get_user_business_id(auth.uid()));

-- RLS policies for subcontractors
CREATE POLICY "Users can view their business subcontractors"
  ON public.subcontractors FOR SELECT
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can create subcontractors for their business"
  ON public.subcontractors FOR INSERT
  WITH CHECK (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can update their business subcontractors"
  ON public.subcontractors FOR UPDATE
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Users can delete their business subcontractors"
  ON public.subcontractors FOR DELETE
  USING (business_id = get_user_business_id(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractors_updated_at
  BEFORE UPDATE ON public.subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();