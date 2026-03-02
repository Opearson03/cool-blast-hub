import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BatchInviteRequest {
  job_pour_ids: string[];
  recipient_name: string;
  role: string;
  recipient_phone?: string;
  recipient_email?: string;
  notes?: string;
  start_time?: string;
}

// Generate URL-safe base64 token
function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Hash token with SHA-256
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Format phone number to E.164 for AU
function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("61")) return `+${digits}`;
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
  return `+61${digits}`;
}

// Normalize phone for comparison
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Format date as short form (e.g., "Feb 3")
function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-batch-subtrade-invite: Received request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: BatchInviteRequest = await req.json();
    console.log("Batch invite request:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.job_pour_ids || body.job_pour_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one pour ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.recipient_name || !body.role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipient_name, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.recipient_phone && !body.recipient_email) {
      return new Response(
        JSON.stringify({ error: "At least one contact method required (phone or email)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all pour details
    const { data: poursData, error: poursError } = await supabase
      .from("job_pours")
      .select(`
        id,
        pour_name,
        pour_date,
        scheduled_time,
        job_id,
        jobs (
          id,
          name,
          site_address,
          business_id,
          businesses (
            id,
            name,
            logo_url,
            email,
            inbound_email_alias
          )
        )
      `)
      .in("id", body.job_pour_ids);

    if (poursError || !poursData || poursData.length === 0) {
      console.error("Pours not found:", poursError);
      return new Response(JSON.stringify({ error: "Pours not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure all pours belong to the same business
    const firstJob = poursData[0].jobs as any;
    const business = firstJob?.businesses as any;
    const businessId = business?.id;

    if (!businessId) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing active invites for any of these pours
    const normalizedInputPhone = body.recipient_phone ? normalizePhone(body.recipient_phone) : null;
    const inputNameLower = body.recipient_name.toLowerCase().trim();

    const { data: existingInvites, error: duplicateError } = await supabase
      .from("external_invites")
      .select("id, recipient_name, recipient_phone, status, job_pour_id")
      .in("job_pour_id", body.job_pour_ids)
      .eq("invite_type", "sub_trade")
      .in("status", ["drafted", "sent", "viewed", "accepted"]);

    if (!duplicateError && existingInvites && existingInvites.length > 0) {
      const duplicatePourIds: string[] = [];

      for (const existing of existingInvites) {
        const existingNameLower = existing.recipient_name.toLowerCase().trim();
        const existingPhoneNormalized = existing.recipient_phone ? normalizePhone(existing.recipient_phone) : null;

        if (existingNameLower === inputNameLower ||
            (normalizedInputPhone && existingPhoneNormalized && normalizedInputPhone === existingPhoneNormalized)) {
          duplicatePourIds.push(existing.job_pour_id);
        }
      }

      if (duplicatePourIds.length > 0) {
        // Filter out pours that already have active invites
        const filteredPourIds = body.job_pour_ids.filter(id => !duplicatePourIds.includes(id));
        
        if (filteredPourIds.length === 0) {
          return new Response(
            JSON.stringify({
              error: `${body.recipient_name} already has active invites for all selected pours`,
              code: "DUPLICATE_INVITE",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Continue with non-duplicate pours
        body.job_pour_ids = filteredPourIds;
        console.log(`Filtered out ${duplicatePourIds.length} duplicate pours, continuing with ${filteredPourIds.length}`);
      }
    }

    // SMS rate limit check
    let smsRateLimitExceeded = false;
    if (body.recipient_phone) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const { count } = await supabase
        .from("external_invites")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("sms_delivery_status", "sent")
        .gte("sent_at", todayIso);

      if (count !== null && count >= 50) {
        smsRateLimitExceeded = true;
        if (!body.recipient_email) {
          return new Response(
            JSON.stringify({
              error: "Daily SMS limit reached (50/day). Please provide an email address or try again tomorrow.",
              code: "SMS_RATE_LIMIT",
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Generate ONE token for the entire batch
    const rawToken = generateToken();
    const batchTokenHash = await hashToken(rawToken);
    const batchId = crypto.randomUUID();

    // Determine send method
    let sentVia: "sms" | "email" | "both" = "email";
    if (body.recipient_phone && body.recipient_email && !smsRateLimitExceeded) {
      sentVia = "both";
    } else if (body.recipient_phone && !smsRateLimitExceeded) {
      sentVia = "sms";
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const sentAt = new Date().toISOString();

    // Create invite records for each pour
    const inviteRecords = body.job_pour_ids.map(pourId => {
      const pour = poursData.find(p => p.id === pourId);
      const job = pour?.jobs as any;
      return {
        business_id: businessId,
        job_id: job?.id,
        job_pour_id: pourId,
        invite_type: "sub_trade",
        role: body.role,
        recipient_name: body.recipient_name,
        recipient_phone: body.recipient_phone || null,
        recipient_email: body.recipient_email || null,
        notes: body.notes || null,
        start_time: body.start_time || null,
        status: "sent",
        token_hash: batchTokenHash, // Same hash for all
        batch_id: batchId,
        batch_token_hash: batchTokenHash,
        token_expires_at: expiresAt,
        sent_via: sentVia,
        sent_at: sentAt,
        created_by: user.id,
      };
    });

    const { data: invites, error: insertError } = await supabase
      .from("external_invites")
      .insert(inviteRecords)
      .select();

    if (insertError) {
      console.error("Failed to create invites:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create invites" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Created ${invites.length} batch invites with batch_id:`, batchId);

    // Get APP_URL for building links
    const appUrl = (Deno.env.get("APP_URL") || "https://pourhub.com.au").replace(/\/+$/, "");

    // Build invite URL
    const inviteUrl = `${appUrl}/i/${rawToken}`;

    // Format pour dates for messaging
    const sortedPours = [...poursData]
      .filter(p => body.job_pour_ids.includes(p.id))
      .sort((a, b) => {
        if (!a.pour_date) return 1;
        if (!b.pour_date) return -1;
        return new Date(a.pour_date).getTime() - new Date(b.pour_date).getTime();
      });

    const pourDatesFormatted = sortedPours
      .filter(p => p.pour_date)
      .map(p => formatShortDate(p.pour_date!))
      .join(", ");

    const pourCount = invites.length;

    // Tracking variables
    let smsDeliveryStatus: string | null = null;
    let smsMessageSid: string | null = null;
    let smsErrorMessage: string | null = null;
    let emailDeliveryStatus: string | null = null;
    let emailMessageId: string | null = null;
    let emailErrorMessage: string | null = null;

    // Send SMS
    if (body.recipient_phone && !smsRateLimitExceeded) {
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          const formattedPhone = formatPhoneE164(body.recipient_phone);
          
          // Format time if provided
          const timeFormatted = body.start_time ? ` at ${body.start_time}` : "";
          
          // Compose batch SMS message
          const smsMessage = pourCount === 1
            ? `${business.name}: You're invited to work as ${body.role} on ${pourDatesFormatted}${timeFormatted}.\nView & respond: ${inviteUrl}`
            : `${business.name}: You're invited to ${pourCount} pours as ${body.role} (${pourDatesFormatted})${timeFormatted}.\nView & respond: ${inviteUrl}`;

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
          const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

          const smsResponse = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${twilioAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: formattedPhone,
              From: twilioPhoneNumber,
              Body: smsMessage,
            }),
          });

          if (!smsResponse.ok) {
            const smsError = await smsResponse.text();
            console.error("Twilio SMS failed:", smsError);
            smsDeliveryStatus = "failed";
            smsErrorMessage = smsError.substring(0, 500);
          } else {
            const smsResult = await smsResponse.json();
            console.log("SMS sent successfully to", formattedPhone);
            smsDeliveryStatus = "sent";
            smsMessageSid = smsResult.sid || null;
          }
        } catch (smsErr: any) {
          console.error("SMS sending error:", smsErr);
          smsDeliveryStatus = "failed";
          smsErrorMessage = smsErr.message || "Unknown error";
        }
      }
    } else if (smsRateLimitExceeded && body.recipient_phone) {
      smsDeliveryStatus = "rate_limited";
      smsErrorMessage = "Daily SMS limit (50) exceeded";
    }

    // Send Email
    if (body.recipient_email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);

          // Build pour list HTML
          const pourListHtml = sortedPours.map(pour => {
            const job = pour.jobs as any;
            const pourDateFormatted = pour.pour_date
              ? new Date(pour.pour_date).toLocaleDateString("en-AU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "TBA";
            return `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-weight: 600; color: #1f2937;">${pour.pour_name}</p>
                  <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">📅 ${pourDateFormatted}${pour.scheduled_time ? ` at ${pour.scheduled_time.slice(0,5)}` : ""}</p>
                  <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">📍 ${job?.site_address || "TBA"}</p>
                </td>
              </tr>
            `;
          }).join("");

          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1f2937; padding: 24px; text-align: center;">
              ${business.logo_url ? `<img src="${business.logo_url}" alt="${business.name}" style="max-height: 60px; max-width: 200px;">` : `<h1 style="color: #ffffff; margin: 0; font-size: 24px;">${business.name}</h1>`}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 20px;">
                You've been invited to ${pourCount === 1 ? "work on a pour" : `work on ${pourCount} pours`}
              </h2>
              <p style="color: #6b7280; margin: 0 0 24px 0;">Role: <strong style="color: #1f2937;">${body.role}</strong></p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                ${pourListHtml}
              </table>
              
              ${body.notes ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Notes from ${business.name}:</strong></p>
                <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">${body.notes}</p>
              </div>
              ` : ""}
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View & Respond to All</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Powered by PourHub</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          const subject = pourCount === 1
            ? `${business.name} - Work Invite for ${pourDatesFormatted}`
            : `${business.name} - ${pourCount} Pour Invites (${pourDatesFormatted})`;

          // Use business-specific alias if available
          const fromEmail = business.inbound_email_alias 
            ? `${business.inbound_email_alias}@contact.pourhub.com.au`
            : 'Hello@contact.pourhub.com.au';
          
          const emailResponse = await resend.emails.send({
            from: `${business.name} <${fromEmail}>`,
            to: [body.recipient_email],
            subject,
            html: emailHtml,
          });

          if (emailResponse.error) {
            console.error("Email send failed:", emailResponse.error);
            emailDeliveryStatus = "failed";
            emailErrorMessage = emailResponse.error.message || "Email delivery failed";
          } else {
            console.log("Email sent successfully to", body.recipient_email);
            emailDeliveryStatus = "sent";
            emailMessageId = emailResponse.data?.id || null;
          }
        } catch (emailErr: any) {
          console.error("Email sending error:", emailErr);
          emailDeliveryStatus = "failed";
          emailErrorMessage = emailErr.message || "Unknown error";
        }
      }
    }

    // Update all invites with delivery status
    await supabase
      .from("external_invites")
      .update({
        sms_delivery_status: smsDeliveryStatus,
        sms_message_sid: smsMessageSid,
        sms_error_message: smsErrorMessage,
        email_delivery_status: emailDeliveryStatus,
        email_message_id: emailMessageId,
        email_error_message: emailErrorMessage,
      })
      .eq("batch_id", batchId);

    // Log audit events for each invite
    for (const invite of invites) {
      await supabase.from("external_invite_events").insert({
        external_invite_id: invite.id,
        event_type: "sent",
        metadata: {
          sent_via: sentVia,
          batch_id: batchId,
          pour_count: pourCount,
          sms_status: smsDeliveryStatus,
          email_status: emailDeliveryStatus,
        },
      });
    }

    console.log("Batch invite sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: batchId,
        invite_count: invites.length,
        sent_via: sentVia,
        sms_status: smsDeliveryStatus,
        email_status: emailDeliveryStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
