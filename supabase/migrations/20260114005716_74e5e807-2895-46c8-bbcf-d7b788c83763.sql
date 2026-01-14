-- Create takeoff_files table for multi-file construction sets
CREATE TABLE public.takeoff_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  takeoff_id UUID NOT NULL REFERENCES public.estimate_takeoffs(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_name TEXT NOT NULL,
  page_count INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create takeoff_page_scales table for per-page scale calibration
CREATE TABLE public.takeoff_page_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.takeoff_files(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 1,
  scale_pixels_per_meter NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_id, page_number)
);

-- Add file_id to takeoff_markups to track which file the markup belongs to
ALTER TABLE public.takeoff_markups 
ADD COLUMN file_id UUID REFERENCES public.takeoff_files(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.takeoff_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_page_scales ENABLE ROW LEVEL SECURITY;

-- RLS policies for takeoff_files (access via estimate ownership)
CREATE POLICY "Users can view takeoff files for their business estimates"
ON public.takeoff_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.estimate_takeoffs et
    JOIN public.estimates e ON e.id = et.estimate_id
    WHERE et.id = takeoff_files.takeoff_id
    AND e.business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert takeoff files for their business estimates"
ON public.takeoff_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.estimate_takeoffs et
    JOIN public.estimates e ON e.id = et.estimate_id
    WHERE et.id = takeoff_files.takeoff_id
    AND e.business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update takeoff files for their business estimates"
ON public.takeoff_files FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.estimate_takeoffs et
    JOIN public.estimates e ON e.id = et.estimate_id
    WHERE et.id = takeoff_files.takeoff_id
    AND e.business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete takeoff files for their business estimates"
ON public.takeoff_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.estimate_takeoffs et
    JOIN public.estimates e ON e.id = et.estimate_id
    WHERE et.id = takeoff_files.takeoff_id
    AND e.business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- RLS policies for takeoff_page_scales (access via file ownership)
CREATE POLICY "Users can view page scales for their takeoff files"
ON public.takeoff_page_scales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.takeoff_files tf
    JOIN public.estimate_takeoffs et ON et.id = tf.takeoff_id
    JOIN public.estimates e ON e.id = et.estimate_id
    WHERE tf.id = takeoff_page_scales.file_id
    AND e.business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert page scales for their takeoff files"
ON public.takeoff_page_scales FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.takeoff_files tf
    JOIN public.estimate_takeoffs et ON et.id = tf.takeoff_id
    JOIN public.estimates e ON e.id = et.estimate_id
    WHERE tf.id = takeoff_page_scales.file_id
    AND e.business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update page scales for their takeoff files"
ON public.takeoff_page_scales FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.takeoff_files tf
    JOIN public.estimate_takeoffs et ON et.id = tf.takeoff_id
    JOIN public.estimates e ON e.id = et.estimate_id
    WHERE tf.id = takeoff_page_scales.file_id
    AND e.business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete page scales for their takeoff files"
ON public.takeoff_page_scales FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.takeoff_files tf
    JOIN public.estimate_takeoffs et ON et.id = tf.takeoff_id
    JOIN public.estimates e ON e.id = et.estimate_id
    WHERE tf.id = takeoff_page_scales.file_id
    AND e.business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Migrate existing data: Create takeoff_files records from existing plan_url
INSERT INTO public.takeoff_files (takeoff_id, file_url, file_type, file_name, page_count, sort_order)
SELECT 
  id as takeoff_id, 
  plan_url as file_url, 
  plan_type as file_type, 
  'Building Plan' as file_name, 
  COALESCE(page_count, 1) as page_count,
  0 as sort_order
FROM public.estimate_takeoffs
WHERE plan_url IS NOT NULL;

-- Migrate existing scale data to page scales (for the migrated files)
INSERT INTO public.takeoff_page_scales (file_id, page_number, scale_pixels_per_meter)
SELECT 
  tf.id as file_id,
  COALESCE(et.current_page, 1) as page_number,
  et.scale_pixels_per_meter
FROM public.estimate_takeoffs et
JOIN public.takeoff_files tf ON tf.takeoff_id = et.id
WHERE et.scale_pixels_per_meter IS NOT NULL;

-- Update existing markups to reference their file
UPDATE public.takeoff_markups tm
SET file_id = tf.id
FROM public.takeoff_files tf
WHERE tf.takeoff_id = tm.takeoff_id;