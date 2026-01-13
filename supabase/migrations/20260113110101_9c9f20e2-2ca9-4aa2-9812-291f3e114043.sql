-- Add name field to takeoff_markups for area identification
ALTER TABLE public.takeoff_markups 
ADD COLUMN name text;