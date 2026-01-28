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
            email
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

    // Generate secure token
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);

    // Determine send method
    let sentVia: "sms" | "email" | "both" = "email";
    if (body.recipient_phone && body.recipient_email) {
      sentVia = "both";
    } else if (body.recipient_phone) {
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
    const inviteUrl = `https://pourhub.com.au/i/${rawToken}`;

    // Format pour date for messaging
    const pourDateFormatted = pourData.pour_date
      ? new Date(pourData.pour_date).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "TBA";

    // Send SMS if phone provided
    if (body.recipient_phone) {
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          const formattedPhone = formatPhoneE164(body.recipient_phone);
          const smsMessage = `${business.name}: You're invited to work as ${body.role} on a pour ${pourDateFormatted}.\nView & respond: ${inviteUrl}`;

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
          } else {
            console.log("SMS sent successfully to", formattedPhone);
          }
        } catch (smsErr) {
          console.error("SMS sending error:", smsErr);
        }
      } else {
        console.warn("Twilio credentials not configured, skipping SMS");
      }
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
                    ${pourData.scheduled_time ? `<p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">⏰ <strong style="color: #1f2937;">${pourData.scheduled_time.slice(0, 5)}</strong></p>` : ""}
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

          const emailResponse = await resend.emails.send({
            from: `${business.name} via Pourhub <Hello@contact.pourhub.au>`,
            to: [body.recipient_email],
            subject: `${business.name} - Work Invite for ${pourDateFormatted}`,
            html: emailHtml,
          });

          if (emailResponse.error) {
            console.error("Email send failed:", emailResponse.error);
          } else {
            console.log("Email sent successfully to", body.recipient_email);
          }
        } catch (emailErr) {
          console.error("Email sending error:", emailErr);
        }
      } else {
        console.warn("RESEND_API_KEY not configured, skipping email");
      }
    }

    // Log audit event
    await supabase.from("external_invite_events").insert({
      external_invite_id: invite.id,
      event_type: "sent",
      metadata: {
        sent_via: sentVia,
        sent_by: user.id,
      },
    });

    console.log("Invite process completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        invite_id: invite.id,
        sent_via: sentVia,
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
