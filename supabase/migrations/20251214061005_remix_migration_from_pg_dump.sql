CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'staff'
);


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'contacted',
    'converted',
    'cancelled'
);


--
-- Name: customer_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.customer_type AS ENUM (
    'retail',
    'industrial'
);


--
-- Name: document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_type AS ENUM (
    'swms',
    'risk_assessment',
    'permit',
    'jsa',
    'other'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'cancelled'
);


--
-- Name: job_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.job_status AS ENUM (
    'quoted',
    'scheduled',
    'in_progress',
    'completed',
    'invoiced',
    'cancelled'
);


--
-- Name: job_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.job_type AS ENUM (
    'retail',
    'industrial'
);


--
-- Name: service_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_type AS ENUM (
    'industrial',
    'automotive',
    'restoration',
    'other'
);


--
-- Name: timesheet_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.timesheet_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected'
);


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;


--
-- Name: generate_job_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_job_number() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.job_number := 
    CASE NEW.job_type 
      WHEN 'retail' THEN 'RET-'
      WHEN 'industrial' THEN 'IND-'
    END || 
    TO_CHAR(NOW(), 'YYMM') || 
    LPAD(nextval('job_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: generate_swms_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_swms_number() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.swms_number := 'SWMS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('swms_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Use case-insensitive email comparison
  SELECT * INTO invite_record
  FROM public.pending_invites
  WHERE LOWER(email) = LOWER(NEW.email) AND accepted_at IS NULL;
  
  IF invite_record IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, invite_record.full_name);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invite_record.role);
    
    UPDATE public.pending_invites
    SET accepted_at = now()
    WHERE id = invite_record.id;
  ELSE
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'));
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: link_booking_to_customer(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.link_booking_to_customer() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  existing_customer_id UUID;
  new_customer_id UUID;
BEGIN
  -- Check if booking already has a customer_id
  IF NEW.customer_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Try to find existing customer by email or phone
  SELECT id INTO existing_customer_id
  FROM public.customers
  WHERE (email = NEW.email AND NEW.email IS NOT NULL)
     OR (phone = NEW.phone AND NEW.phone IS NOT NULL)
  LIMIT 1;

  -- If customer exists, link to booking
  IF existing_customer_id IS NOT NULL THEN
    NEW.customer_id := existing_customer_id;
  ELSE
    -- Create new customer from booking details
    INSERT INTO public.customers (
      contact_name,
      email,
      phone,
      customer_type,
      notes
    ) VALUES (
      NEW.name,
      NEW.email,
      NEW.phone,
      'retail',
      'Auto-created from website booking on ' || CURRENT_DATE
    )
    RETURNING id INTO new_customer_id;
    
    -- Link new customer to booking
    NEW.customer_id := new_customer_id;
  END IF;

  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    preferred_date date,
    service_type public.service_type NOT NULL,
    message text,
    status public.booking_status DEFAULT 'pending'::public.booking_status NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text,
    contact_name text NOT NULL,
    email text,
    phone text,
    address text,
    customer_type public.customer_type DEFAULT 'retail'::public.customer_type NOT NULL,
    notes text,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    amount numeric(10,2) GENERATED ALWAYS AS ((quantity * unit_price)) STORED,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: invoice_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_number_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid,
    customer_id uuid NOT NULL,
    invoice_number text NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 10,
    tax_amount numeric(10,2) GENERATED ALWAYS AS (((subtotal * tax_rate) / (100)::numeric)) STORED,
    total numeric(10,2) GENERATED ALWAYS AS ((subtotal * ((1)::numeric + (tax_rate / (100)::numeric)))) STORED,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    due_date date,
    paid_date date,
    xero_invoice_id text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: job_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    role_on_job text,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid
);


--
-- Name: job_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    booking_id uuid,
    job_number text,
    job_type public.job_type NOT NULL,
    title text NOT NULL,
    description text,
    status public.job_status DEFAULT 'quoted'::public.job_status NOT NULL,
    location text,
    scheduled_date date,
    scheduled_time time without time zone,
    completion_date date,
    estimated_hours numeric(6,2),
    actual_hours numeric(6,2),
    quoted_amount numeric(10,2),
    special_requirements text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deposit_required boolean DEFAULT false,
    deposit_amount numeric(10,2),
    deposit_percentage numeric(5,2),
    deposit_status text DEFAULT 'not_required'::text,
    deposit_paid_date date,
    deposit_payment_method text,
    deposit_reference text,
    deposit_notes text,
    stripe_payment_intent_id text,
    stripe_payment_link text,
    CONSTRAINT jobs_deposit_payment_method_check CHECK ((deposit_payment_method = ANY (ARRAY['cash'::text, 'bank_transfer'::text, 'eftpos'::text, 'card'::text, 'stripe'::text, 'other'::text]))),
    CONSTRAINT jobs_deposit_status_check CHECK ((deposit_status = ANY (ARRAY['not_required'::text, 'pending'::text, 'paid'::text, 'refunded'::text, 'waived'::text])))
);


