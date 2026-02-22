import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  type: 'quote' | 'variation';
  token: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, token }: ValidateRequest = await req.json();

    if (!type || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing type or token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (type === 'quote') {
      // Fetch estimate by signing token
      const { data: estimate, error } = await supabase
        .from('estimates')
        .select(`
          id,
          estimate_number,
          client_name,
          client_email,
          site_address,
          description,
          total_amount,
          notes,
          valid_until,
          signed_at,
          signing_token_expires_at,
          business_id,
          scope_data,
          businesses (
            name,
            address,
            phone,
            email,
            abn,
            logo_url,
            quote_primary_color,
            quote_secondary_color,
            quote_font
          )
        `)
        .eq('signing_token', token)
        .single();

      if (error || !estimate) {
        console.error('Token lookup error:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired signing link' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already signed
      if (estimate.signed_at) {
        return new Response(
          JSON.stringify({ 
            error: 'This quote has already been signed',
            signed: true,
            signedAt: estimate.signed_at
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiry
      if (estimate.signing_token_expires_at && new Date(estimate.signing_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'This signing link has expired. Please contact the business for a new link.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const business = estimate.businesses as any;
      const scopeData = (estimate.scope_data || {}) as Record<string, any>;
      const quotePurpose = scopeData.quote_purpose || 'new_job';
      const targetJobId = scopeData.target_job_id || null;

      // If variation, fetch job name
      let targetJobName: string | null = null;
      if (quotePurpose === 'variation' && targetJobId) {
        const { data: job } = await supabase
          .from('jobs')
          .select('name, job_number')
          .eq('id', targetJobId)
          .single();
        if (job) {
          targetJobName = job.job_number ? `${job.job_number} - ${job.name}` : job.name;
        }
      }

      return new Response(
        JSON.stringify({
          valid: true,
          type: 'quote',
          data: {
            estimateNumber: estimate.estimate_number,
            clientName: estimate.client_name,
            siteAddress: estimate.site_address,
            description: estimate.description,
            totalAmount: estimate.total_amount,
            notes: estimate.notes,
            validUntil: estimate.valid_until,
            quotePurpose,
            targetJobName,
            business: {
              name: business?.name,
              address: business?.address,
              phone: business?.phone,
              email: business?.email,
              logoUrl: business?.logo_url,
              primaryColor: business?.quote_primary_color || '#1a1a1a',
              secondaryColor: business?.quote_secondary_color || '#f5f5f5',
              font: business?.quote_font || 'Inter'
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'variation') {
      // Fetch variation by signing token
      const { data: variation, error } = await supabase
        .from('job_variations')
        .select(`
          id,
          variation_number,
          description,
          reason,
          items,
          amount,
          days_extension,
          notes,
          signed_at,
          signing_token_expires_at,
          job_id,
          jobs (
            id,
            name,
            job_number,
            site_address,
            builder_client,
            business_id,
            businesses (
              name,
              address,
              phone,
              email,
              abn,
              logo_url,
              quote_primary_color,
              quote_secondary_color,
              quote_font
            )
          )
        `)
        .eq('signing_token', token)
        .single();

      if (error || !variation) {
        console.error('Token lookup error:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired signing link' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already signed
      if (variation.signed_at) {
        return new Response(
          JSON.stringify({ 
            error: 'This variation has already been approved',
            signed: true,
            signedAt: variation.signed_at
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiry
      if (variation.signing_token_expires_at && new Date(variation.signing_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'This signing link has expired. Please contact the business for a new link.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const job = variation.jobs as any;
      const business = job?.businesses as any;

      return new Response(
        JSON.stringify({
          valid: true,
          type: 'variation',
          data: {
            variationNumber: variation.variation_number,
            description: variation.description,
            reason: variation.reason,
            items: variation.items,
            amount: variation.amount,
            daysExtension: variation.days_extension,
            notes: variation.notes,
            job: {
              name: job?.name,
              jobNumber: job?.job_number,
              siteAddress: job?.site_address,
              clientName: job?.builder_client
            },
            business: {
              name: business?.name,
              address: business?.address,
              phone: business?.phone,
              email: business?.email,
              logoUrl: business?.logo_url,
              primaryColor: business?.quote_primary_color || '#1a1a1a',
              secondaryColor: business?.quote_secondary_color || '#f5f5f5',
              font: business?.quote_font || 'Inter'
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid document type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating token:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to validate signing link' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
