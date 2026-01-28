-- Add delivery tracking columns to external_invites
ALTER TABLE external_invites 
ADD COLUMN IF NOT EXISTS sms_delivery_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sms_message_sid TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sms_error_message TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_delivery_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_message_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_error_message TEXT DEFAULT NULL;

-- Add index for rate limiting queries (business_id + sent_at + sms_delivery_status)
CREATE INDEX IF NOT EXISTS idx_external_invites_rate_limit 
ON external_invites(business_id, sent_at, sms_delivery_status) 
WHERE sms_delivery_status = 'sent';