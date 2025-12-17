-- Add avatar_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create timesheets table
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pour_id UUID REFERENCES public.job_pours(id) ON DELETE SET NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  clock_in_latitude DECIMAL(10, 8),
  clock_in_longitude DECIMAL(11, 8),
  clock_out_latitude DECIMAL(10, 8),
  clock_out_longitude DECIMAL(11, 8),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  edited_by UUID REFERENCES public.profiles(id),
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timesheets
CREATE POLICY "Employees can view own timesheets"
ON public.timesheets FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own timesheets"
ON public.timesheets FOR INSERT
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own active timesheets"
ON public.timesheets FOR UPDATE
USING (employee_id = auth.uid() AND status = 'active')
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can manage business timesheets"
ON public.timesheets FOR ALL
USING (
  has_role(auth.uid(), 'admin') AND 
  business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())
);

-- Create updated_at trigger for timesheets
CREATE TRIGGER update_timesheets_updated_at
BEFORE UPDATE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create push_tokens table for notifications
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push tokens"
ON public.push_tokens FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());