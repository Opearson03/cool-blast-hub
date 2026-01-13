-- Create estimate_takeoffs table
CREATE TABLE public.estimate_takeoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  plan_url TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('pdf', 'image')),
  page_count INTEGER DEFAULT 1,
  current_page INTEGER DEFAULT 1,
  scale_pixels_per_meter NUMERIC,
  scale_calibration_method TEXT CHECK (scale_calibration_method IN ('ai', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create takeoff_markups table
CREATE TABLE public.takeoff_markups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  takeoff_id UUID NOT NULL REFERENCES public.estimate_takeoffs(id) ON DELETE CASCADE,
  scope_id TEXT NOT NULL,
  shape_type TEXT NOT NULL CHECK (shape_type IN ('polygon', 'rectangle')),
  points JSONB NOT NULL DEFAULT '[]'::jsonb,
  area_sqm NUMERIC,
  perimeter_m NUMERIC,
  color TEXT DEFAULT '#3b82f6',
  page_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estimate_takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_markups ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimate_takeoffs
CREATE POLICY "Users can view takeoffs for their estimates"
ON public.estimate_takeoffs FOR SELECT TO authenticated
USING (estimate_id IN (SELECT get_user_estimate_ids(auth.uid())));

CREATE POLICY "Admins can manage takeoffs for their estimates"
ON public.estimate_takeoffs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND estimate_id IN (SELECT get_user_estimate_ids(auth.uid())))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND estimate_id IN (SELECT get_user_estimate_ids(auth.uid())));

-- RLS policies for takeoff_markups
CREATE POLICY "Users can view markups for their takeoffs"
ON public.takeoff_markups FOR SELECT TO authenticated
USING (takeoff_id IN (
  SELECT id FROM estimate_takeoffs 
  WHERE estimate_id IN (SELECT get_user_estimate_ids(auth.uid()))
));

CREATE POLICY "Admins can manage markups for their takeoffs"
ON public.takeoff_markups FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND takeoff_id IN (
  SELECT id FROM estimate_takeoffs 
  WHERE estimate_id IN (SELECT get_user_estimate_ids(auth.uid()))
))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND takeoff_id IN (
  SELECT id FROM estimate_takeoffs 
  WHERE estimate_id IN (SELECT get_user_estimate_ids(auth.uid()))
));

-- Create estimate-plans storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'estimate-plans',
  'estimate-plans',
  false,
  20971520, -- 20MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
);

-- Storage policies for estimate-plans bucket
CREATE POLICY "Users can upload estimate plans"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'estimate-plans' 
  AND (storage.foldername(name))[1] = get_user_business_id(auth.uid())::text
);

CREATE POLICY "Users can view their estimate plans"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'estimate-plans'
  AND (storage.foldername(name))[1] = get_user_business_id(auth.uid())::text
);

CREATE POLICY "Users can delete their estimate plans"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'estimate-plans'
  AND (storage.foldername(name))[1] = get_user_business_id(auth.uid())::text
);

-- Create updated_at trigger for estimate_takeoffs
CREATE TRIGGER update_estimate_takeoffs_updated_at
BEFORE UPDATE ON public.estimate_takeoffs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();