
-- ============================================
-- Enterprise Quote Pricing Config
-- ============================================
CREATE TABLE public.enterprise_quote_pricing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  integrations JSONB NOT NULL DEFAULT '[]'::jsonb,
  support_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  strategic_fees JSONB NOT NULL DEFAULT '[]'::jsonb,
  complexity_multipliers JSONB NOT NULL DEFAULT '{}'::jsonb,
  urgency_multipliers JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_assumptions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_quote_pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enterprise quote pricing"
ON public.enterprise_quote_pricing_config FOR SELECT
TO authenticated
USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can manage enterprise quote pricing"
ON public.enterprise_quote_pricing_config FOR ALL
TO authenticated
USING (public.is_pourhub_staff(auth.uid()))
WITH CHECK (public.is_pourhub_staff(auth.uid()));

CREATE TRIGGER update_enterprise_quote_pricing_config_updated_at
BEFORE UPDATE ON public.enterprise_quote_pricing_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Enterprise Quotes
-- ============================================
CREATE TABLE public.enterprise_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,

  -- Client details
  client_name TEXT NOT NULL,
  business_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  team_size INTEGER,
  crew_count INTEGER,
  concurrent_jobs INTEGER,
  region TEXT,
  meeting_notes TEXT,

  -- Selections (snapshot at save time)
  selected_tier JSONB,
  selected_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_integrations JSONB NOT NULL DEFAULT '[]'::jsonb,
  complexity_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  strategic_fees JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_support JSONB,

  -- Calculated totals (snapshot)
  base_subtotal_low NUMERIC NOT NULL DEFAULT 0,
  base_subtotal_high NUMERIC NOT NULL DEFAULT 0,
  modules_subtotal NUMERIC NOT NULL DEFAULT 0,
  integrations_subtotal NUMERIC NOT NULL DEFAULT 0,
  strategic_fees_total NUMERIC NOT NULL DEFAULT 0,
  complexity_multiplier NUMERIC NOT NULL DEFAULT 1,
  urgency_multiplier NUMERIC NOT NULL DEFAULT 1,
  estimate_low NUMERIC NOT NULL DEFAULT 0,
  estimate_high NUMERIC NOT NULL DEFAULT 0,
  recommended_quote NUMERIC NOT NULL DEFAULT 0,
  monthly_support NUMERIC NOT NULL DEFAULT 0,

  -- Internal
  profit_margin_pct NUMERIC,
  estimated_hours NUMERIC,
  confidence_rating TEXT DEFAULT 'medium',
  internal_notes TEXT,

  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage enterprise quotes"
ON public.enterprise_quotes FOR ALL
TO authenticated
USING (public.is_pourhub_staff(auth.uid()))
WITH CHECK (public.is_pourhub_staff(auth.uid()));

CREATE TRIGGER update_enterprise_quotes_updated_at
BEFORE UPDATE ON public.enterprise_quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_enterprise_quotes_created_at ON public.enterprise_quotes(created_at DESC);
CREATE INDEX idx_enterprise_quotes_status ON public.enterprise_quotes(status);

-- ============================================
-- Enterprise Quote Templates
-- ============================================
CREATE TABLE public.enterprise_quote_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tier_key TEXT,
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  integrations JSONB NOT NULL DEFAULT '[]'::jsonb,
  support_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view enterprise quote templates"
ON public.enterprise_quote_templates FOR SELECT
TO authenticated
USING (public.is_pourhub_staff(auth.uid()));

CREATE POLICY "Staff can manage enterprise quote templates"
ON public.enterprise_quote_templates FOR ALL
TO authenticated
USING (public.is_pourhub_staff(auth.uid()))
WITH CHECK (public.is_pourhub_staff(auth.uid()));

