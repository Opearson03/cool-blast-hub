-- PourHub Database Schema
-- Drop existing tables that will be replaced
DROP TABLE IF EXISTS public.swms_signoffs CASCADE;
DROP TABLE IF EXISTS public.swms_hazards CASCADE;
DROP TABLE IF EXISTS public.swms_emergency_procedures CASCADE;
DROP TABLE IF EXISTS public.swms_documents CASCADE;
DROP TABLE IF EXISTS public.safety_documents CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.job_assignments CASCADE;
DROP TABLE IF EXISTS public.timesheets CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;

-- Create job_status enum for PourHub
DROP TYPE IF EXISTS public.job_status CASCADE;
CREATE TYPE public.job_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Create new enums
CREATE TYPE public.test_type AS ENUM ('7_day', '28_day', 'slump', 'cylinder', 'air', 'other');
CREATE TYPE public.itp_type AS ENUM ('formwork', 'reinforcement', 'pre_pour', 'post_pour', 'custom');
CREATE TYPE public.document_category AS ENUM ('itp', 'swms', 'project_startup', 'concrete_test', 'equipment', 'employee', 'job', 'general');

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abn TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  preferred_suppliers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID NOT NULL
);

-- Update profiles to link to business
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Employee tickets/certifications
CREATE TABLE public.employee_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_type TEXT NOT NULL,
  ticket_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crews table
CREATE TABLE public.crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crew members junction table
CREATE TABLE public.crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_supervisor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(crew_id, employee_id)
);

-- Equipment register
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  serial_number TEXT,
  purchase_date DATE,
  service_interval_days INTEGER,
  last_service_date DATE,
  next_service_date DATE,
  service_notes TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs table (PourHub version)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  job_number TEXT,
  name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  builder_client TEXT,
  po_number TEXT,
  scheduled_date DATE,
  pour_time TIME,
  estimated_m3 NUMERIC,
  ordered_m3 NUMERIC,
  concrete_supplier TEXT,
  mpa_strength TEXT,
  slump TEXT,
  finish_type TEXT,
  crew_id UUID REFERENCES public.crews(id),
  job_notes TEXT,
  status public.job_status DEFAULT 'scheduled',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Job equipment assignment
CREATE TABLE public.job_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, equipment_id)
);

-- Project startup checklist
CREATE TABLE public.project_startup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE UNIQUE,
  
  -- Project Setup & Documentation
  project_name TEXT,
  client TEXT,
  client_contact_name TEXT,
  client_contact_phone TEXT,
  client_contact_email TEXT,
  site_manager TEXT,
  communication_setup BOOLEAN DEFAULT false,
  invoice_billing_address TEXT,
  invoice_payment_terms TEXT,
  
  -- Planning & Design
  plans_printed BOOLEAN DEFAULT false,
  mix_design_text TEXT,
  mix_design_file_url TEXT,
  itps_prepared BOOLEAN DEFAULT false,
  swms_prepared BOOLEAN DEFAULT false,
  risk_assessment_completed BOOLEAN DEFAULT false,
  
  -- Procurement & Suppliers
  concrete_supply BOOLEAN DEFAULT false,
  concrete_supplier TEXT,
  concrete_testing BOOLEAN DEFAULT false,
  mix_design_approval BOOLEAN DEFAULT false,
  mix_design_approval_notes TEXT,
  reo_supply BOOLEAN DEFAULT false,
  reo_supplier TEXT,
  reo_fixing_subcontractor BOOLEAN DEFAULT false,
  reo_fixing_who TEXT,
  curing_required BOOLEAN DEFAULT false,
  caulking_required BOOLEAN DEFAULT false,
  long_longs_required BOOLEAN DEFAULT false,
  
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ITP Templates
CREATE TABLE public.itp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID,
  name TEXT NOT NULL,
  itp_type public.itp_type NOT NULL,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Job ITPs
CREATE TABLE public.job_itps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.itp_templates(id),
  itp_type public.itp_type NOT NULL,
  name TEXT NOT NULL,
  checklist_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  supervisor_signature TEXT,
  supervisor_signed_at TIMESTAMPTZ,
  employee_signature TEXT,
  employee_signed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SWMS Templates
