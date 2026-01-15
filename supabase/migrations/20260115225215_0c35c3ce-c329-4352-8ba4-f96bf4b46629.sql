-- Create waiting list table
CREATE TABLE public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  business_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (join the waiting list)
CREATE POLICY "Anyone can join waiting list"
ON public.waiting_list
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No one can read individual entries (privacy)
-- But we'll use a function to get the count

-- Create a public function to get the waiting list count
CREATE OR REPLACE FUNCTION public.get_waiting_list_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.waiting_list;
$$;