--
-- Name: pending_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    full_name text NOT NULL,
    role public.app_role DEFAULT 'staff'::public.app_role NOT NULL,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    phone text,
    hourly_rate numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: safety_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safety_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid,
    document_type public.document_type NOT NULL,
    title text NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    expiry_date date,
    notes text,
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: swms_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swms_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid,
    swms_number text NOT NULL,
    title text NOT NULL,
    version integer DEFAULT 1,
    status text DEFAULT 'draft'::text,
    work_description text NOT NULL,
    location text,
    principal_contractor text,
    subcontractor text,
    high_risk_work_types jsonb DEFAULT '[]'::jsonb,
    valid_from date NOT NULL,
    valid_to date,
    review_date date,
    prepared_by uuid,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT swms_documents_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])))
);


--
-- Name: swms_emergency_procedures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swms_emergency_procedures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    swms_id uuid NOT NULL,
    emergency_type text NOT NULL,
    procedure text NOT NULL,
    emergency_contacts text,
    assembly_point text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: swms_hazards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swms_hazards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    swms_id uuid NOT NULL,
    step_number integer NOT NULL,
    work_activity text NOT NULL,
    hazard text NOT NULL,
    potential_harm text NOT NULL,
    likelihood text,
    consequence text,
    initial_risk_rating text,
    elimination_controls text,
    substitution_controls text,
    engineering_controls text,
    administrative_controls text,
    ppe_required text,
    residual_risk_rating text,
    responsible_person text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT swms_hazards_consequence_check CHECK ((consequence = ANY (ARRAY['insignificant'::text, 'minor'::text, 'moderate'::text, 'major'::text, 'catastrophic'::text]))),
    CONSTRAINT swms_hazards_likelihood_check CHECK ((likelihood = ANY (ARRAY['rare'::text, 'unlikely'::text, 'possible'::text, 'likely'::text, 'almost_certain'::text])))
);


--
-- Name: swms_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.swms_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: swms_signoffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swms_signoffs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    swms_id uuid NOT NULL,
    signer_name text NOT NULL,
    signer_role text,
    signature_data text,
    signed_at timestamp with time zone DEFAULT now(),
    acknowledged boolean DEFAULT true,
    staff_id uuid
);


--
-- Name: timesheets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timesheets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid NOT NULL,
    job_id uuid,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone,
    break_minutes integer DEFAULT 0,
    total_hours numeric(5,2) GENERATED ALWAYS AS (((EXTRACT(epoch FROM (end_time - start_time)) / (3600)::numeric) - ((break_minutes)::numeric / 60.0))) STORED,
    hourly_rate numeric(10,2),
    billable boolean DEFAULT true,
    notes text,
    status public.timesheet_status DEFAULT 'draft'::public.timesheet_status NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    edit_request text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: job_assignments job_assignments_job_id_staff_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_job_id_staff_id_key UNIQUE (job_id, staff_id);


--
-- Name: job_assignments job_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_job_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_job_number_key UNIQUE (job_number);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: pending_invites pending_invites_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_invites
    ADD CONSTRAINT pending_invites_email_unique UNIQUE (email);


