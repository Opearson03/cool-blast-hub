-- Add columns to takeoff_markups for waffle pod counting data
ALTER TABLE public.takeoff_markups
ADD COLUMN IF NOT EXISTS pod_count integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS spacer_4way_count integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS spacer_2way_count integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pod_thickness_mm integer DEFAULT NULL;