import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-resend-signature',
};

interface ResendAttachment {
  filename: string;
  content_type: string;
  // NOTE: Resend's inbound webhook often does NOT include attachment bytes.
  // In that case, we must fetch attachments via Resend's Receiving Attachments API.
  content?: string | null; // base64 encoded (optional)
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

type ResolvedAttachment = {
  filename: string;
  content_type: string;
  bytes: Uint8Array;
  source: 'payload' | 'resend_download';
};

function isLikelyPdfAttachment(meta: { filename?: string; content_type?: string }): boolean {
  const ct = meta.content_type?.toLowerCase() || '';
  const fn = meta.filename?.toLowerCase() || '';
  return ct.includes('pdf') || fn.endsWith('.pdf');
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function resolvePdfAttachments(
  event: ResendEmailEvent
): Promise<ResolvedAttachment[]> {
  const emailId = event.data?.email_id;
  const raw = event.data?.attachments || [];

  const pdfCandidates = raw.filter((a) => isLikelyPdfAttachment(a));
  if (pdfCandidates.length === 0) return [];

  const resolved: ResolvedAttachment[] = [];
  const needsDownload: ResendAttachment[] = [];

  for (const att of pdfCandidates) {
    const hasContent = typeof att.content === 'string' && att.content.length > 0;
    if (hasContent) {
      try {
        resolved.push({
          filename: att.filename,
          content_type: att.content_type,
          bytes: base64ToUint8Array(att.content as string),
          source: 'payload',
        });
      } catch (e) {
        console.warn('Failed to decode attachment base64 from payload:', att.filename, e);
        needsDownload.push(att);
      }
    } else {
      needsDownload.push(att);
    }
  }

  // If webhook didn't include bytes, fetch attachments from Resend using email_id.
  if (needsDownload.length > 0) {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.warn('RESEND_API_KEY not configured - cannot download inbound attachments');
      return resolved;
    }
    if (!emailId) {
      console.warn('Missing email_id in webhook payload - cannot download inbound attachments');
      return resolved;
    }

    // Resend Receiving API: List attachments
    // GET https://api.resend.com/emails/receiving/:email_id/attachments
    const listResp = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}/attachments`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!listResp.ok) {
      const body = await listResp.text();
      console.error('Failed to list inbound attachments from Resend:', listResp.status, body);
      return resolved;
    }

    const listJson = (await listResp.json()) as any;
    const list = (Array.isArray(listJson?.data) ? listJson.data : []) as Array<{
      filename: string;
      content_type: string;
      download_url: string;
      size?: number;
    }>;

    const byFilename = new Map(list.map((a) => [a.filename, a]));

    for (const att of needsDownload) {
      const meta = byFilename.get(att.filename) || list.find((a) => isLikelyPdfAttachment(a));
      if (!meta?.download_url) {
        console.warn('No download_url found for attachment:', att.filename);
        continue;
      }

      try {
        console.log('Downloading inbound attachment from Resend:', {
          filename: meta.filename,
          content_type: meta.content_type,
          size: meta.size,
        });

        const resp = await fetch(meta.download_url);
        if (!resp.ok) {
          console.error('Failed to download attachment:', meta.filename, resp.status);
          // consume body
          await resp.text();
          continue;
        }

        const bytes = new Uint8Array(await resp.arrayBuffer());
        resolved.push({
          filename: meta.filename,
          content_type: meta.content_type,
          bytes,
          source: 'resend_download',
        });
      } catch (e) {
        console.error('Error downloading attachment:', att.filename, e);
      }
    }
  }

  // Deduplicate by filename (keep first)
  const seen = new Set<string>();
  return resolved.filter((a) => {
    if (seen.has(a.filename)) return false;
    seen.add(a.filename);
    return true;
  });
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
      attachmentCount: payload.data?.attachments?.length || 0,
      attachmentDetails: payload.data?.attachments?.map(a => ({
        filename: a.filename,
        content_type: a.content_type,
        hasContent: !!a.content,
        contentLength: a.content?.length || 0
      }))
    });

    // Only process email.received events
    if (payload.type !== 'email.received') {
      console.log('Ignoring non-email.received event:', payload.type);
      return new Response(
        JSON.stringify({ success: true, message: 'Event type ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { from, to, subject } = payload.data;

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

    const resolvedPdfAttachments = await resolvePdfAttachments(payload);
    console.log('Resolved PDF attachments:', resolvedPdfAttachments.map(a => ({
      filename: a.filename,
      content_type: a.content_type,
      bytesLength: a.bytes.length,
      source: a.source,
    })));

    if (resolvedPdfAttachments.length === 0) {
      console.log(
        'No PDF attachments could be resolved. Raw attachments:',
        JSON.stringify((payload.data?.attachments || []).map(a => ({
          filename: a.filename,
          content_type: a.content_type,
          contentLength: (a as any)?.content?.length || 0,
        })))
      );
      
      // Still create a pending result record even without PDF
      const { error: insertError } = await supabase
        .from('pending_test_results')
        .insert({
          business_id: business.id,
          from_email: from,
          subject: subject || '(No subject)',
          received_at: new Date().toISOString(),
          extracted_data: { note: 'No PDF attachment could be retrieved from inbound email' },
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
    
    for (const attachment of resolvedPdfAttachments) {
      try {
        console.log('Processing attachment:', attachment.filename);

        // Detect document type based on subject, filename, and sender
        const documentType = detectDocumentType(subject || '', attachment.filename, from);
        console.log('Detected document type:', documentType);

        const pdfContent = attachment.bytes;
        
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
