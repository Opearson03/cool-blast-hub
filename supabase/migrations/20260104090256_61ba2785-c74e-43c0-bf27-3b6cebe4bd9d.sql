-- Add company_name column to estimates table (optional field for business clients)
ALTER TABLE public.estimates 
ADD COLUMN company_name text;