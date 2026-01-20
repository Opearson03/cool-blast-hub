-- Add parent_markup_id to link beams to their parent slab
ALTER TABLE takeoff_markups 
ADD COLUMN parent_markup_id UUID REFERENCES takeoff_markups(id) ON DELETE CASCADE;

-- Add markup_type for clearer categorization
ALTER TABLE takeoff_markups 
ADD COLUMN markup_type TEXT DEFAULT 'primary';

-- Add index for efficient parent-child queries
CREATE INDEX idx_takeoff_markups_parent ON takeoff_markups(parent_markup_id) WHERE parent_markup_id IS NOT NULL;