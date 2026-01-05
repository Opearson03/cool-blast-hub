-- Create job_boq table to store Bill of Quantities for jobs
CREATE TABLE public.job_boq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT job_boq_job_id_unique UNIQUE (job_id)
);

-- Enable RLS
ALTER TABLE public.job_boq ENABLE ROW LEVEL SECURITY;

-- Create policies - users can access BOQ for jobs in their business
CREATE POLICY "Users can view BOQ for their business jobs"
ON public.job_boq
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.profiles p ON j.business_id = p.business_id
    WHERE j.id = job_boq.job_id AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can insert BOQ for their business jobs"
ON public.job_boq
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.profiles p ON j.business_id = p.business_id
    WHERE j.id = job_boq.job_id AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can update BOQ for their business jobs"
ON public.job_boq
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.profiles p ON j.business_id = p.business_id
    WHERE j.id = job_boq.job_id AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can delete BOQ for their business jobs"
ON public.job_boq
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.profiles p ON j.business_id = p.business_id
    WHERE j.id = job_boq.job_id AND p.id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_job_boq_updated_at
BEFORE UPDATE ON public.job_boq
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();