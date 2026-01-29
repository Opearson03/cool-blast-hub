-- Create job_dates table for key dates and reminders
CREATE TABLE public.job_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date_type VARCHAR(50) NOT NULL DEFAULT 'reminder', -- 'reminder', 'deadline', 'milestone', 'inspection'
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view job dates for their business" 
ON public.job_dates 
FOR SELECT 
USING (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create job dates for their business" 
ON public.job_dates 
FOR INSERT 
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update job dates for their business" 
ON public.job_dates 
FOR UPDATE 
USING (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete job dates for their business" 
ON public.job_dates 
FOR DELETE 
USING (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_job_dates_job_id ON public.job_dates(job_id);
CREATE INDEX idx_job_dates_date ON public.job_dates(date);

-- Create trigger for updated_at
CREATE TRIGGER update_job_dates_updated_at
BEFORE UPDATE ON public.job_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();