import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SubTradeInviteRequest {
  job_pour_id: string;
  recipient_name: string;
  role: string;
  recipient_phone?: string;
  recipient_email?: string;
  notes?: string;
  start_time?: string;
  resend_invite_id?: string;
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

// Normalize phone number for comparison (remove all non-digits)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-subtrade-invite: Received request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SubTradeInviteRequest = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Get APP_URL for building links
    const appUrl = (Deno.env.get("APP_URL") || "https://pourhub.com.au").replace(/\/+$/, "");

    // === RESEND FLOW ===
    // If resend_invite_id is provided, this is a resend request
    if (body.resend_invite_id) {
      console.log("Resend request for invite:", body.resend_invite_id);

      // Fetch the existing invite
      const { data: existingInvite, error: fetchError } = await supabase
        .from("external_invites")
        .select(`
          *,
          job_pours (
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
          )
        `)
        .eq("id", body.resend_invite_id)
        .eq("invite_type", "sub_trade")
        .single();

      if (fetchError || !existingInvite) {
        console.error("Invite not found:", fetchError);
        return new Response(JSON.stringify({ error: "Invite not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pour = existingInvite.job_pours as any;
      const job = pour?.jobs as any;
      const business = job?.businesses as any;

      if (!business) {
        return new Response(JSON.stringify({ error: "Business not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate new token
      const rawToken = generateToken();
      const tokenHash = await hashToken(rawToken);
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      // Determine send method from existing invite or override with new values
      const recipientPhone = body.recipient_phone || existingInvite.recipient_phone;
      const recipientEmail = body.recipient_email || existingInvite.recipient_email;

      let sentVia: "sms" | "email" | "both" = "email";
      if (recipientPhone && recipientEmail) {
        sentVia = "both";
      } else if (recipientPhone) {
        sentVia = "sms";
      }

      // Update the invite with new token and reset delivery status
      const { error: updateError } = await supabase
        .from("external_invites")
        .update({
          token_hash: tokenHash,
          token_expires_at: expiresAt,
          sent_at: now,
          sent_via: sentVia,
          status: "sent",
          sms_delivery_status: null,
          sms_message_sid: null,
          sms_error_message: null,
          email_delivery_status: null,
          email_message_id: null,
          email_error_message: null,
          recipient_phone: recipientPhone,
          recipient_email: recipientEmail,
          updated_at: now,
        })
        .eq("id", existingInvite.id);

      if (updateError) {
        console.error("Failed to update invite:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update invite" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build invite URL
      const inviteUrl = `${appUrl}/i/${rawToken}`;

      // Format pour date for messaging
      const pourDateFormatted = pour.pour_date
        ? new Date(pour.pour_date).toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
        : "TBA";

      const displayTime = existingInvite.start_time || pour.scheduled_time?.slice(0, 5) || null;
      const timeFormatted = displayTime ? ` at ${displayTime}` : "";

      // Delivery tracking
      let smsDeliveryStatus: string | null = null;
      let smsMessageSid: string | null = null;
      let smsErrorMessage: string | null = null;
      let emailDeliveryStatus: string | null = null;
      let emailMessageId: string | null = null;
      let emailErrorMessage: string | null = null;

      // Send SMS
      if (recipientPhone) {
        const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

        if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
          try {
            const formattedPhone = formatPhoneE164(recipientPhone);
            const smsMessage = `${business.name}: You're invited to work as ${existingInvite.role} on ${pourDateFormatted}${timeFormatted}.\nView & respond: ${inviteUrl}`;

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
              console.log("SMS resent successfully to", formattedPhone);
              smsDeliveryStatus = "sent";
              smsMessageSid = smsResult.sid || null;
            }
          } catch (smsErr: any) {
            console.error("SMS sending error:", smsErr);
            smsDeliveryStatus = "failed";
            smsErrorMessage = smsErr.message || "Unknown error";
          }
        }
      }

      // Send email
      if (recipientEmail) {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          try {
            const resend = new Resend(resendApiKey);

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
          <tr>
            <td style="background-color: #1f2937; padding: 24px; text-align: center;">
              ${business.logo_url ? `<img src="${business.logo_url}" alt="${business.name}" style="max-height: 60px; max-width: 200px;">` : `<h1 style="color: #ffffff; margin: 0; font-size: 24px;">${business.name}</h1>`}
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 20px;">You've been invited to work on a pour</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">📅 <strong style="color: #1f2937;">${pourDateFormatted}</strong></p>
                    ${displayTime ? `<p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">⏰ <strong style="color: #1f2937;">${displayTime}</strong></p>` : ""}
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">📍 <strong style="color: #1f2937;">${job.site_address}</strong></p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">🔧 Role: <strong style="color: #1f2937;">${existingInvite.role}</strong></p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View & Respond</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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

            const fromEmail = business.inbound_email_alias 
              ? `${business.inbound_email_alias}@contact.pourhub.com.au`
              : 'Hello@contact.pourhub.com.au';

            const emailResponse = await resend.emails.send({
              from: `${business.name} <${fromEmail}>`,
              to: [recipientEmail],
              subject: `${business.name} - Work Invite for ${pourDateFormatted}`,
              html: emailHtml,
            });

            if (emailResponse.error) {
              console.error("Email send failed:", emailResponse.error);
              emailDeliveryStatus = "failed";
              emailErrorMessage = emailResponse.error.message || "Email delivery failed";
            } else {
              console.log("Email resent successfully to", recipientEmail);
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

      // Update delivery status
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
        .eq("id", existingInvite.id);

      // Log audit event
      await supabase.from("external_invite_events").insert({
        external_invite_id: existingInvite.id,
        event_type: "resent",
        metadata: {
          sent_via: sentVia,
          sent_by: user.id,
          sms_status: smsDeliveryStatus,
          email_status: emailDeliveryStatus,
          token_rotated: true,
        },
      });

      console.log("Resend completed successfully");

      return new Response(
        JSON.stringify({
          success: true,
          invite_id: existingInvite.id,
          sent_via: sentVia,
          sms_status: smsDeliveryStatus,
          email_status: emailDeliveryStatus,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!body.job_pour_id || !body.recipient_name || !body.role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: job_pour_id, recipient_name, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.recipient_phone && !body.recipient_email) {
      return new Response(
        JSON.stringify({ error: "At least one contact method required (phone or email)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pour details with job and business info
    const { data: pourData, error: pourError } = await supabase
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
      .eq("id", body.job_pour_id)
      .single();

    if (pourError || !pourData) {
      console.error("Pour not found:", pourError);
      return new Response(JSON.stringify({ error: "Pour not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = pourData.jobs as any;
    const business = job?.businesses as any;

    if (!business) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DUPLICATE INVITE CHECK ===
    // Check for existing active invite with same name or phone for this pour
    const { data: existingInvites, error: duplicateError } = await supabase
      .from("external_invites")
      .select("id, recipient_name, recipient_phone, status")
      .eq("job_pour_id", body.job_pour_id)
      .eq("invite_type", "sub_trade")
      .in("status", ["drafted", "sent", "viewed", "accepted"]);

    if (duplicateError) {
      console.error("Error checking duplicates:", duplicateError);
    } else if (existingInvites && existingInvites.length > 0) {
      const normalizedInputPhone = body.recipient_phone ? normalizePhone(body.recipient_phone) : null;
      const inputNameLower = body.recipient_name.toLowerCase().trim();

      for (const existing of existingInvites) {
        const existingNameLower = existing.recipient_name.toLowerCase().trim();
        const existingPhoneNormalized = existing.recipient_phone ? normalizePhone(existing.recipient_phone) : null;

        // Check name match (case-insensitive)
        if (existingNameLower === inputNameLower) {
          console.log("Duplicate found by name:", existing.recipient_name);
          return new Response(
            JSON.stringify({
              error: `${existing.recipient_name} already has an active invite for this pour`,
              code: "DUPLICATE_INVITE",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check phone match (normalized)
        if (normalizedInputPhone && existingPhoneNormalized && normalizedInputPhone === existingPhoneNormalized) {
          console.log("Duplicate found by phone:", existing.recipient_name);
          return new Response(
            JSON.stringify({
              error: `This phone number already has an active invite for this pour (${existing.recipient_name})`,
              code: "DUPLICATE_INVITE",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // === SMS RATE LIMIT CHECK (50/day per business) ===
    let smsRateLimitExceeded = false;
    if (body.recipient_phone) {
      // Get start of today in UTC (we count from midnight UTC)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const { count, error: countError } = await supabase
        .from("external_invites")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("sms_delivery_status", "sent")
        .gte("sent_at", todayIso);

      if (countError) {
        console.error("Error checking SMS rate limit:", countError);
      } else if (count !== null && count >= 50) {
        console.log(`SMS rate limit exceeded for business ${business.id}: ${count}/50`);
        smsRateLimitExceeded = true;

        // If they only provided phone (no email), block the request
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

    // Generate secure token
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);

    // Determine send method (adjusted if rate limited)
    let sentVia: "sms" | "email" | "both" = "email";
    if (body.recipient_phone && body.recipient_email && !smsRateLimitExceeded) {
      sentVia = "both";
    } else if (body.recipient_phone && !smsRateLimitExceeded) {
      sentVia = "sms";
    }

    // Insert invite record
    const { data: invite, error: insertError } = await supabase
      .from("external_invites")
      .insert({
        business_id: business.id,
        job_id: job.id,
        job_pour_id: body.job_pour_id,
        invite_type: "sub_trade",
        role: body.role,
        recipient_name: body.recipient_name,
        recipient_phone: body.recipient_phone || null,
        recipient_email: body.recipient_email || null,
        notes: body.notes || null,
        start_time: body.start_time || null,
        status: "sent",
        token_hash: tokenHash,
        token_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        sent_via: sentVia,
        sent_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create invite:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create invite" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Invite created:", invite.id);

    // Build invite URL
    const inviteUrl = `${appUrl}/i/${rawToken}`;

    // Format pour date for messaging
    const pourDateFormatted = pourData.pour_date
      ? new Date(pourData.pour_date).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "TBA";

    // Use invite-specific start_time, fallback to pour's scheduled_time
    const displayTime = body.start_time || pourData.scheduled_time?.slice(0, 5) || null;
    const timeFormatted = displayTime ? ` at ${displayTime}` : "";

    // Delivery tracking variables
    let smsDeliveryStatus: string | null = null;
    let smsMessageSid: string | null = null;
    let smsErrorMessage: string | null = null;
    let emailDeliveryStatus: string | null = null;
    let emailMessageId: string | null = null;
    let emailErrorMessage: string | null = null;

    // Send SMS if phone provided and not rate limited
    if (body.recipient_phone && !smsRateLimitExceeded) {
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          const formattedPhone = formatPhoneE164(body.recipient_phone);
          const smsMessage = `${business.name}: You're invited to work as ${body.role} on ${pourDateFormatted}${timeFormatted}.\nView & respond: ${inviteUrl}`;

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
      } else {
        console.warn("Twilio credentials not configured, skipping SMS");
      }
    } else if (smsRateLimitExceeded && body.recipient_phone) {
      smsDeliveryStatus = "rate_limited";
      smsErrorMessage = "Daily SMS limit (50) exceeded";
    }

    // Send email if email provided
    if (body.recipient_email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);

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
              <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 20px;">You've been invited to work on a pour</h2>
              
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">📅 <strong style="color: #1f2937;">${pourDateFormatted}</strong></p>
                    ${displayTime ? `<p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">⏰ <strong style="color: #1f2937;">${displayTime}</strong></p>` : ""}
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">📍 <strong style="color: #1f2937;">${job.site_address}</strong></p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">🔧 Role: <strong style="color: #1f2937;">${body.role}</strong></p>
                  </td>
                </tr>
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
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View & Respond</a>
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

          // Use business-specific alias if available
          const fromEmail = business.inbound_email_alias 
            ? `${business.inbound_email_alias}@contact.pourhub.com.au`
            : 'Hello@contact.pourhub.com.au';
          
          const emailResponse = await resend.emails.send({
            from: `${business.name} <${fromEmail}>`,
            to: [body.recipient_email],
            subject: `${business.name} - Work Invite for ${pourDateFormatted}`,
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
      } else {
        console.warn("RESEND_API_KEY not configured, skipping email");
      }
    }

    // Update invite with delivery status
    const { error: updateError } = await supabase
      .from("external_invites")
      .update({
        sms_delivery_status: smsDeliveryStatus,
        sms_message_sid: smsMessageSid,
        sms_error_message: smsErrorMessage,
        email_delivery_status: emailDeliveryStatus,
        email_message_id: emailMessageId,
        email_error_message: emailErrorMessage,
      })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Failed to update delivery status:", updateError);
    }

    // Log audit event
    await supabase.from("external_invite_events").insert({
      external_invite_id: invite.id,
      event_type: "sent",
      metadata: {
        sent_via: sentVia,
        sent_by: user.id,
        sms_status: smsDeliveryStatus,
        email_status: emailDeliveryStatus,
      },
    });

    console.log("Invite process completed successfully");

    // Build response with delivery info
    const response: any = {
      success: true,
      invite_id: invite.id,
      sent_via: sentVia,
      sms_status: smsDeliveryStatus,
      email_status: emailDeliveryStatus,
    };

    // Add warnings if rate limited
    if (smsRateLimitExceeded) {
      response.warning = "SMS daily limit reached. Email was sent instead.";
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
