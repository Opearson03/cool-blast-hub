-- Add email_body column to pending_test_results for consistency with other inbox tables
ALTER TABLE public.pending_test_results
ADD COLUMN IF NOT EXISTS email_body text;