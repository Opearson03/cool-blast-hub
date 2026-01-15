-- Add width_mm and height_mm columns for polyline/linear element cross-sections
ALTER TABLE public.takeoff_markups 
  ADD COLUMN IF NOT EXISTS width_mm integer,
  ADD COLUMN IF NOT EXISTS height_mm integer,
  ADD COLUMN IF NOT EXISTS length_m numeric;

-- Add comment for documentation
COMMENT ON COLUMN public.takeoff_markups.width_mm IS 'Width in mm for linear elements (footings, kerbs, etc.)';
COMMENT ON COLUMN public.takeoff_markups.height_mm IS 'Height/depth in mm for linear elements (retaining walls, kerbs, etc.)';
COMMENT ON COLUMN public.takeoff_markups.length_m IS 'Total length in meters for polyline/linear elements';