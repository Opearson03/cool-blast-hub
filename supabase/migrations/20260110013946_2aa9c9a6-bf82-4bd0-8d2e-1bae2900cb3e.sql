-- Add quote branding settings to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS quote_template VARCHAR(20) DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS quote_primary_color VARCHAR(7) DEFAULT '#f97316',
ADD COLUMN IF NOT EXISTS quote_secondary_color VARCHAR(7) DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS quote_font VARCHAR(50) DEFAULT 'Arial';

-- Add constraint for valid templates
ALTER TABLE public.businesses
ADD CONSTRAINT businesses_quote_template_check 
CHECK (quote_template IN ('classic', 'modern', 'minimal'));