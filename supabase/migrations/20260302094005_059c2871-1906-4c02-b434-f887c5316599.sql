
-- Add unique constraint for upsert operations on xero_sync_log
ALTER TABLE public.xero_sync_log
ADD CONSTRAINT xero_sync_log_business_source_unique UNIQUE (business_id, source_type, source_id);
