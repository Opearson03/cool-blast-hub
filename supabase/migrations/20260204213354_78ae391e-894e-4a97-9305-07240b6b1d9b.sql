-- Add scopes column to job_pours table for storing assigned scope keys per work event
ALTER TABLE job_pours ADD COLUMN scopes JSONB DEFAULT '[]';