CREATE TABLE public.swms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID,
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Job SWMS
CREATE TABLE public.job_swms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.swms_templates(id),
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  hazards JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SWMS Signoffs
CREATE TABLE public.swms_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swms_id UUID NOT NULL REFERENCES public.job_swms(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  signature_data TEXT,
  signed_at TIMESTAMPTZ DEFAULT now()
);

-- Concrete Test Results
CREATE TABLE public.concrete_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  test_type public.test_type NOT NULL,
  pour_date DATE,
  test_date DATE,
  supplier TEXT,
  target_strength NUMERIC,
  actual_strength NUMERIC,
  sample_count INTEGER,
  passed BOOLEAN,
  notes TEXT,
  lab_report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents/Uploads
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  category public.document_category NOT NULL,
  reference_id UUID,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Job number sequence
CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1;

-- Function to generate job number
CREATE OR REPLACE FUNCTION public.generate_pourhub_job_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.job_number := 'PH-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(nextval('job_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Trigger for job number
CREATE TRIGGER generate_job_number_trigger
BEFORE INSERT ON public.jobs
FOR EACH ROW
WHEN (NEW.job_number IS NULL)
EXECUTE FUNCTION public.generate_pourhub_job_number();

-- Update updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_tickets_updated_at BEFORE UPDATE ON public.employee_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crews_updated_at BEFORE UPDATE ON public.crews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_startup_updated_at BEFORE UPDATE ON public.project_startup FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_itp_templates_updated_at BEFORE UPDATE ON public.itp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_itps_updated_at BEFORE UPDATE ON public.job_itps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_swms_templates_updated_at BEFORE UPDATE ON public.swms_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_swms_updated_at BEFORE UPDATE ON public.job_swms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrete_tests_updated_at BEFORE UPDATE ON public.concrete_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_startup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_itps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_swms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swms_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrete_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Users can view their own business" ON public.businesses FOR SELECT USING (owner_id = auth.uid() OR id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage their business" ON public.businesses FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- RLS for employee_tickets
CREATE POLICY "Users can view tickets in their business" ON public.employee_tickets FOR SELECT USING (employee_id IN (SELECT id FROM public.profiles WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Admins can manage tickets" ON public.employee_tickets FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can manage their own tickets" ON public.employee_tickets FOR ALL USING (employee_id = auth.uid()) WITH CHECK (employee_id = auth.uid());

-- RLS for crews
CREATE POLICY "Users can view crews in their business" ON public.crews FOR SELECT USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage crews" ON public.crews FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for crew_members
CREATE POLICY "Users can view crew members" ON public.crew_members FOR SELECT USING (crew_id IN (SELECT id FROM public.crews WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Admins can manage crew members" ON public.crew_members FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for equipment
CREATE POLICY "Users can view equipment in their business" ON public.equipment FOR SELECT USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage equipment" ON public.equipment FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for jobs
CREATE POLICY "Users can view jobs in their business" ON public.jobs FOR SELECT USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage jobs" ON public.jobs FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for job_equipment
CREATE POLICY "Users can view job equipment" ON public.job_equipment FOR SELECT USING (job_id IN (SELECT id FROM public.jobs WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Admins can manage job equipment" ON public.job_equipment FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for project_startup
CREATE POLICY "Users can view project startup" ON public.project_startup FOR SELECT USING (job_id IN (SELECT id FROM public.jobs WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Admins can manage project startup" ON public.project_startup FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for itp_templates
CREATE POLICY "Users can view itp templates" ON public.itp_templates FOR SELECT USING (business_id IS NULL OR business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage itp templates" ON public.itp_templates FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for job_itps
CREATE POLICY "Users can view job ITPs" ON public.job_itps FOR SELECT USING (job_id IN (SELECT id FROM public.jobs WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Staff can manage job ITPs" ON public.job_itps FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS for swms_templates
CREATE POLICY "Users can view swms templates" ON public.swms_templates FOR SELECT USING (business_id IS NULL OR business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage swms templates" ON public.swms_templates FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for job_swms
CREATE POLICY "Users can view job SWMS" ON public.job_swms FOR SELECT USING (job_id IN (SELECT id FROM public.jobs WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Staff can manage job SWMS" ON public.job_swms FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS for swms_signoffs
CREATE POLICY "Users can view swms signoffs" ON public.swms_signoffs FOR SELECT USING (swms_id IN (SELECT id FROM public.job_swms WHERE job_id IN (SELECT id FROM public.jobs WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()))));
CREATE POLICY "Users can sign swms" ON public.swms_signoffs FOR INSERT WITH CHECK (true);

-- RLS for concrete_tests
CREATE POLICY "Users can view concrete tests" ON public.concrete_tests FOR SELECT USING (job_id IN (SELECT id FROM public.jobs WHERE business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Staff can manage concrete tests" ON public.concrete_tests FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS for documents
CREATE POLICY "Users can view documents in their business" ON public.documents FOR SELECT USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Staff can upload documents" ON public.documents FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Admins can delete documents" ON public.documents FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Add foreign key for businesses
ALTER TABLE public.crews ADD CONSTRAINT crews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.equipment ADD CONSTRAINT equipment_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD CONSTRAINT documents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Insert default ITP templates
INSERT INTO public.itp_templates (name, itp_type, checklist_items, is_default) VALUES
('Formwork Inspection', 'formwork', '[
  {"id": "1", "item": "Formwork dimensions checked against drawings", "required": true},
  {"id": "2", "item": "Formwork is clean and free of debris", "required": true},
  {"id": "3", "item": "Release agent applied", "required": true},
  {"id": "4", "item": "Formwork securely braced", "required": true},
  {"id": "5", "item": "Joints sealed to prevent grout loss", "required": true},
  {"id": "6", "item": "Edge forms at correct level", "required": true}
]'::jsonb, true),
('Reinforcement Inspection', 'reinforcement', '[
  {"id": "1", "item": "Bar sizes as per drawings", "required": true},
  {"id": "2", "item": "Bar spacing as per drawings", "required": true},
  {"id": "3", "item": "Cover to reinforcement correct", "required": true},
  {"id": "4", "item": "Laps and anchorage as specified", "required": true},
  {"id": "5", "item": "Reinforcement clean and free of loose rust", "required": true},
  {"id": "6", "item": "Chairs and spacers adequate", "required": true}
]'::jsonb, true),
('Pre-Pour Inspection', 'pre_pour', '[
  {"id": "1", "item": "Subgrade preparation complete", "required": true},
  {"id": "2", "item": "Vapour barrier installed (if required)", "required": false},
  {"id": "3", "item": "Reinforcement inspection complete", "required": true},
  {"id": "4", "item": "Formwork inspection complete", "required": true},
  {"id": "5", "item": "Services cast-ins positioned correctly", "required": false},
  {"id": "6", "item": "Weather conditions suitable for pour", "required": true},
  {"id": "7", "item": "Concrete order confirmed", "required": true}
]'::jsonb, true),
('Post-Pour Inspection', 'post_pour', '[
  {"id": "1", "item": "Surface finish acceptable", "required": true},
  {"id": "2", "item": "Curing commenced as specified", "required": true},
  {"id": "3", "item": "Control joints cut (if required)", "required": false},
  {"id": "4", "item": "No visible cracking or defects", "required": true},
  {"id": "5", "item": "Edge protection in place", "required": false}
]'::jsonb, true);

-- Insert default SWMS template
INSERT INTO public.swms_templates (name, content, is_default) VALUES
('Concreting Works SWMS', '{
  "title": "Safe Work Method Statement - Concreting Works",
  "scope": "This SWMS covers all concreting operations including formwork, reinforcement placement, concrete placement, finishing, and curing.",
  "ppe_required": ["Safety boots", "High-vis vest", "Hard hat", "Safety glasses", "Gloves", "Long sleeves"],
  "hazards": [
    {
      "hazard": "Manual handling of materials",
      "risk": "High",
      "controls": ["Use mechanical aids where possible", "Team lift for heavy items", "Correct lifting technique"]
    },
    {
      "hazard": "Contact with wet concrete",
      "risk": "Medium",
      "controls": ["Wear appropriate PPE including gloves and gumboots", "Wash off contact immediately", "Use barrier cream"]
    },
    {
      "hazard": "Slips, trips and falls",
      "risk": "Medium",
      "controls": ["Keep work area tidy", "Clean spills immediately", "Wear appropriate footwear"]
    },
    {
      "hazard": "Concrete pump operations",
      "risk": "High",
      "controls": ["Exclusion zone around pump", "Communication with pump operator", "Secure pump line"]
    },
    {
      "hazard": "Working in heat",
      "risk": "Medium",
      "controls": ["Regular breaks", "Hydration", "Sun protection"]
    }
  ]
}'::jsonb, true);