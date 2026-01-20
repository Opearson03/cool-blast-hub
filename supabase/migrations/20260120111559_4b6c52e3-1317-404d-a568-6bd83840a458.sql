-- Add toe_mm column for retaining wall footings toe dimension
ALTER TABLE public.takeoff_markups 
  ADD COLUMN IF NOT EXISTS toe_mm integer;

-- Add comment for documentation
COMMENT ON COLUMN public.takeoff_markups.toe_mm IS 'Toe length in mm for retaining wall footings (distance footing extends beyond wall face)';