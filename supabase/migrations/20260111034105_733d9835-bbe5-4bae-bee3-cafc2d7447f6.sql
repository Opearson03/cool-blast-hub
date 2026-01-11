-- Add source_estimate_id to jobs table to link jobs to their source estimate
ALTER TABLE public.jobs ADD COLUMN source_estimate_id UUID REFERENCES public.estimates(id);

-- Create index for faster lookups
CREATE INDEX idx_jobs_source_estimate_id ON public.jobs(source_estimate_id);