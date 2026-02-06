-- Create supplier_profiles table
CREATE TABLE public.supplier_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  abn text,
  categories text[] DEFAULT '{}',
  description text,
  logo_url text,
  website text,
  service_areas text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

-- Create is_supplier helper function
CREATE OR REPLACE FUNCTION public.is_supplier(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'supplier'
  )
$$;

-- RLS Policies for supplier_profiles

-- Suppliers can view their own profile
CREATE POLICY "Suppliers can view own profile"
ON public.supplier_profiles
FOR SELECT
USING (user_id = auth.uid());

-- Suppliers can update their own profile
CREATE POLICY "Suppliers can update own profile"
ON public.supplier_profiles
FOR UPDATE
USING (user_id = auth.uid());

-- Suppliers can insert their own profile
CREATE POLICY "Suppliers can insert own profile"
ON public.supplier_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- PourHub staff can manage all supplier profiles (for verification)
CREATE POLICY "Staff can manage all supplier profiles"
ON public.supplier_profiles
FOR ALL
USING (public.is_pourhub_staff(auth.uid()));

-- Public can view verified suppliers (for future directory)
CREATE POLICY "Public can view verified suppliers"
ON public.supplier_profiles
FOR SELECT
USING (is_verified = true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_supplier_profiles_updated_at
BEFORE UPDATE ON public.supplier_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();