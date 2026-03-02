
-- xero_connections: one row per business storing OAuth tokens
CREATE TABLE public.xero_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  xero_tenant_id text,
  xero_org_name text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  scope text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.xero_connections ENABLE ROW LEVEL SECURITY;

-- Admins can SELECT their own business connection
CREATE POLICY "Business admin can view own xero connection"
  ON public.xero_connections FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Admins can DELETE their own business connection
CREATE POLICY "Business admin can delete own xero connection"
  ON public.xero_connections FOR DELETE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Service role handles INSERT/UPDATE (edge functions)

-- xero_sync_log: tracks what has been pushed to Xero
CREATE TABLE public.xero_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  xero_invoice_id text,
  xero_invoice_number text,
  xero_contact_id text,
  xero_status text,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.xero_sync_log ENABLE ROW LEVEL SECURITY;

-- Business-scoped SELECT
CREATE POLICY "Business members can view own xero sync log"
  ON public.xero_sync_log FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()));

-- Service role handles INSERT/UPDATE (edge functions)

-- Trigger for updated_at on xero_connections
CREATE TRIGGER update_xero_connections_updated_at
  BEFORE UPDATE ON public.xero_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
