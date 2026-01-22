import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitSignatureRequest {
  type: 'quote' | 'variation';
  token: string;
  signature: string; // Base64 image data
  signerName: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, token, signature, signerName }: SubmitSignatureRequest = await req.json();

    if (!type || !token || !signature || !signerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const now = new Date().toISOString();

    if (type === 'quote') {
      // Validate token and check it hasn't been used
      const { data: estimate, error: fetchError } = await supabase
        .from('estimates')
        .select(`
          id,
          estimate_number,
          client_name,
          site_address,
          total_amount,
          signed_at,
          signing_token_expires_at,
          business_id,
          businesses (
            name,
            email
          )
        `)
        .eq('signing_token', token)
        .single();

      if (fetchError || !estimate) {
        console.error('Token lookup error:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Invalid signing link' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (estimate.signed_at) {
        return new Response(
          JSON.stringify({ error: 'This quote has already been signed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (estimate.signing_token_expires_at && new Date(estimate.signing_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'This signing link has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update estimate with signature
      const { error: updateError } = await supabase
        .from('estimates')
        .update({
          client_signature: signature,
          client_signature_name: signerName,
          signed_at: now,
          status: 'accepted',
          signing_token_expires_at: now // Invalidate token
        })
        .eq('id', estimate.id);

      if (updateError) {
        console.error('Failed to save signature:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save signature' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send notification email to business
      const business = estimate.businesses as any;
      if (resend && business?.email) {
        try {
          await resend.emails.send({
            from: 'PourHub <notifications@pourhub.com.au>',
            to: business.email,
            subject: `Quote ${estimate.estimate_number} Signed by ${signerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Quote Accepted! 🎉</h2>
                <p>Great news! Your quote has been signed and accepted.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Quote Number:</strong> ${estimate.estimate_number}</p>
                  <p><strong>Client:</strong> ${estimate.client_name}</p>
                  <p><strong>Site:</strong> ${estimate.site_address || 'Not specified'}</p>
                  <p><strong>Amount:</strong> $${Number(estimate.total_amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
                  <p><strong>Signed By:</strong> ${signerName}</p>
                  <p><strong>Signed At:</strong> ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</p>
                </div>
                <p>Log in to PourHub to view the signed document and convert it to a job.</p>
              </div>
            `
          });
          console.log('Notification email sent to business');
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
          // Don't fail the request if email fails
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Quote signed successfully',
          documentNumber: estimate.estimate_number
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'variation') {
      // Validate token
      const { data: variation, error: fetchError } = await supabase
        .from('job_variations')
        .select(`
          id,
          variation_number,
          description,
          amount,
          signed_at,
          signing_token_expires_at,
          job_id,
          jobs (
            name,
            builder_client,
            business_id,
            businesses (
              name,
              email
            )
          )
        `)
        .eq('signing_token', token)
        .single();

      if (fetchError || !variation) {
        console.error('Token lookup error:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Invalid signing link' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (variation.signed_at) {
        return new Response(
          JSON.stringify({ error: 'This variation has already been approved' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (variation.signing_token_expires_at && new Date(variation.signing_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'This signing link has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update variation with signature
      const { error: updateError } = await supabase
        .from('job_variations')
        .update({
          client_signature: signature,
          client_signature_name: signerName,
          signed_at: now,
          approved_at: now,
          approved_by: signerName,
          status: 'approved',
          signing_token_expires_at: now // Invalidate token
        })
        .eq('id', variation.id);

      if (updateError) {
        console.error('Failed to save signature:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save signature' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send notification email to business
      const job = variation.jobs as any;
      const business = job?.businesses as any;
      if (resend && business?.email) {
        try {
          await resend.emails.send({
            from: 'PourHub <notifications@pourhub.com.au>',
            to: business.email,
            subject: `Variation ${variation.variation_number} Approved by ${signerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Variation Approved! ✅</h2>
                <p>A variation has been approved by the client.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Variation Number:</strong> ${variation.variation_number}</p>
                  <p><strong>Job:</strong> ${job?.name || 'N/A'}</p>
                  <p><strong>Description:</strong> ${variation.description}</p>
                  <p><strong>Amount:</strong> $${Number(variation.amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })} + GST</p>
                  <p><strong>Approved By:</strong> ${signerName}</p>
                  <p><strong>Approved At:</strong> ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</p>
                </div>
                <p>Log in to PourHub to view the approved variation.</p>
              </div>
            `
          });
          console.log('Notification email sent to business');
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Variation approved successfully',
          documentNumber: variation.variation_number
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid document type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error submitting signature:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit signature' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
