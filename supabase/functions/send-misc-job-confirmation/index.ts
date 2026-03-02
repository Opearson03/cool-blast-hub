import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MiscJobConfirmationRequest {
  job_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  send_via: "sms" | "email" | "both";
}

// Format phone number to E.164 for AU
function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("61")) return `+${digits}`;
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
  return `+61${digits}`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-misc-job-confirmation: Received request");

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

    const body: MiscJobConfirmationRequest = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.job_id || !body.client_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: job_id, client_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.send_via === "sms" && !body.client_phone) {
      return new Response(
        JSON.stringify({ error: "Phone number required for SMS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.send_via === "email" && !body.client_email) {
      return new Response(
        JSON.stringify({ error: "Email address required for email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.send_via === "both" && (!body.client_phone || !body.client_email)) {
      return new Response(
        JSON.stringify({ error: "Both phone and email required for 'both' option" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get job details with business info
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        name,
        site_address,
        scheduled_date,
        pour_time,
        job_notes,
        business_id,
        businesses (
          id,
          name,
          phone,
          email,
          logo_url,
          inbound_email_alias
        )
      `)
      .eq("id", body.job_id)
      .single();

    if (jobError || !jobData) {
      console.error("Job not found:", jobError);
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const business = jobData.businesses as any;

    if (!business) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format job date for messaging
    const jobDateFormatted = jobData.scheduled_date
      ? new Date(jobData.scheduled_date).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "Date TBA";

    const timeFormatted = jobData.pour_time ? ` at ${jobData.pour_time}` : "";

    // Delivery tracking
    let smsDeliveryStatus: string | null = null;
    let smsMessageSid: string | null = null;
    let smsErrorMessage: string | null = null;
    let emailDeliveryStatus: string | null = null;
    let emailMessageId: string | null = null;
    let emailErrorMessage: string | null = null;

    // Send SMS
    if ((body.send_via === "sms" || body.send_via === "both") && body.client_phone) {
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          const formattedPhone = formatPhoneE164(body.client_phone);
          const smsMessage = `Hi ${body.client_name}, this is ${business.name} confirming we'll be at ${jobData.site_address} on ${jobDateFormatted}${timeFormatted}. See you then!`;

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
        console.error("Twilio credentials not configured");
        smsDeliveryStatus = "failed";
        smsErrorMessage = "Twilio credentials not configured";
      }
    }

    // Send email
    if ((body.send_via === "email" || body.send_via === "both") && body.client_email) {
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
              <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 20px;">Hi ${body.client_name},</h2>
              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                This is a confirmation that we'll be at your site as scheduled.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">📍 <strong style="color: #1f2937;">${jobData.site_address}</strong></p>
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">📅 <strong style="color: #1f2937;">${jobDateFormatted}</strong></p>
                    ${jobData.pour_time ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">⏰ <strong style="color: #1f2937;">${jobData.pour_time}</strong></p>` : ""}
                  </td>
                </tr>
              </table>
              <p style="color: #4b5563; margin: 0; font-size: 16px; line-height: 1.6;">
                See you then!
              </p>
              <p style="color: #4b5563; margin: 24px 0 0 0; font-size: 16px;">
                — The ${business.name} Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              ${business.phone ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">📞 ${business.phone}</p>` : ""}
              ${business.email ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">✉️ ${business.email}</p>` : ""}
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">Powered by PourHub</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          const fromEmail = business.inbound_email_alias 
            ? `${business.inbound_email_alias}@pourhub.au`
            : 'Hello@pourhub.au';

          const emailResponse = await resend.emails.send({
            from: `${business.name} <${fromEmail}>`,
            to: [body.client_email],
            subject: `${business.name} - Confirmation for ${jobDateFormatted}`,
            html: emailHtml,
          });

          if (emailResponse.error) {
            console.error("Email send failed:", emailResponse.error);
            emailDeliveryStatus = "failed";
            emailErrorMessage = emailResponse.error.message || "Email delivery failed";
          } else {
            console.log("Email sent successfully to", body.client_email);
            emailDeliveryStatus = "sent";
            emailMessageId = emailResponse.data?.id || null;
          }
        } catch (emailErr: any) {
          console.error("Email sending error:", emailErr);
          emailDeliveryStatus = "failed";
          emailErrorMessage = emailErr.message || "Unknown error";
        }
      } else {
        console.error("Resend API key not configured");
        emailDeliveryStatus = "failed";
        emailErrorMessage = "Resend API key not configured";
      }
    }

    console.log("Confirmation sent. SMS:", smsDeliveryStatus, "Email:", emailDeliveryStatus);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: body.job_id,
        sent_via: body.send_via,
        sms_status: smsDeliveryStatus,
        email_status: emailDeliveryStatus,
        sms_error: smsErrorMessage,
        email_error: emailErrorMessage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-misc-job-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
