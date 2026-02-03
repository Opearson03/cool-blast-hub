import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-resend-signature',
};

interface ResendAttachment {
  filename: string;
  content_type: string;
  content?: string | null;
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

type DocumentType = 'building_plan' | 'test_result' | 'delivery_docket' | 'general';
type MatchStatus = 'pending' | 'job_matched' | 'auto_matched';

// Keywords for document type detection
const TEST_RESULT_KEYWORDS = ['test', 'lab', 'result', 'mpa', 'strength', 'cylinder', 'slump', '7 day', '28 day', '7-day', '28-day', 'compressive', 'laboratory'];
const DELIVERY_DOCKET_KEYWORDS = ['docket', 'delivery', 'cartage', 'truck', 'load', 'batch', 'dispatch', 'concrete delivery', 'ticket'];
const BUILDING_PLAN_KEYWORDS = ['plan', 'plans', 'drawing', 'drawings', 'quote', 'quote request', 'estimate', 'pricing', 'price', 'architectural', 'engineering', 'structural', 'floor plan', 'site plan', 'blueprint', 'specs', 'specification', 'tender', 'rfq', 'request for quote', 'footing', 'slab'];
// Keywords that indicate an email is NOT a work document (general/misc)
const GENERAL_EXCLUSION_KEYWORDS = ['invoice', 'statement', 'account', 'payment', 'receipt', 'subscription', 'newsletter', 'unsubscribe', 'marketing', 'promo', 'promotion', 'sale', 'discount', 'offer', 'advertisement'];

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

async function resolvePdfAttachments(event: ResendEmailEvent): Promise<ResolvedAttachment[]> {
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

  const seen = new Set<string>();
  return resolved.filter((a) => {
    if (seen.has(a.filename)) return false;
    seen.add(a.filename);
    return true;
  });
}

function detectDocumentType(subject: string, filename: string, fromEmail: string): DocumentType {
  const searchText = `${subject} ${filename} ${fromEmail}`.toLowerCase();
  
  // First check if it's clearly a general/misc email (invoices, marketing, etc)
  for (const keyword of GENERAL_EXCLUSION_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 'general';
    }
  }
  
  // Check for delivery docket keywords first (most specific)
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
  
  // Check for building plan keywords
  for (const keyword of BUILDING_PLAN_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 'building_plan';
    }
  }
  
  // Default to 'general' for emails without clear categorization
  // Users can manually reclassify if needed
  return 'general';
}

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

function matchAddresses(extracted: string, jobAddress: string): number {
  const a = normalizeAddress(extracted);
  const b = normalizeAddress(jobAddress);
  
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 85;
  
  const aWords = a.split(' ').filter(w => w.length > 2);
  const bWords = b.split(' ').filter(w => w.length > 2);
  const overlap = aWords.filter(w => bWords.includes(w)).length;
  
  if (overlap === 0) return 0;
  
  const score = (overlap / Math.max(aWords.length, bWords.length)) * 100;
  return Math.round(score);
}

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

interface MatchResult {
  matchStatus: MatchStatus;
  matchedJobId: string | null;
  matchedPourId: string | null;
  matchConfidence: number;
  matchReason?: string;
}

interface Job {
  id: string;
  site_address: string;
  name: string;
  job_number: string | null;
  mpa_strength: string | null;
}

interface Pour {
  id: string;
  job_id: string;
  pour_date: string | null;
  pour_name: string;
  mpa_strength: string | null;
}

