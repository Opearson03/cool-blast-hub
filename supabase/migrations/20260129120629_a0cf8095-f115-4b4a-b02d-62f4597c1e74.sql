-- Add docket tracking columns to job_pours for multi-signal matching
ALTER TABLE public.job_pours 
  ADD COLUMN IF NOT EXISTS docket_numbers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS batch_ticket_refs TEXT[] DEFAULT '{}';

-- Create GIN index for fast docket number lookups
CREATE INDEX IF NOT EXISTS idx_job_pours_docket_numbers ON public.job_pours USING GIN (docket_numbers);
CREATE INDEX IF NOT EXISTS idx_job_pours_batch_ticket_refs ON public.job_pours USING GIN (batch_ticket_refs);