--
-- Name: pending_invites pending_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_invites
    ADD CONSTRAINT pending_invites_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: safety_documents safety_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_documents
    ADD CONSTRAINT safety_documents_pkey PRIMARY KEY (id);


--
-- Name: swms_documents swms_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_documents
    ADD CONSTRAINT swms_documents_pkey PRIMARY KEY (id);


--
-- Name: swms_documents swms_documents_swms_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_documents
    ADD CONSTRAINT swms_documents_swms_number_key UNIQUE (swms_number);


--
-- Name: swms_emergency_procedures swms_emergency_procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_emergency_procedures
    ADD CONSTRAINT swms_emergency_procedures_pkey PRIMARY KEY (id);


--
-- Name: swms_hazards swms_hazards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_hazards
    ADD CONSTRAINT swms_hazards_pkey PRIMARY KEY (id);


--
-- Name: swms_signoffs swms_signoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_signoffs
    ADD CONSTRAINT swms_signoffs_pkey PRIMARY KEY (id);


--
-- Name: timesheets timesheets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_jobs_deposit_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jobs_deposit_status ON public.jobs USING btree (deposit_status);


--
-- Name: idx_swms_documents_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swms_documents_job_id ON public.swms_documents USING btree (job_id);


--
-- Name: idx_swms_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swms_documents_status ON public.swms_documents USING btree (status);


--
-- Name: idx_swms_documents_valid_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swms_documents_valid_to ON public.swms_documents USING btree (valid_to);


--
-- Name: swms_documents generate_swms_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_swms_number_trigger BEFORE INSERT ON public.swms_documents FOR EACH ROW WHEN (((new.swms_number IS NULL) OR (new.swms_number = ''::text))) EXECUTE FUNCTION public.generate_swms_number();


--
-- Name: bookings on_booking_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_booking_created BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.link_booking_to_customer();


--
-- Name: invoices set_invoice_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW WHEN ((new.invoice_number IS NULL)) EXECUTE FUNCTION public.generate_invoice_number();


--
-- Name: jobs set_job_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_job_number BEFORE INSERT ON public.jobs FOR EACH ROW WHEN ((new.job_number IS NULL)) EXECUTE FUNCTION public.generate_job_number();


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: job_assignments job_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);


--
-- Name: job_assignments job_assignments_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_assignments job_assignments_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_assignments
    ADD CONSTRAINT job_assignments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: jobs jobs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: pending_invites pending_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_invites
    ADD CONSTRAINT pending_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: safety_documents safety_documents_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_documents
    ADD CONSTRAINT safety_documents_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: safety_documents safety_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_documents
    ADD CONSTRAINT safety_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);


--
-- Name: swms_documents swms_documents_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_documents
    ADD CONSTRAINT swms_documents_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: swms_documents swms_documents_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_documents
    ADD CONSTRAINT swms_documents_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: swms_documents swms_documents_prepared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_documents
    ADD CONSTRAINT swms_documents_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES auth.users(id);


--
-- Name: swms_emergency_procedures swms_emergency_procedures_swms_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_emergency_procedures
    ADD CONSTRAINT swms_emergency_procedures_swms_id_fkey FOREIGN KEY (swms_id) REFERENCES public.swms_documents(id) ON DELETE CASCADE;


--
-- Name: swms_hazards swms_hazards_swms_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_hazards
    ADD CONSTRAINT swms_hazards_swms_id_fkey FOREIGN KEY (swms_id) REFERENCES public.swms_documents(id) ON DELETE CASCADE;


--
-- Name: swms_signoffs swms_signoffs_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_signoffs
    ADD CONSTRAINT swms_signoffs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.profiles(id);


--
-- Name: swms_signoffs swms_signoffs_swms_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swms_signoffs
    ADD CONSTRAINT swms_signoffs_swms_id_fkey FOREIGN KEY (swms_id) REFERENCES public.swms_documents(id) ON DELETE CASCADE;