CREATE TRIGGER update_enterprise_quote_templates_updated_at
BEFORE UPDATE ON public.enterprise_quote_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Seed pricing config (single row)
-- ============================================
INSERT INTO public.enterprise_quote_pricing_config (
  tiers, modules, integrations, support_plans, strategic_fees,
  complexity_multipliers, urgency_multipliers, default_assumptions
) VALUES (
  -- tiers
  '[
    {"key":"starter","name":"Enterprise Starter","price_low":25000,"price_high":40000,"description":"Core platform setup for growing operators"},
    {"key":"standard","name":"Enterprise Standard","price_low":45000,"price_high":75000,"description":"Full PourHub deployment with multi-site support"},
    {"key":"custom","name":"Enterprise Custom Build","price_low":80000,"price_high":150000,"description":"Bespoke build with custom modules and integrations"}
  ]'::jsonb,
  -- modules
  '[
    {"key":"estimating_scale","name":"Estimating at scale","price":6000,"description":"Multi-user takeoff, batch estimates"},
    {"key":"multi_site_scheduling","name":"Multi-site scheduling","price":7500,"description":"Cross-region pour & crew calendar"},
    {"key":"plant_vehicle_tracking","name":"Plant & vehicle tracking","price":5500,"description":"Live fleet tracking and utilisation"},
    {"key":"tool_equipment_logs","name":"Tool / equipment logs","price":3500,"description":"Service history, allocations, QR check-in"},
    {"key":"testing_itp","name":"Concrete testing & ITP compliance","price":6500,"description":"Test results, lab matching, ITP workflows"},
    {"key":"subbie_marketplace","name":"Subbie marketplace integration","price":5000,"description":"Direct subcontractor invites and bookings"},
    {"key":"custom_dashboards","name":"Custom dashboards & reporting","price":7000,"description":"Tailored KPI dashboards and exports"},
    {"key":"white_label_portal","name":"White-label client portal","price":8500,"description":"Branded client-facing job portal"},
    {"key":"mobile_crew_app","name":"Mobile crew app","price":6000,"description":"On-site iOS/Android crew workflows"},
    {"key":"document_management","name":"Document management","price":4000,"description":"Plans, RFIs, drawings versioning"},
    {"key":"safety_swms","name":"Safety / SWMS module","price":4500,"description":"SWMS templates, sign-on, compliance log"}
  ]'::jsonb,
  -- integrations
  '[
    {"key":"xero","name":"Xero","price_simple":2500,"price_moderate":5000,"price_advanced":9000},
    {"key":"myob","name":"MYOB","price_simple":2500,"price_moderate":5000,"price_advanced":9000},
    {"key":"quickbooks","name":"QuickBooks","price_simple":2500,"price_moderate":5000,"price_advanced":9000},
    {"key":"teams","name":"Microsoft Teams","price_simple":1500,"price_moderate":3500,"price_advanced":6000},
    {"key":"procore","name":"Procore","price_simple":4000,"price_moderate":8000,"price_advanced":14000},
    {"key":"aconex","name":"Aconex","price_simple":4000,"price_moderate":8000,"price_advanced":14000},
    {"key":"boral_connect","name":"Boral Connect","price_simple":3500,"price_moderate":7000,"price_advanced":12000},
    {"key":"heidelberg_hub","name":"Heidelberg Hub","price_simple":3500,"price_moderate":7000,"price_advanced":12000},
    {"key":"employment_hero","name":"Employment Hero","price_simple":2500,"price_moderate":5000,"price_advanced":9000},
    {"key":"connecteam","name":"Connecteam","price_simple":2000,"price_moderate":4500,"price_advanced":8000},
    {"key":"deputy","name":"Deputy","price_simple":2000,"price_moderate":4500,"price_advanced":8000},
    {"key":"dropbox","name":"Dropbox","price_simple":1500,"price_moderate":3000,"price_advanced":5500},
    {"key":"custom_erp","name":"Custom ERP","price_simple":6000,"price_moderate":12000,"price_advanced":22000}
  ]'::jsonb,
  -- support plans
  '[
    {"key":"standard","name":"Standard Support","price":1500,"description":"Business hours email + ticket support"},
    {"key":"premium","name":"Premium Support","price":3000,"description":"Priority response, dedicated success manager"},
    {"key":"white_glove","name":"White-glove Support","price":5000,"description":"24/7 SLA, on-site visits, custom training"}
  ]'::jsonb,
  -- strategic fees
  '[
    {"key":"discovery","name":"Discovery & scoping","price":4500},
    {"key":"data_migration","name":"Data migration","price":6000,"price_high":15000},
    {"key":"onboarding_training","name":"Onboarding & training","price":3500},
    {"key":"branding_pack","name":"Custom branding pack","price":2500}
  ]'::jsonb,
  -- multipliers
  '{"low":1.0,"medium":1.25,"high":1.5}'::jsonb,
  '{"standard":1.0,"fast_track":1.2,"rush":1.4}'::jsonb,
  'Quotes are indicative based on scope captured during discovery. Final pricing confirmed after technical review. Excludes third-party licence fees and travel.'
);

-- ============================================
-- Seed templates
-- ============================================
INSERT INTO public.enterprise_quote_templates (name, description, tier_key, modules, integrations, support_key) VALUES
(
  'Mid-size 50-crew commercial',
  'Standard tier for mid-sized commercial concreters with multi-crew operations',
  'standard',
  '["estimating_scale","multi_site_scheduling","testing_itp","mobile_crew_app","safety_swms"]'::jsonb,
  '[{"key":"xero","complexity":"moderate"},{"key":"teams","complexity":"simple"}]'::jsonb,
  'premium'
),
(
  'Multi-state operator',
  'Custom build for large-scale multi-state operators with full integration suite',
  'custom',
  '["estimating_scale","multi_site_scheduling","plant_vehicle_tracking","testing_itp","subbie_marketplace","custom_dashboards","white_label_portal","mobile_crew_app","document_management","safety_swms"]'::jsonb,
  '[{"key":"xero","complexity":"advanced"},{"key":"procore","complexity":"moderate"},{"key":"boral_connect","complexity":"moderate"},{"key":"heidelberg_hub","complexity":"moderate"},{"key":"employment_hero","complexity":"moderate"}]'::jsonb,
  'white_glove'
);
