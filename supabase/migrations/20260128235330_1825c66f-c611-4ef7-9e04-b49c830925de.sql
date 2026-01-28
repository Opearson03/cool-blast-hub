-- Add toe_width_mm and toe_depth_mm columns to takeoff_markups
-- These replace the single toe_mm column for retaining wall footings

ALTER TABLE public.takeoff_markups 
ADD COLUMN IF NOT EXISTS toe_width_mm integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS toe_depth_mm integer DEFAULT NULL;

-- Migrate existing toe_mm data to both width and depth (assuming equal dimensions as fallback)
UPDATE public.takeoff_markups 
SET toe_width_mm = toe_mm, toe_depth_mm = toe_mm 
WHERE toe_mm IS NOT NULL AND (toe_width_mm IS NULL OR toe_depth_mm IS NULL);

COMMENT ON COLUMN public.takeoff_markups.toe_width_mm IS 'Width of the footing toe extension in millimeters (for retaining wall footings)';
COMMENT ON COLUMN public.takeoff_markups.toe_depth_mm IS 'Depth of the footing toe extension in millimeters (for retaining wall footings)';