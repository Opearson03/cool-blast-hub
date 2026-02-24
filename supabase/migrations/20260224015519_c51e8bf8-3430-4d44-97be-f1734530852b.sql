
-- Create subcontractor_unavailable_dates table
CREATE TABLE public.subcontractor_unavailable_dates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.subcontractor_unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Users can manage their own unavailable dates
CREATE POLICY "Users can manage their own unavailable dates"
ON public.subcontractor_unavailable_dates
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add show_availability_in_directory to subcontractor_directory_profiles
ALTER TABLE public.subcontractor_directory_profiles
ADD COLUMN show_availability_in_directory boolean NOT NULL DEFAULT false;
