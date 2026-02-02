-- Add email_body column to pending_plans for storing email text content
ALTER TABLE public.pending_plans 
ADD COLUMN IF NOT EXISTS email_body text;

-- Add email_body column to pending_documents for storing email text content  
ALTER TABLE public.pending_documents 
ADD COLUMN IF NOT EXISTS email_body text;