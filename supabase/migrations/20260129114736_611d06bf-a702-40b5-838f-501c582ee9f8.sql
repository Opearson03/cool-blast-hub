-- Add SMS tracking columns to job_variations table
ALTER TABLE public.job_variations
ADD COLUMN IF NOT EXISTS submitted_to_phone TEXT,
ADD COLUMN IF NOT EXISTS sent_via TEXT,
ADD COLUMN IF NOT EXISTS sms_delivery_status TEXT,
ADD COLUMN IF NOT EXISTS sms_message_sid TEXT,
ADD COLUMN IF NOT EXISTS sms_error_message TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.job_variations.sent_via IS 'How the variation was sent: sms, email, or both';
COMMENT ON COLUMN public.job_variations.sms_delivery_status IS 'SMS delivery status: sent, failed, rate_limited';
COMMENT ON COLUMN public.job_variations.sms_message_sid IS 'Twilio message SID for tracking';
COMMENT ON COLUMN public.job_variations.submitted_to_phone IS 'Phone number the variation was sent to';