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

interface Job {
  id: string;
  site_address: string;
  name: string;
}

interface Pour {
  id: string;
  job_id: string;
  pour_date: string | null;
}

type DocumentType = 'test_result' | 'delivery_docket' | 'unknown';
type MatchStatus = 'pending' | 'job_matched' | 'auto_matched';

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

// Normalize address for fuzzy matching
function normalizeAddress(addr: string): string {
  if (!addr) return '';
  return addr
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bstreet\b/gi, 'st')
    .replace(/\bst\b/gi, 'st')
    .replace(/\broad\b/gi, 'rd')
    .replace(/\brd\b/gi, 'rd')
    .replace(/\bavenue\b/gi, 'ave')
    .replace(/\bave\b/gi, 'ave')
    .replace(/\bdrive\b/gi, 'dr')
    .replace(/\bdr\b/gi, 'dr')
    .replace(/\bcourt\b/gi, 'ct')
    .replace(/\bct\b/gi, 'ct')
    .replace(/\bplace\b/gi, 'pl')
    .replace(/\bpl\b/gi, 'pl')
    .replace(/\blane\b/gi, 'ln')
    .replace(/\bln\b/gi, 'ln')
    .trim();
}

// Calculate match confidence between two addresses
function matchAddresses(extracted: string, jobAddress: string): number {
  const a = normalizeAddress(extracted);
  const b = normalizeAddress(jobAddress);
  
  if (!a || !b) return 0;
  
  // Exact match
  if (a === b) return 100;
  
  // One contains the other
  if (a.includes(b) || b.includes(a)) return 85;
  
  // Word overlap calculation
  const aWords = a.split(' ').filter(w => w.length > 2);
  const bWords = b.split(' ').filter(w => w.length > 2);
  const overlap = aWords.filter(w => bWords.includes(w)).length;
  
  if (overlap === 0) return 0;
  
  const score = (overlap / Math.max(aWords.length, bWords.length)) * 100;
  return Math.round(score);
}

// Check if two dates are within a day window
function datesMatch(extractedDate: string | null, pourDate: string | null, windowDays: number = 2): boolean {
  if (!extractedDate || !pourDate) return false;
  
  try {
    const d1 = new Date(extractedDate);
    const d2 = new Date(pourDate);
    const diffMs = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= windowDays;
  } catch {
    return false;
  }
}

// Find the best matching job and pour for extracted data
// SIMPLIFIED LOGIC: Only auto-assign when there's exactly ONE job match AND a pour date match
// Everything else goes to 'pending' for manual assignment
async function findBestMatch(
  supabase: any,
  businessId: string,
  extractedAddress: string | null,
  extractedDate: string | null
): Promise<{ matchStatus: MatchStatus; matchedJobId: string | null; matchedPourId: string | null; matchConfidence: number }> {
  if (!extractedAddress || !extractedDate) {
    console.log('Missing address or date - cannot auto-match');
    return { matchStatus: 'pending', matchedJobId: null, matchedPourId: null, matchConfidence: 0 };
  }

  // Fetch all active jobs for this business
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, site_address, name')
    .eq('business_id', businessId)
    .in('status', ['not_started', 'in_progress']);

  if (jobsError || !jobs || jobs.length === 0) {
    console.log('No active jobs found for matching');
    return { matchStatus: 'pending', matchedJobId: null, matchedPourId: null, matchConfidence: 0 };
  }

  // Find ALL jobs that match above the threshold
  const matchingJobs: { job: Job; confidence: number }[] = [];

  for (const job of jobs as Job[]) {
    const confidence = matchAddresses(extractedAddress, job.site_address);
    console.log(`Address match: "${extractedAddress}" vs "${job.site_address}" = ${confidence}%`);
    
    if (confidence >= 70) {
      matchingJobs.push({ job, confidence });
    }
  }

  if (matchingJobs.length === 0) {
    console.log('No job address matched above 70% threshold');
    return { matchStatus: 'pending', matchedJobId: null, matchedPourId: null, matchConfidence: 0 };
  }

  if (matchingJobs.length > 1) {
    console.log(`Multiple jobs matched (${matchingJobs.length}) - marking as pending for manual assignment`);
    return { matchStatus: 'pending', matchedJobId: null, matchedPourId: null, matchConfidence: 0 };
  }

  // Exactly ONE job matched - now try to match the date to a pour
  const { job: matchedJob, confidence: matchConfidence } = matchingJobs[0];
  console.log(`Single job match: ${matchedJob.name} (${matchedJob.id}) with ${matchConfidence}% confidence`);

  const { data: pours, error: poursError } = await supabase
    .from('job_pours')
    .select('id, pour_date')
    .eq('job_id', matchedJob.id);

  if (poursError || !pours || pours.length === 0) {
    console.log('No pours found for matched job - marking as pending');
    return { matchStatus: 'pending', matchedJobId: null, matchedPourId: null, matchConfidence: 0 };
  }

  // Find matching pour by date
  for (const pour of pours as Pour[]) {
    if (datesMatch(extractedDate, pour.pour_date)) {
      console.log(`Pour date matched: ${pour.pour_date} - auto-assigning`);
      return {
        matchStatus: 'auto_matched',
        matchedJobId: matchedJob.id,
        matchedPourId: pour.id,
        matchConfidence: matchConfidence
      };
    }
  }

  // Job matched but no pour date match - mark as pending
  console.log('Job matched but no pour date match - marking as pending');
  return { matchStatus: 'pending', matchedJobId: null, matchedPourId: null, matchConfidence: 0 };
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

    // Parse the alias from the email (before @contact.pourhub.au)
    const aliasMatch = recipientEmail.toLowerCase().match(/^([a-z0-9_-]+)@contact\.pourhub\.au$/);
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
          status: 'pending',
          match_status: 'pending'
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
          let extractedData: any = {};
          
          // Try to extract docket data using scan-test-document
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

          // Try to auto-match to a job and pour
          const matchResult = await findBestMatch(
            supabase,
            business.id,
            extractedData.site_address || null,
            extractedData.delivery_date || null
          );

          console.log('Match result for docket:', matchResult);

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
              status: 'pending',
              match_status: matchResult.matchStatus,
              linked_job_id: matchResult.matchedJobId,
              linked_pour_id: matchResult.matchedPourId,
              match_confidence: matchResult.matchConfidence
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
            matchStatus: matchResult.matchStatus,
            success: true
          });

          console.log('Created pending document:', pendingDoc.id, 'match_status:', matchResult.matchStatus);

        } else {
          // Process as test result
          let extractedData: any = {};
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

          // Try to auto-match to a job and pour
          const matchResult = await findBestMatch(
            supabase,
            business.id,
            extractedData.site_address || null,
            extractedData.pour_date || extractedData.test_date || null
          );

          console.log('Match result for test:', matchResult);

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
              status: 'pending',
              match_status: matchResult.matchStatus,
              matched_job_id: matchResult.matchedJobId,
              matched_pour_id: matchResult.matchedPourId,
              match_confidence: matchResult.matchConfidence
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
            matchStatus: matchResult.matchStatus,
            success: true
          });

          console.log('Created pending test result:', pendingResult.id, 'match_status:', matchResult.matchStatus);
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
