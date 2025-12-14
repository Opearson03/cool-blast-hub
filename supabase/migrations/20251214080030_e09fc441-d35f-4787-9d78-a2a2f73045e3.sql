-- Create job_pours table for tracking multiple pours per job
CREATE TABLE public.job_pours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  pour_name TEXT NOT NULL,
  pour_date DATE,
  scheduled_time TIME,
  estimated_m3 NUMERIC,
  actual_m3 NUMERIC,
  concrete_supplier TEXT,
  mpa_strength TEXT,
  slump TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add pour_id column to concrete_tests (nullable for backwards compatibility)
ALTER TABLE public.concrete_tests ADD COLUMN pour_id UUID REFERENCES public.job_pours(id) ON DELETE SET NULL;

-- Enable RLS on job_pours
ALTER TABLE public.job_pours ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_pours
CREATE POLICY "Users can view pours in their business" ON public.job_pours
FOR SELECT USING (
  job_id IN (
    SELECT id FROM jobs WHERE business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can manage pours" ON public.job_pours
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)
);

-- Create storage bucket for test result documents
INSERT INTO storage.buckets (id, name, public) VALUES ('test-documents', 'test-documents', false);

-- Storage policies for test documents
CREATE POLICY "Users can view test documents in their business" ON storage.objects
FOR SELECT USING (
  bucket_id = 'test-documents' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE business_id IN (
      SELECT business_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can upload test documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'test-documents' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);

CREATE POLICY "Staff can delete test documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'test-documents' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);