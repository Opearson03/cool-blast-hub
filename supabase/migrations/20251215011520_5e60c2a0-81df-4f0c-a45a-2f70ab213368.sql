-- Add required_signers column to job_swms table to track which employees need to sign
ALTER TABLE public.job_swms 
ADD COLUMN required_signers uuid[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.job_swms.required_signers IS 'Array of employee IDs required to sign this SWMS';