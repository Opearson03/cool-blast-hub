-- Add startup_completed column to jobs table
-- This tracks whether the user has completed the job startup wizard
ALTER TABLE public.jobs 
ADD COLUMN startup_completed BOOLEAN DEFAULT true;

-- Set existing jobs as completed (they don't need the wizard)
-- New jobs from quote acceptance will be set to false
UPDATE public.jobs SET startup_completed = true WHERE startup_completed IS NULL;

-- Create index for filtering new jobs
CREATE INDEX idx_jobs_startup_completed ON public.jobs (startup_completed) WHERE startup_completed = false;