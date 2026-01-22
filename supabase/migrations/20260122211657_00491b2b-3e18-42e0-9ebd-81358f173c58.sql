-- Add signature fields to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS client_signature TEXT,
ADD COLUMN IF NOT EXISTS client_signature_name TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signing_token UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS signing_token_expires_at TIMESTAMPTZ;

-- Add signature fields to job_variations table
ALTER TABLE public.job_variations 
ADD COLUMN IF NOT EXISTS client_signature TEXT,
ADD COLUMN IF NOT EXISTS client_signature_name TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signing_token UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS signing_token_expires_at TIMESTAMPTZ;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_estimates_signing_token ON public.estimates(signing_token) WHERE signing_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_variations_signing_token ON public.job_variations(signing_token) WHERE signing_token IS NOT NULL;