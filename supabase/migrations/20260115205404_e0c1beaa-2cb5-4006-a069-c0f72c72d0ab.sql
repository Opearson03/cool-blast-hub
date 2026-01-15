-- Add pier-specific columns to takeoff_markups
ALTER TABLE takeoff_markups 
  ADD COLUMN IF NOT EXISTS diameter_mm integer,
  ADD COLUMN IF NOT EXISTS depth_mm integer,
  ADD COLUMN IF NOT EXISTS pier_quantity integer DEFAULT 1;