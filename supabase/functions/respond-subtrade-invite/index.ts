import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Hash token with SHA-256
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate .ics calendar file content
function generateICS(
  pourName: string,
  pourDate: string,
  scheduledTime: string | null,
  siteAddress: string,
  businessName: string,
  role: string
): string {
  const startDate = new Date(pourDate);
  if (scheduledTime) {
    const [hours, minutes] = scheduledTime.split(":");
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);
  } else {
    startDate.setHours(6, 0, 0); // Default to 6 AM
  }

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 8); // 8-hour shift

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const uid = `${Date.now()}@pourhub.com.au`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PourHub//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${pourName} - ${role} (${businessName})
DESCRIPTION:Work as ${role} for ${businessName}
LOCATION:${siteAddress}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("respond-subtrade-invite: Received request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, response } = await req.json();

    if (!token || !response) {
      return new Response(JSON.stringify({ error: "Token and response required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (response !== "accepted" && response !== "declined") {
      return new Response(JSON.stringify({ error: "Response must be 'accepted' or 'declined'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash incoming token
    const tokenHash = await hashToken(token);
    console.log("Looking up invite by token hash");

    // Find invite
    const { data: invite, error: inviteError } = await supabase
      .from("external_invites")
      .select(`
        id,
        status,
        role,
        recipient_name,
        recipient_email,
        notes,
        token_expires_at,
        business_id,
        job_pour_id,
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
              email,
              logo_url
            )
          )
        )
      `)
      .eq("token_hash", tokenHash)
      .single();

    if (inviteError || !invite) {
      console.error("Invite not found:", inviteError);
      return new Response(JSON.stringify({ error: "Invalid or expired invite link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate invite state
    if (new Date(invite.token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This invite link has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invite.status === "revoked") {
      return new Response(JSON.stringify({ error: "This invite has been cancelled" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invite.status === "accepted" || invite.status === "declined") {
      return new Response(
        JSON.stringify({ error: `You have already ${invite.status} this invite` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update invite status
    const { error: updateError } = await supabase
      .from("external_invites")
      .update({
        status: response,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Failed to update invite:", updateError);
      return new Response(JSON.stringify({ error: "Failed to record response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Invite updated to:", response);

    // Log audit event
    await supabase.from("external_invite_events").insert({
      external_invite_id: invite.id,
      event_type: response,
      metadata: { responded_at: new Date().toISOString() },
    });

    const pour = invite.job_pours as any;
    const job = pour?.jobs as any;
    const business = job?.businesses as any;

    // Send notification email to business
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && business?.email) {
      try {
        const resend = new Resend(resendApiKey);

        const statusEmoji = response === "accepted" ? "✅" : "❌";
        const statusText = response === "accepted" ? "ACCEPTED" : "DECLINED";

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: ${response === "accepted" ? "#10b981" : "#ef4444"}; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">${statusEmoji} Sub-Trade ${statusText}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">
          <strong>${invite.recipient_name}</strong> has <strong>${response}</strong> the invite for:
        </p>
        <table style="background-color: #f9fafb; border-radius: 8px; padding: 16px; width: 100%;">
          <tr><td style="padding: 8px 0; color: #6b7280;">Pour:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${pour?.pour_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Role:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${invite.role}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Date:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${pour?.pour_date ? new Date(pour.pour_date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }) : "TBA"}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Site:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${job?.site_address}</td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">Powered by PourHub</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

        await resend.emails.send({
          from: `PourHub <Hello@contact.pourhub.au>`,
          to: [business.email],
          subject: `${statusEmoji} ${invite.recipient_name} ${response} - ${invite.role} for ${pour?.pour_name}`,
          html: emailHtml,
        });

        console.log("Notification email sent to business");
      } catch (emailErr) {
        console.error("Failed to send notification email:", emailErr);
      }
    }

    // Generate ICS file if accepted
    let icsData: string | null = null;
    if (response === "accepted" && pour?.pour_date) {
      icsData = generateICS(
        pour.pour_name,
        pour.pour_date,
        pour.scheduled_time,
        job?.site_address || "",
        business?.name || "",
        invite.role
      );
    }

    console.log("Response recorded successfully");

    return new Response(
      JSON.stringify({
        success: true,
        response,
        business_name: business?.name || "",
        ics_data: icsData,
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
