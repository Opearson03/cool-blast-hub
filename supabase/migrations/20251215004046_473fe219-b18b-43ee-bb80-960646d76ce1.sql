-- Create leave request status enum
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Create leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view their own leave requests
CREATE POLICY "Employees can view own leave requests"
ON public.leave_requests
FOR SELECT
USING (employee_id = auth.uid());

-- Employees can create their own leave requests
CREATE POLICY "Employees can create own leave requests"
ON public.leave_requests
FOR INSERT
WITH CHECK (employee_id = auth.uid());

-- Admins can view all leave requests in their business
CREATE POLICY "Admins can view business leave requests"
ON public.leave_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  business_id IN (
    SELECT business_id FROM profiles WHERE id = auth.uid()
  )
);

-- Admins can update leave requests (approve/reject)
CREATE POLICY "Admins can update leave requests"
ON public.leave_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  business_id IN (
    SELECT business_id FROM profiles WHERE id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();