--
-- Name: timesheets timesheets_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: timesheets timesheets_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: timesheets timesheets_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: swms_documents Admins can delete SWMS documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete SWMS documents" ON public.swms_documents FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Admins can delete bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: safety_documents Admins can delete documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete documents" ON public.safety_documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: jobs Admins can delete jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: timesheets Admins can delete timesheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete timesheets" ON public.timesheets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: swms_signoffs Admins can manage SWMS signoffs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage SWMS signoffs" ON public.swms_signoffs USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: job_assignments Admins can manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage assignments" ON public.job_assignments TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: customers Admins can manage customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage customers" ON public.customers TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: safety_documents Admins can manage documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage documents" ON public.safety_documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pending_invites Admins can manage invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage invites" ON public.pending_invites TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoice_items Admins can manage invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage invoice items" ON public.invoice_items TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: invoices Admins can manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage invoices" ON public.invoices TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Anyone can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: swms_signoffs Authenticated users can sign SWMS; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can sign SWMS" ON public.swms_signoffs FOR INSERT WITH CHECK (true);


--
-- Name: swms_documents Authenticated users can view SWMS documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view SWMS documents" ON public.swms_documents FOR SELECT USING (true);


--
-- Name: swms_hazards Authenticated users can view SWMS hazards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view SWMS hazards" ON public.swms_hazards FOR SELECT USING (true);


--
-- Name: swms_signoffs Authenticated users can view SWMS signoffs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view SWMS signoffs" ON public.swms_signoffs FOR SELECT USING (true);


--
-- Name: bookings Authenticated users can view bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view bookings" ON public.bookings FOR SELECT TO authenticated USING (true);


--
-- Name: customers Authenticated users can view customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);


--
-- Name: safety_documents Authenticated users can view documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view documents" ON public.safety_documents FOR SELECT TO authenticated USING (true);


--
-- Name: swms_emergency_procedures Authenticated users can view emergency procedures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view emergency procedures" ON public.swms_emergency_procedures FOR SELECT USING (true);


--
-- Name: invoice_items Authenticated users can view invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view invoice items" ON public.invoice_items FOR SELECT TO authenticated USING (true);


--
-- Name: invoices Authenticated users can view invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);


--
-- Name: jobs Authenticated users can view jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view jobs" ON public.jobs FOR SELECT TO authenticated USING (true);


--
-- Name: swms_documents Staff can create SWMS documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can create SWMS documents" ON public.swms_documents FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: jobs Staff can create jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can create jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: customers Staff can insert customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'staff'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: timesheets Staff can insert own timesheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert own timesheets" ON public.timesheets FOR INSERT TO authenticated WITH CHECK ((staff_id = auth.uid()));


--
-- Name: swms_hazards Staff can manage SWMS hazards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage SWMS hazards" ON public.swms_hazards USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: bookings Staff can manage bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage bookings" ON public.bookings FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: swms_emergency_procedures Staff can manage emergency procedures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage emergency procedures" ON public.swms_emergency_procedures USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: swms_documents Staff can update SWMS documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update SWMS documents" ON public.swms_documents FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: jobs Staff can update jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update jobs" ON public.jobs FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: timesheets Staff can update own draft timesheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update own draft timesheets" ON public.timesheets FOR UPDATE TO authenticated USING ((((staff_id = auth.uid()) AND (status = 'draft'::public.timesheet_status)) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: safety_documents Staff can upload documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can upload documents" ON public.safety_documents FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));


--
-- Name: timesheets Staff can view own timesheets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view own timesheets" ON public.timesheets FOR SELECT TO authenticated USING (((staff_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: pending_invites Users can check their own pending invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can check their own pending invites" ON public.pending_invites FOR SELECT TO anon USING ((accepted_at IS NULL));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid()));


--
-- Name: job_assignments Users can view relevant assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view relevant assignments" ON public.job_assignments FOR SELECT TO authenticated USING (((staff_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: job_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: safety_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.safety_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: swms_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.swms_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: swms_emergency_procedures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.swms_emergency_procedures ENABLE ROW LEVEL SECURITY;

--
-- Name: swms_hazards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.swms_hazards ENABLE ROW LEVEL SECURITY;

--
-- Name: swms_signoffs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.swms_signoffs ENABLE ROW LEVEL SECURITY;

--
-- Name: timesheets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


