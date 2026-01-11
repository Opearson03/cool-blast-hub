-- Add job_type column to jobs table to differentiate between concrete and misc jobs
ALTER TABLE public.jobs ADD COLUMN job_type text NOT NULL DEFAULT 'concrete';

-- Add index for filtering by job_type
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);