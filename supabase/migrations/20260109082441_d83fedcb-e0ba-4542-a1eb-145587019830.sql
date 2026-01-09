-- Add scheduling fields to estimates table
ALTER TABLE public.estimates 
ADD COLUMN site_visit_date date,
ADD COLUMN follow_up_date date;