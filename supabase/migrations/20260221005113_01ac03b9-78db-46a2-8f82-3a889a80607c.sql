
-- =============================================
-- CRM LEADS TABLE
-- =============================================
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  source TEXT DEFAULT 'manual',
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crm_leads_email_unique UNIQUE (email)
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all leads"
  ON public.crm_leads FOR SELECT
  TO authenticated
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can insert leads"
  ON public.crm_leads FOR INSERT
  TO authenticated
  WITH CHECK (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can update leads"
  ON public.crm_leads FOR UPDATE
  TO authenticated
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can delete leads"
  ON public.crm_leads FOR DELETE
  TO authenticated
  USING (public.is_pourhub_staff(auth.uid()));

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CRM EMAIL CAMPAIGNS TABLE
-- =============================================
CREATE TABLE public.crm_email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  recipient_count INTEGER DEFAULT 0,
  filter_type TEXT DEFAULT 'selected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view campaigns"
  ON public.crm_email_campaigns FOR SELECT
  TO authenticated
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can insert campaigns"
  ON public.crm_email_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_pourhub_staff(auth.uid()));

-- =============================================
-- CRM EMAIL RECIPIENTS TABLE
-- =============================================
CREATE TABLE public.crm_email_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.crm_email_campaigns(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL,
  contact_id UUID NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  resend_email_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view recipients"
  ON public.crm_email_recipients FOR SELECT
  TO authenticated
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can insert recipients"
  ON public.crm_email_recipients FOR INSERT
  TO authenticated
  WITH CHECK (public.is_pourhub_staff(auth.uid()));

-- =============================================
-- CRM INBOX TABLE
-- =============================================
CREATE TABLE public.crm_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  in_reply_to_campaign_id UUID REFERENCES public.crm_email_campaigns(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  staff_reply TEXT,
  staff_replied_at TIMESTAMPTZ
);

ALTER TABLE public.crm_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view inbox"
  ON public.crm_inbox FOR SELECT
  TO authenticated
  USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can update inbox"
  ON public.crm_inbox FOR UPDATE
  TO authenticated
  USING (public.is_pourhub_staff(auth.uid()));

-- Allow service role inserts from webhook (no auth policy needed for anon/service)
CREATE POLICY "Service can insert inbox"
  ON public.crm_inbox FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_inbox;

-- =============================================
-- GET CRM CONTACTS RPC
-- =============================================
CREATE OR REPLACE FUNCTION public.get_crm_contacts(_filter TEXT DEFAULT 'all')
RETURNS TABLE(
  contact_type TEXT,
  contact_id UUID,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  source_detail TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  -- Leads
  SELECT
    'lead'::TEXT,
    l.id,
    l.email,
    l.full_name,
    l.company_name,
    l.phone,
    COALESCE(l.source, 'manual')::TEXT,
    l.created_at
  FROM public.crm_leads l
  WHERE _filter IN ('all', 'leads')

  UNION ALL

  -- Waitlist
  SELECT
    'waitlist'::TEXT,
    w.id,
    w.email::TEXT,
    w.full_name::TEXT,
    w.business_name::TEXT,
    w.phone::TEXT,
    COALESCE(w.outreach_status, 'pending')::TEXT,
    w.created_at
  FROM public.waiting_list w
  WHERE _filter IN ('all', 'waitlist')

  UNION ALL

  -- Users
  SELECT
    'user'::TEXT,
    p.id,
    au.email::TEXT,
    p.full_name::TEXT,
    b.name::TEXT,
    b.phone::TEXT,
    COALESCE(bs.status, 'none')::TEXT,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.businesses b ON p.business_id = b.id
  LEFT JOIN public.business_subscriptions bs ON b.id = bs.business_id
  WHERE _filter IN ('all', 'users')

  ORDER BY created_at DESC;
END;
$$;

-- =============================================
-- IMPORT CRM LEADS RPC
-- =============================================
CREATE OR REPLACE FUNCTION public.import_crm_leads(_leads JSONB)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INTEGER;
  inserted_count INTEGER;
BEGIN
  IF NOT public.is_pourhub_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  total_count := jsonb_array_length(_leads);

  WITH inserted AS (
    INSERT INTO public.crm_leads (email, full_name, company_name, phone, source, tags, notes)
    SELECT
      (item->>'email')::TEXT,
      (item->>'full_name')::TEXT,
      (item->>'company_name')::TEXT,
      (item->>'phone')::TEXT,
      COALESCE((item->>'source')::TEXT, 'csv_import'),
      CASE WHEN item->'tags' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(item->'tags'))
        ELSE NULL
      END,
      (item->>'notes')::TEXT
    FROM jsonb_array_elements(_leads) AS item
    WHERE (item->>'email') IS NOT NULL AND (item->>'email') != ''
    ON CONFLICT (email) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;

  RETURN json_build_object(
    'total', total_count,
    'inserted', inserted_count,
    'skipped', total_count - inserted_count
  );
END;
$$;