async function findBestMatchMultiSignal(
  supabase: any,
  businessId: string,
  extractedData: {
    docket_number?: string | null;
    batch_ticket?: string | null;
    site_address?: string | null;
    pour_date?: string | null;
    test_date?: string | null;
    target_mpa?: number | null;
    job_number?: string | null;
    project_ref?: string | null;
  }
): Promise<MatchResult> {
  // 1. Try docket number match first (definitive - 100 points)
  if (extractedData.docket_number) {
    console.log('Searching for docket number match:', extractedData.docket_number);
    const { data: poursWithDocket } = await supabase
      .from('job_pours')
      .select('id, job_id, pour_name, jobs!inner(id, name, business_id)')
      .contains('docket_numbers', [extractedData.docket_number])
      .eq('jobs.business_id', businessId);

    if (poursWithDocket && poursWithDocket.length > 0) {
      const pour = poursWithDocket[0];
      console.log('Docket number matched to pour:', pour.id);
      return {
        matchStatus: 'auto_matched',
        matchedJobId: pour.job_id,
        matchedPourId: pour.id,
        matchConfidence: 100,
        matchReason: `Docket number ${extractedData.docket_number} matched`
      };
    }
  }

  // 2. Try batch ticket match (80 points)
  if (extractedData.batch_ticket) {
    console.log('Searching for batch ticket match:', extractedData.batch_ticket);
    const { data: poursWithBatch } = await supabase
      .from('job_pours')
      .select('id, job_id, pour_name, jobs!inner(id, name, business_id)')
      .contains('batch_ticket_refs', [extractedData.batch_ticket])
      .eq('jobs.business_id', businessId);

    if (poursWithBatch && poursWithBatch.length > 0) {
      const pour = poursWithBatch[0];
      console.log('Batch ticket matched to pour:', pour.id);
      return {
        matchStatus: 'auto_matched',
        matchedJobId: pour.job_id,
        matchedPourId: pour.id,
        matchConfidence: 80,
        matchReason: `Batch ticket ${extractedData.batch_ticket} matched`
      };
    }
  }

  // 3. Fetch all active jobs and their pours for weighted scoring
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, site_address, name, job_number, mpa_strength')
    .eq('business_id', businessId)
    .in('status', ['not_started', 'in_progress']);

  if (jobsError || !jobs || jobs.length === 0) {
    console.log('No active jobs found for matching');
    return { matchStatus: 'pending', matchedJobId: null, matchedPourId: null, matchConfidence: 0 };
  }

  const extractedDate = extractedData.pour_date || extractedData.test_date;
  const jobScores: Map<string, { job: Job; score: number; reasons: string[]; bestPour?: Pour; pourScore: number }> = new Map();

  for (const job of jobs as Job[]) {
    let score = 0;
    const reasons: string[] = [];

    // Job number / project ref match (50 points)
    if (extractedData.job_number && job.job_number) {
      const jobNumNorm = job.job_number.toLowerCase().replace(/[^a-z0-9]/g, '');
      const extractedNumNorm = extractedData.job_number.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (jobNumNorm === extractedNumNorm || jobNumNorm.includes(extractedNumNorm) || extractedNumNorm.includes(jobNumNorm)) {
        score += 50;
        reasons.push(`Job number matched: ${job.job_number}`);
      }
    }

    // Address match (up to 40 points)
    if (extractedData.site_address) {
      const addressScore = matchAddresses(extractedData.site_address, job.site_address);
      if (addressScore >= 70) {
        const points = Math.round(addressScore * 0.4);
        score += points;
        reasons.push(`Address matched (${addressScore}%)`);
      }
    }

    // MPA strength match (20 points)
    if (extractedData.target_mpa && job.mpa_strength) {
      const jobMpa = parseFloat(job.mpa_strength);
      if (!isNaN(jobMpa) && Math.abs(jobMpa - extractedData.target_mpa) <= 2) {
        score += 20;
        reasons.push(`MPA strength matched: ${job.mpa_strength}`);
      }
    }

    // Fetch pours for this job to check date matching
    const { data: pours } = await supabase
      .from('job_pours')
      .select('id, pour_date, pour_name, mpa_strength, docket_numbers, batch_ticket_refs')
      .eq('job_id', job.id);

    let bestPour: Pour | undefined;
    let pourScore = 0;

    if (pours && pours.length > 0) {
      for (const pour of pours as Pour[]) {
        let thisScore = 0;

        // Date match (30 points)
        if (extractedDate && datesMatch(extractedDate, pour.pour_date)) {
          thisScore += 30;
        }

        // Pour-level MPA match (10 bonus points)
        if (extractedData.target_mpa && pour.mpa_strength) {
          const pourMpa = parseFloat(pour.mpa_strength);
          if (!isNaN(pourMpa) && Math.abs(pourMpa - extractedData.target_mpa) <= 2) {
            thisScore += 10;
          }
        }

        if (thisScore > pourScore) {
          pourScore = thisScore;
          bestPour = pour;
        }
      }
    }

    const totalScore = score + pourScore;
    if (totalScore > 0) {
      jobScores.set(job.id, { job, score: totalScore, reasons, bestPour, pourScore });
    }
  }

  const sortedMatches = Array.from(jobScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (sortedMatches.length > 0) {
    const topMatch = sortedMatches[0];
    
    // Auto-match if score >= 70 AND we have a pour match
    if (topMatch.score >= 70 && topMatch.bestPour) {
      console.log('High-confidence match found:', topMatch.job.name, 'score:', topMatch.score);
      return {
        matchStatus: 'auto_matched',
        matchedJobId: topMatch.job.id,
        matchedPourId: topMatch.bestPour.id,
        matchConfidence: topMatch.score,
        matchReason: topMatch.reasons.join(', ')
      };
    }
  }

  console.log('No confident match found');
  return { matchStatus: 'pending', matchedJobId: null, matchedPourId: null, matchConfidence: 0 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ResendEmailEvent = await req.json();
    
    console.log('Received email webhook:', {
      type: payload.type,
      from: payload.data?.from,
      to: payload.data?.to,
      subject: payload.data?.subject,
      attachmentCount: payload.data?.attachments?.length || 0,
    });

    if (payload.type !== 'email.received') {
      console.log('Ignoring non-email.received event:', payload.type);
      return new Response(
        JSON.stringify({ success: true, message: 'Event type ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { from, to, subject } = payload.data;

    const recipientEmail = to?.[0];
    if (!recipientEmail) {
      console.error('No recipient email found');
      return new Response(
        JSON.stringify({ success: false, error: 'No recipient email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    console.log('Resolved PDF attachments:', resolvedPdfAttachments.length);

    if (resolvedPdfAttachments.length === 0) {
      console.log('No PDF attachments could be resolved');
      
      // Get email body for context
      const emailBody = payload.data.text || payload.data.html?.replace(/<[^>]*>/g, ' ').slice(0, 2000) || null;
      
      // Create a pending_general record for emails without PDF attachments
      const { error: insertError } = await supabase
        .from('pending_general')
        .insert({
          business_id: business.id,
          from_email: from,
          from_name: null,
          subject: subject || '(No subject)',
          received_at: new Date().toISOString(),
          file_url: null,
          file_name: null,
          email_body: emailBody,
          status: 'pending'
        });

      if (insertError) {
        console.error('Failed to insert pending general:', insertError);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Email received but no PDF attachments' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    
    for (const attachment of resolvedPdfAttachments) {
      try {
        console.log('Processing attachment:', attachment.filename);

        // Detect document type based on subject, filename, and sender
        const documentType = detectDocumentType(subject || '', attachment.filename, from);
        console.log('Detected document type:', documentType);

        const pdfContent = attachment.bytes;
        
        if (pdfContent.length > 10 * 1024 * 1024) {
          console.warn('Attachment too large:', attachment.filename);
          continue;
        }

        // Generate storage path based on document type
        const timestamp = Date.now();
        const safeFilename = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        let folderPrefix = 'plans';
        if (documentType === 'test_result') folderPrefix = 'tests';
        else if (documentType === 'delivery_docket') folderPrefix = 'dockets';
        else if (documentType === 'general') folderPrefix = 'general';
        
        const storagePath = `${business.id}/inbound/${folderPrefix}/${timestamp}_${safeFilename}`;

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

        const { data: urlData } = supabase.storage
          .from('test-documents')
          .getPublicUrl(storagePath);

        const fileUrl = urlData.publicUrl;
        console.log('Uploaded to:', fileUrl);

        // Process based on document type
        if (documentType === 'building_plan') {
          // Process as building plan
          let extractedData: any = {};
          
          try {
            const scanResponse = await fetch(`${supabaseUrl}/functions/v1/scan-test-document`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                pdfUrl: fileUrl,
                documentType: 'building_plan'
              })
            });

            if (scanResponse.ok) {
              const scanResult = await scanResponse.json();
              if (scanResult.success && scanResult.data) {
                extractedData = scanResult.data;
                console.log('Extracted plan data:', extractedData);
              }
            } else {
              console.warn('Scan failed:', await scanResponse.text());
            }
          } catch (scanError) {
            console.error('Error calling scan-test-document:', scanError);
          }

          // Create pending plan record
          const { data: pendingPlan, error: insertError } = await supabase
            .from('pending_plans')
            .insert({
              business_id: business.id,
              from_email: from,
              from_name: extractedData.client_name || null,
              subject: subject || '(No subject)',
              received_at: new Date().toISOString(),
              file_url: fileUrl,
              file_name: attachment.filename,
              extracted_data: extractedData,
              status: 'pending'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to insert pending plan:', insertError);
            continue;
          }

          results.push({
            filename: attachment.filename,
            id: pendingPlan.id,
            type: 'building_plan',
            success: true
          });

          console.log('Created pending plan:', pendingPlan.id);

        } else if (documentType === 'delivery_docket') {
          // Process as delivery docket
          let extractedData: any = {};
          
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

          const matchResult = await findBestMatchMultiSignal(
            supabase,
            business.id,
            {
              docket_number: extractedData.docket_number || null,
              batch_ticket: extractedData.batch_ticket || null,
              site_address: extractedData.site_address || null,
              pour_date: extractedData.delivery_date || null
            }
          );

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

          console.log('Created pending document:', pendingDoc.id);

        } else if (documentType === 'general') {
          // Process as general/misc document
          const emailBody = payload.data.text || payload.data.html?.replace(/<[^>]*>/g, ' ').slice(0, 2000) || null;
          
          const { data: pendingGeneral, error: insertError } = await supabase
            .from('pending_general')
            .insert({
              business_id: business.id,
              from_email: from,
              from_name: null,
              subject: subject || '(No subject)',
              received_at: new Date().toISOString(),
              file_url: fileUrl,
              file_name: attachment.filename,
              email_body: emailBody,
              status: 'pending'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Failed to insert pending general:', insertError);
            continue;
          }

          results.push({
            filename: attachment.filename,
            id: pendingGeneral.id,
            type: 'general',
            success: true
          });

          console.log('Created pending general:', pendingGeneral.id);

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
                console.log('Extracted test data:', extractedData);
              }
            } else {
              console.warn('Scan failed:', await scanResponse.text());
            }
          } catch (scanError) {
            console.error('Error calling scan-test-document:', scanError);
          }

          // Check for duplicate test result
          if (extractedData.test_id) {
            const { data: existingPending } = await supabase
              .from('pending_test_results')
              .select('id, status')
              .eq('business_id', business.id)
              .eq('status', 'pending')
              .filter('extracted_data->>test_id', 'eq', extractedData.test_id);
            
            if (existingPending && existingPending.length > 0) {
              console.log('Duplicate pending test result found:', extractedData.test_id);
              results.push({
                filename: attachment.filename,
                type: 'test_result',
                matchStatus: 'skipped',
                success: true,
                message: `Duplicate test_id ${extractedData.test_id} already pending`
              });
              continue;
            }
            
            const { data: existingTest } = await supabase
              .from('concrete_tests')
              .select('id, job_id')
              .eq('test_id', extractedData.test_id)
              .limit(1);
            
            if (existingTest && existingTest.length > 0) {
              console.log('Test result already exists:', extractedData.test_id);
              results.push({
                filename: attachment.filename,
                type: 'test_result',
                matchStatus: 'skipped',
                success: true,
                message: `Test ${extractedData.test_id} already recorded`
              });
              continue;
            }
          }

          const matchResult = await findBestMatchMultiSignal(
            supabase,
            business.id,
            {
              docket_number: extractedData.docket_number || null,
              batch_ticket: extractedData.batch_ticket || null,
              site_address: extractedData.site_address || null,
              pour_date: extractedData.pour_date || null,
              test_date: extractedData.test_date || null,
              target_mpa: extractedData.target_mpa || null,
              job_number: extractedData.job_number || null,
              project_ref: extractedData.project_ref || null
            }
          );

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
