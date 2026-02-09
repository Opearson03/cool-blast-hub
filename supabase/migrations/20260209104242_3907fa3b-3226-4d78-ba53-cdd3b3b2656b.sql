-- Add snooze column to estimates for the "Action Required" feature
-- null = not snoozed, date in future = snoozed until that date
ALTER TABLE public.estimates
ADD COLUMN action_snoozed_until timestamp with time zone DEFAULT NULL;