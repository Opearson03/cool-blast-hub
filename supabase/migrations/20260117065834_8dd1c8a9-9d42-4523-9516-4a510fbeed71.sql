-- Add payment terms columns to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS payment_terms_type text DEFAULT 'deposit_balance',
ADD COLUMN IF NOT EXISTS deposit_percentage numeric(5,2) DEFAULT 50,
ADD COLUMN IF NOT EXISTS quote_validity_days integer DEFAULT 14;