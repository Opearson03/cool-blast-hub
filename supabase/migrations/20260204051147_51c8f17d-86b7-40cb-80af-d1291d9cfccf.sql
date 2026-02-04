-- Add start_time column to external_invites for subbie-specific arrival times
ALTER TABLE external_invites ADD COLUMN start_time TIME;