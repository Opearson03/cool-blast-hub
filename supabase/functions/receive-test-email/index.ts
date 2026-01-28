import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-resend-signature',
};

interface ResendAttachment {
  filename: string;
  content_type: string;
  content: string; // base64 encoded
}

interface ResendEmailEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: ResendAttachment[];
  };
}

type DocumentType = 'test_result' | 'delivery_docket' | 'unknown';

// Keywords for document type detection
const TEST_RESULT_KEYWORDS = ['test', 'lab', 'result', 'mpa', 'strength', 'cylinder', 'slump', '7 day', '28 day', '7-day', '28-day', 'compressive'];
const DELIVERY_DOCKET_KEYWORDS = ['docket', 'delivery', 'cartage', 'truck', 'load', 'batch', 'dispatch', 'concrete delivery'];

function detectDocumentType(subject: string, filename: string, fromEmail: string): DocumentType {
  const searchText = `${subject} ${filename} ${fromEmail}`.toLowerCase();
  
  // Check for delivery docket keywords first (more specific)
  for (const keyword of DELIVERY_DOCKET_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 'delivery_docket';
    }
  }
  
  // Check for test result keywords
  for (const keyword of TEST_RESULT_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 'test_result';
    }
  }
  
  // Default to test result if PDF attached (legacy behavior)
  return 'test_result';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload
    const payload: ResendEmailEvent = await req.json();
    
    console.log('Received email webhook:', {
      type: payload.type,
      from: payload.data?.from,
      to: payload.data?.to,
      subject: payload.data?.subject,
      attachmentCount: payload.data?.attachments?.length || 0
    });

    // Only process email.received events
    if (payload.type !== 'email.received') {
      console.log('Ignoring non-email.received event:', payload.type);
      return new Response(
        JSON.stringify({ success: true, message: 'Event type ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { from, to, subject, attachments } = payload.data;

    // Extract the alias from the recipient email (e.g., "mullinsconcrete" from "mullinsconcrete@pourhub.au")
    const recipientEmail = to?.[0];
    if (!recipientEmail) {
      console.error('No recipient email found');
      return new Response(
        JSON.stringify({ success: false, error: 'No recipient email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the alias from the email (before @pourhub.au)
    const aliasMatch = recipientEmail.toLowerCase().match(/^([a-z0-9_-]+)@pourhub\.au$/);
    if (!aliasMatch) {
      console.error('Invalid recipient format:', recipientEmail);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid recipient email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const alias = aliasMatch[1];
    console.log('Looking up business with alias:', alias);

    // Look up the business by alias
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('inbound_email_alias', alias)
      .single();

    if (businessError || !business) {
      console.error('Business not found for alias:', alias, businessError);
      return new Response(
        JSON.stringify({ success: false, error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found business:', business.name, business.id);

    // Filter for PDF attachments
    const pdfAttachments = attachments?.filter(
      att => att.content_type === 'application/pdf' && att.content
    ) || [];

    if (pdfAttachments.length === 0) {
      console.log('No PDF attachments found, creating record without document');
      
      // Still create a pending result record even without PDF
      const { error: insertError } = await supabase
        .from('pending_test_results')
        .insert({
          business_id: business.id,
          from_email: from,
          subject: subject || '(No subject)',
          received_at: new Date().toISOString(),
          extracted_data: { note: 'No PDF attachment found in email' },
          status: 'pending'
        });

      if (insertError) {
        console.error('Failed to insert pending result:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Email received but no PDF attachments' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each PDF attachment
    const results = [];
    
    for (const attachment of pdfAttachments) {
      try {
        console.log('Processing attachment:', attachment.filename);

        // Detect document type based on subject, filename, and sender
        const documentType = detectDocumentType(subject || '', attachment.filename, from);
        console.log('Detected document type:', documentType);

        // Decode base64 content
        const pdfContent = Uint8Array.from(atob(attachment.content), c => c.charCodeAt(0));
        
        // Check file size (max 10MB)
        if (pdfContent.length > 10 * 1024 * 1024) {
          console.warn('Attachment too large:', attachment.filename);
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const safeFilename = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const folderPrefix = documentType === 'delivery_docket' ? 'dockets' : 'tests';
        const storagePath = `${business.id}/inbound/${folderPrefix}/${timestamp}_${safeFilename}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('test-documents')
          .upload(storagePath, pdfContent, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('test-documents')
          .getPublicUrl(storagePath);

        const fileUrl = urlData.publicUrl;
        console.log('Uploaded to:', fileUrl);

        if (documentType === 'delivery_docket') {
          // Process as delivery docket
          let extractedData = {};
          
          // Try to extract docket data using scan-test-document (reuse for now)
          try {
            const scanResponse = await fetch(`${supabaseUrl}/functions/v1/scan-test-document`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                pdfUrl: fileUrl,
                documentType: 'delivery_docket'
              })
            });

            if (scanResponse.ok) {
              const scanResult = await scanResponse.json();
              if (scanResult.success && scanResult.data) {
                extractedData = scanResult.data;
                console.log('Extracted docket data:', extractedData);
              }
            } else {
              console.warn('Scan failed:', await scanResponse.text());
            }
          } catch (scanError) {
            console.error('Error calling scan-test-document:', scanError);
          }

          // Create pending document record
          const { data: pendingDoc, error: insertError } = await supabase
            .from('pending_documents')
            .insert({
              business_id: business.id,
              from_email: from,
              subject: subject || '(No subject)',
              received_at: new Date().toISOString(),
              file_url: fileUrl,
              file_name: attachment.filename,
              extracted_data: extractedData,
              document_type: 'delivery_docket',
              status: 'pending'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to insert pending document:', insertError);
            continue;
          }

          results.push({
            filename: attachment.filename,
            id: pendingDoc.id,
            type: 'delivery_docket',
            success: true
          });

          console.log('Created pending document:', pendingDoc.id);

        } else {
          // Process as test result (existing behavior)
          let extractedData = {};
          try {
            const scanResponse = await fetch(`${supabaseUrl}/functions/v1/scan-test-document`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ pdfUrl: fileUrl })
            });

            if (scanResponse.ok) {
              const scanResult = await scanResponse.json();
              if (scanResult.success && scanResult.data) {
                extractedData = scanResult.data;
                console.log('Extracted data:', extractedData);
              }
            } else {
              console.warn('Scan failed:', await scanResponse.text());
            }
          } catch (scanError) {
            console.error('Error calling scan-test-document:', scanError);
          }

          // Create pending test result record
          const { data: pendingResult, error: insertError } = await supabase
            .from('pending_test_results')
            .insert({
              business_id: business.id,
              from_email: from,
              subject: subject || '(No subject)',
              received_at: new Date().toISOString(),
              lab_report_url: fileUrl,
              extracted_data: extractedData,
              status: 'pending'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to insert pending result:', insertError);
            continue;
          }

          results.push({
            filename: attachment.filename,
            id: pendingResult.id,
            type: 'test_result',
            success: true
          });

          console.log('Created pending test result:', pendingResult.id);
        }

      } catch (attError) {
        console.error('Error processing attachment:', attachment.filename, attError);
        results.push({
          filename: attachment.filename,
          success: false,
          error: attError instanceof Error ? attError.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${results.length} attachments`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing email webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
