-- Add estimate_type column to estimates table
ALTER TABLE public.estimates 
ADD COLUMN estimate_type text NOT NULL DEFAULT 'driveway' 
CHECK (estimate_type IN ('driveway', 'house_slab', 'commercial_slab'));

-- Add comment for clarity
COMMENT ON COLUMN public.estimates.estimate_type IS 'Type of estimate: driveway, house_slab, or commercial_slab';