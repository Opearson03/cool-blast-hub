import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

// Magic byte signatures
function detectFileType(bytes: Uint8Array): 'pdf' | 'png' | 'jpg' | null {
  if (bytes.length < 4) return null;
  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'pdf';
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpg';
  return null;
}

function bad(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return bad(405, 'Method not allowed');
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const formData = await req.formData();

    // Honeypot — bots fill this in; humans don't see it
    const honeypot = formData.get('website_url');
    if (honeypot && String(honeypot).trim() !== '') {
      // Pretend success so bots don't retry
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const businessAlias = String(formData.get('business') || '').trim().toLowerCase();
    const customerName = String(formData.get('name') || '').trim();
    const customerEmail = String(formData.get('email') || '').trim().toLowerCase();
    const customerPhone = String(formData.get('phone') || '').trim();
    const siteAddress = String(formData.get('site_address') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const file = formData.get('plan');

    // Basic validation
    if (!businessAlias || businessAlias.length > 64) return bad(400, 'Invalid business identifier');
    if (!customerName || customerName.length > 100) return bad(400, 'Name is required (max 100 chars)');
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || customerEmail.length > 255) {
      return bad(400, 'Valid email is required');
    }
    if (customerPhone && customerPhone.length > 30) return bad(400, 'Phone too long');
    if (!siteAddress || siteAddress.length > 300) return bad(400, 'Site address required (max 300 chars)');
    if (description.length > 2000) return bad(400, 'Description too long (max 2000 chars)');
    if (!file || !(file instanceof File)) return bad(400, 'Plan file is required');
    if (file.size === 0) return bad(400, 'Plan file is empty');
    if (file.size > MAX_FILE_BYTES) return bad(400, 'File exceeds 20MB limit');
    if (!ALLOWED_MIME.includes(file.type)) return bad(400, 'Only PDF, PNG, or JPG files are allowed');

    // Read file & verify magic bytes
    const arrayBuf = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    const detected = detectFileType(bytes);
    if (!detected) return bad(400, 'File content does not match an allowed type');

    // Look up business by inbound_email_alias
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, inbound_email_alias')
      .eq('inbound_email_alias', businessAlias)
      .maybeSingle();

    if (bizError) {
      console.error('Business lookup error:', bizError);
      return bad(500, 'Server error');
    }
    if (!business) return bad(404, 'Business not found');

    // Upload to test-documents bucket (matches existing pending_plans flow)
    const ext = detected === 'jpg' ? 'jpg' : detected;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || `plan.${ext}`;
    const storagePath = `${business.id}/widget-uploads/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('test-documents')
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return bad(500, 'Failed to store file');
    }

    const { data: publicUrlData } = supabase.storage
      .from('test-documents')
      .getPublicUrl(storagePath);

    const fileUrl = publicUrlData.publicUrl;

    // Insert into pending_plans
    const subject = `Quote Request from ${customerName} — ${siteAddress}`;
    const emailBody = [
      description || '(No project description provided)',
      '',
      `Phone: ${customerPhone || '(not provided)'}`,
      `Submitted via website widget on ${new Date().toISOString()}`,
    ].join('\n');

    const { error: insertError } = await supabase.from('pending_plans').insert({
      business_id: business.id,
      from_email: customerEmail,
      from_name: customerName,
      subject,
      email_body: emailBody,
      file_name: safeName,
      file_url: fileUrl,
      status: 'pending',
      extracted_data: {
        source: 'website_widget',
        client_name: customerName,
        site_address: siteAddress,
        phone: customerPhone || null,
      },
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return bad(500, 'Failed to record submission');
    }

    return new Response(
      JSON.stringify({ success: true, business_name: business.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return bad(500, 'Server error');
  }
});
