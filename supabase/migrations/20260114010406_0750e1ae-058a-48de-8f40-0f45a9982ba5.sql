-- Make plan_url nullable since we now use takeoff_files table
ALTER TABLE estimate_takeoffs ALTER COLUMN plan_url DROP NOT NULL;

-- Also make plan_type nullable for consistency
ALTER TABLE estimate_takeoffs ALTER COLUMN plan_type DROP NOT NULL;