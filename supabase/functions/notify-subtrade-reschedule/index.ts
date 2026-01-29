import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyRescheduleRequest {
  pour_id: string;
  action: "cancel" | "reschedule";
  new_date?: string;
  old_date?: string;
}

// Format phone number to E.164 for AU
function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("61")) return `+${digits}`;
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
  return `+61${digits}`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-subtrade-reschedule: Received request");

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

    const body: NotifyRescheduleRequest = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.pour_id || !body.action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: pour_id, action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === "reschedule" && !body.new_date) {
      return new Response(
        JSON.stringify({ error: "new_date required for reschedule action" }),
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
            email
          )
        )
      `)
      .eq("id", body.pour_id)
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

    // Fetch active invites for this pour
    const { data: invites, error: invitesError } = await supabase
      .from("external_invites")
      .select("*")
      .eq("job_pour_id", body.pour_id)
      .eq("invite_type", "sub_trade")
      .in("status", ["sent", "viewed", "accepted"]);

    if (invitesError) {
      console.error("Error fetching invites:", invitesError);
      return new Response(JSON.stringify({ error: "Failed to fetch invites" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!invites || invites.length === 0) {
      console.log("No active invites found");
      return new Response(
        JSON.stringify({ success: true, notifications_sent: 0, message: "No active invites" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${invites.length} active invites to notify`);

    // Format dates for messaging
    const oldDateFormatted = body.old_date
      ? new Date(body.old_date).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "the original date";

    const newDateFormatted = body.new_date
      ? new Date(body.new_date).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "";

    let smsSent = 0;
    let emailsSent = 0;
    let smsFailed = 0;
    let emailsFailed = 0;
    let errors: string[] = [];

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    for (const invite of invites) {
      let smsDeliveryStatus: string | null = null;
      let smsMessageSid: string | null = null;
      let smsErrorMessage: string | null = null;
      let emailDeliveryStatus: string | null = null;
      let emailMessageId: string | null = null;
      let emailErrorMessage: string | null = null;

      // Update status if cancelling
      if (body.action === "cancel") {
        const { error: updateError } = await supabase
          .from("external_invites")
          .update({ status: "revoked", updated_at: new Date().toISOString() })
          .eq("id", invite.id);

        if (updateError) {
          console.error(`Failed to update invite ${invite.id}:`, updateError);
          errors.push(`Failed to revoke invite for ${invite.recipient_name}`);
        }
      }

      // Send SMS if phone exists
      if (invite.recipient_phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          const formattedPhone = formatPhoneE164(invite.recipient_phone);
          let smsMessage: string;

          if (body.action === "cancel") {
            smsMessage = `${business.name}: Your work invite for ${oldDateFormatted} has been cancelled. Sorry for any inconvenience.`;
          } else {
            const inviteUrl = `https://pourhub.com.au/i/${invite.token_hash.slice(0, 43)}`;
            smsMessage = `${business.name}: Your work invite has been rescheduled to ${newDateFormatted}. Can you still make it? View details: ${inviteUrl}`;
          }

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
            smsFailed++;
            errors.push(`SMS failed for ${invite.recipient_name}`);
          } else {
            const smsResult = await smsResponse.json();
            console.log("SMS sent to", formattedPhone);
            smsDeliveryStatus = "sent";
            smsMessageSid = smsResult.sid || null;
            smsSent++;
          }
        } catch (smsErr: any) {
          console.error("SMS error:", smsErr);
          smsDeliveryStatus = "failed";
          smsErrorMessage = smsErr.message || "Unknown error";
          smsFailed++;
          errors.push(`SMS error for ${invite.recipient_name}`);
        }
      }

      // Send email if email exists
      if (invite.recipient_email && resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);

          let emailSubject: string;
          let emailHtml: string;

          if (body.action === "cancel") {
            emailSubject = `${business.name} - Work Invite Cancelled`;
            emailHtml = `
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
            <td style="background-color: #dc2626; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">CANCELLED</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Work Invite Cancelled</h2>
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px;">
                Hi ${invite.recipient_name},
              </p>
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px;">
                Unfortunately, your work invite for <strong>${oldDateFormatted}</strong> as <strong>${invite.role}</strong> has been cancelled.
              </p>
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px;">
                We apologise for any inconvenience caused.
              </p>
              <p style="color: #1f2937; margin: 0; font-size: 16px; font-weight: 600;">
                ${business.name}
              </p>
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
          } else {
            // Reschedule email
            emailSubject = `${business.name} - Work Invite Rescheduled to ${newDateFormatted}`;
            const wasAccepted = invite.status === "accepted";
            emailHtml = `
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
            <td style="background-color: #f97316; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">RESCHEDULED</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Your Work Invite Has Been Rescheduled</h2>
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px;">
                Hi ${invite.recipient_name},
              </p>
              ${wasAccepted ? `
              <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 16px;">
                You previously accepted this invite. Please confirm you can still make the new date.
              </p>
              ` : ""}
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">📅 <span style="text-decoration: line-through;">${oldDateFormatted}</span></p>
                    <p style="margin: 0 0 12px 0; color: #f97316; font-size: 18px; font-weight: 600;">📅 NEW DATE: ${newDateFormatted}</p>
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">📍 <strong style="color: #1f2937;">${job.site_address}</strong></p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">🔧 Role: <strong style="color: #1f2937;">${invite.role}</strong></p>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://pourhub.com.au/i/${invite.token_hash.slice(0, 43)}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Confirm Availability</a>
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
          }

          const emailResponse = await resend.emails.send({
            from: `${business.name} via Pourhub <Hello@pourhub.au>`,
            to: [invite.recipient_email],
            subject: emailSubject,
            html: emailHtml,
          });

          if (emailResponse.error) {
            console.error("Email failed:", emailResponse.error);
            emailDeliveryStatus = "failed";
            emailErrorMessage = emailResponse.error.message || "Email delivery failed";
            emailsFailed++;
            errors.push(`Email failed for ${invite.recipient_name}`);
          } else {
            console.log("Email sent to", invite.recipient_email);
            emailDeliveryStatus = "sent";
            emailMessageId = emailResponse.data?.id || null;
            emailsSent++;
          }
        } catch (emailErr: any) {
          console.error("Email error:", emailErr);
          emailDeliveryStatus = "failed";
          emailErrorMessage = emailErr.message || "Unknown error";
          emailsFailed++;
          errors.push(`Email error for ${invite.recipient_name}`);
        }
      }

      // Update invite with delivery status (for reschedule, update tracking; for cancel, status already revoked)
      if (body.action === "reschedule") {
        await supabase
          .from("external_invites")
          .update({
            sms_delivery_status: smsDeliveryStatus || invite.sms_delivery_status,
            sms_message_sid: smsMessageSid || invite.sms_message_sid,
            sms_error_message: smsErrorMessage,
            email_delivery_status: emailDeliveryStatus || invite.email_delivery_status,
            email_message_id: emailMessageId || invite.email_message_id,
            email_error_message: emailErrorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invite.id);
      }

      // Log audit event
      const eventType = body.action === "cancel" ? "cancelled_by_reschedule" : "reschedule_notified";
      await supabase.from("external_invite_events").insert({
        external_invite_id: invite.id,
        event_type: eventType,
        metadata: {
          triggered_by: user.id,
          old_date: body.old_date,
          new_date: body.new_date,
          action: body.action,
          sms_status: smsDeliveryStatus,
          email_status: emailDeliveryStatus,
        },
      });
    }

    console.log(`Notifications complete: ${smsSent} SMS, ${emailsSent} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: smsSent + emailsSent,
        sms_sent: smsSent,
        sms_failed: smsFailed,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        invites_processed: invites.length,
        errors: errors.length > 0 ? errors : undefined,
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
