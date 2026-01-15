-- Drop the existing constraint and add updated one with new shape types
ALTER TABLE public.takeoff_markups DROP CONSTRAINT IF EXISTS takeoff_markups_shape_type_check;

ALTER TABLE public.takeoff_markups ADD CONSTRAINT takeoff_markups_shape_type_check 
CHECK (shape_type = ANY (ARRAY['polygon'::text, 'rectangle'::text, 'point'::text, 'polyline'::text]));