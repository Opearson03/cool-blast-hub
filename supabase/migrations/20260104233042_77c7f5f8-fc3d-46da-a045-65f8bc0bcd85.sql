-- Add structured data columns to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS scope_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS selected_scopes jsonb DEFAULT '[]';