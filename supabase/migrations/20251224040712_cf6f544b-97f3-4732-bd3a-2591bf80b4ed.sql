-- Add auto_clocked_out flag to timesheets table
ALTER TABLE public.timesheets 
ADD COLUMN IF NOT EXISTS auto_clocked_out boolean DEFAULT false;