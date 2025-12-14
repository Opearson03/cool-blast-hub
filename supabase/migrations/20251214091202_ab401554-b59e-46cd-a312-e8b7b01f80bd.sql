-- Add pour_id and assigned_to columns to job_itps
ALTER TABLE public.job_itps 
ADD COLUMN IF NOT EXISTS pour_id uuid REFERENCES public.job_pours(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_itps_pour_id ON public.job_itps(pour_id);
CREATE INDEX IF NOT EXISTS idx_job_itps_assigned_to ON public.job_itps(assigned_to);

-- Update RLS to allow assigned employees to update their ITPs
CREATE POLICY "Assigned employees can update their ITPs"
ON public.job_itps
FOR UPDATE
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());