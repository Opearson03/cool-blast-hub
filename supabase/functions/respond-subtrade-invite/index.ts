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

// Format phone number to E.164 for AU
function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("61")) return `+${digits}`;
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
  return `+61${digits}`;
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
    const body = await req.json();
    const { token, response, responses } = body;

    // Validate input - either single response or batch responses
    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle batch responses (array of {invite_id, response})
    if (responses && Array.isArray(responses)) {
      return await handleBatchResponses(token, responses);
    }

    // Handle single response (backwards compatible)
    if (!response) {
      return new Response(JSON.stringify({ error: "Response required" }), {
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
        recipient_phone,
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
              logo_url,
              inbound_email_alias
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

    // Auto-add subcontractor to business contacts on accept
    if (response === "accepted") {
      try {
        const { data: existing } = await supabase
          .from("subcontractors")
          .select("id")
          .eq("business_id", invite.business_id)
          .ilike("name", invite.recipient_name)
          .maybeSingle();

        if (!existing) {
          await supabase.from("subcontractors").insert({
            business_id: invite.business_id,
            name: invite.recipient_name,
            email: invite.recipient_email || null,
            phone: invite.recipient_phone || null,
            trade: invite.role || null,
          });
          console.log("Auto-added subcontractor to contacts");
        }
      } catch (err) {
        console.error("Error auto-adding subcontractor contact:", err);
      }
    }

    // Log audit event
    await supabase.from("external_invite_events").insert({
      external_invite_id: invite.id,
      event_type: response,
      metadata: { responded_at: new Date().toISOString() },
    });

    const pour = invite.job_pours as any;
    const job = pour?.jobs as any;
    const business = job?.businesses as any;

    // Format date for messages
    const pourDateFormatted = pour?.pour_date
      ? new Date(pour.pour_date).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "TBA";

    // Send notifications
    await sendSubbieConfirmation(invite, response, pourDateFormatted, business, pour, job);
    await sendBusinessNotification(invite, response, pourDateFormatted, business, pour, job);

    // Log confirmation sent event
    await supabase.from("external_invite_events").insert({
      external_invite_id: invite.id,
      event_type: "confirmation_sent",
      metadata: {
        response,
        sms_sent: !!invite.recipient_phone,
        email_sent: !!invite.recipient_email,
      },
    });

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

// Handle batch responses
async function handleBatchResponses(
  token: string,
  responses: Array<{ invite_id: string; response: "accepted" | "declined" }>
): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const tokenHash = await hashToken(token);

  // Validate all responses
  for (const resp of responses) {
    if (resp.response !== "accepted" && resp.response !== "declined") {
      return new Response(
        JSON.stringify({ error: "Each response must be 'accepted' or 'declined'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Find all invites in this batch
  const { data: batchInvites, error: batchError } = await supabase
    .from("external_invites")
    .select(`
      id,
      status,
      role,
      recipient_name,
      recipient_email,
      recipient_phone,
      notes,
      token_expires_at,
      business_id,
      batch_id,
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
              logo_url,
              inbound_email_alias
            )
          )
        )
    `)
    .eq("batch_token_hash", tokenHash);

  if (batchError || !batchInvites || batchInvites.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid or expired invite link" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate expiration
  const firstInvite = batchInvites[0];
  if (new Date(firstInvite.token_expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "This invite link has expired" }), {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const inviteMap = new Map(batchInvites.map(inv => [inv.id, inv]));
  const results: Array<{ invite_id: string; success: boolean; response: string }> = [];
  const acceptedInvites: any[] = [];
  const declinedInvites: any[] = [];

  // Process each response
  for (const resp of responses) {
    const invite = inviteMap.get(resp.invite_id);
    if (!invite) {
      results.push({ invite_id: resp.invite_id, success: false, response: "not_found" });
      continue;
    }

    // Skip if already responded or revoked
    if (invite.status === "accepted" || invite.status === "declined" || invite.status === "revoked") {
      results.push({ invite_id: resp.invite_id, success: false, response: `already_${invite.status}` });
      continue;
    }

    // Update invite
    const { error: updateError } = await supabase
      .from("external_invites")
      .update({
        status: resp.response,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", resp.invite_id);

    if (updateError) {
      results.push({ invite_id: resp.invite_id, success: false, response: "update_failed" });
      continue;
    }

    // Log audit event
    await supabase.from("external_invite_events").insert({
      external_invite_id: resp.invite_id,
      event_type: resp.response,
      metadata: { responded_at: new Date().toISOString(), batch: true },
    });

    results.push({ invite_id: resp.invite_id, success: true, response: resp.response });

    if (resp.response === "accepted") {
      acceptedInvites.push(invite);

      // Auto-add subcontractor to business contacts on accept
      try {
        const { data: existing } = await supabase
          .from("subcontractors")
          .select("id")
          .eq("business_id", invite.business_id)
          .ilike("name", invite.recipient_name)
          .maybeSingle();

        if (!existing) {
          await supabase.from("subcontractors").insert({
            business_id: invite.business_id,
            name: invite.recipient_name,
            email: invite.recipient_email || null,
            phone: invite.recipient_phone || null,
            trade: invite.role || null,
          });
          console.log("Auto-added subcontractor to contacts (batch)");
        }
      } catch (err) {
        console.error("Error auto-adding subcontractor contact:", err);
      }
    } else {
      declinedInvites.push(invite);
    }
  }

  // Send consolidated notifications
  const firstPour = firstInvite.job_pours as any;
  const job = firstPour?.jobs as any;
  const business = job?.businesses as any;

  // Send confirmation to subbie
  await sendBatchConfirmation(firstInvite, acceptedInvites, declinedInvites, business);

  // Send notification to business
  await sendBatchBusinessNotification(firstInvite, acceptedInvites, declinedInvites, business);

  // Generate ICS data for accepted pours
  const icsDataList: string[] = [];
  for (const invite of acceptedInvites) {
    const pour = invite.job_pours as any;
    const inviteJob = pour?.jobs as any;
    if (pour?.pour_date) {
      icsDataList.push(
        generateICS(
          pour.pour_name,
          pour.pour_date,
          pour.scheduled_time,
          inviteJob?.site_address || "",
          business?.name || "",
          invite.role
        )
      );
    }
  }

  console.log("Batch responses recorded:", results);

  return new Response(
    JSON.stringify({
      success: true,
      results,
      accepted_count: acceptedInvites.length,
      declined_count: declinedInvites.length,
      business_name: business?.name || "",
      ics_data: icsDataList.length === 1 ? icsDataList[0] : null,
      ics_data_list: icsDataList.length > 1 ? icsDataList : null,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Send confirmation to subbie for single invite
async function sendSubbieConfirmation(
  invite: any,
  response: string,
  pourDateFormatted: string,
  business: any,
  pour: any,
  job: any
) {
  const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  // Send SMS
  if (invite.recipient_phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const formattedPhone = formatPhoneE164(invite.recipient_phone);
      let confirmationSms: string;

      if (response === "accepted") {
        confirmationSms = `Confirmed! You're booked for ${pourDateFormatted} with ${business?.name || "the business"}.\nRole: ${invite.role}\nSite: ${job?.site_address || "TBA"}`;
      } else {
        confirmationSms = `Thanks for letting us know. ${business?.name || "We"}'ll keep you in mind for future work.`;
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: twilioPhoneNumber,
          Body: confirmationSms,
        }),
      });
    } catch (err) {
      console.error("SMS error:", err);
    }
  }

  // Send email (simplified - full HTML in original)
  if (invite.recipient_email && resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const statusEmoji = response === "accepted" ? "✅" : "❌";
      const statusText = response === "accepted" ? "Booking Confirmed" : "Response Recorded";

      // Use business-specific alias if available for subbie confirmation
      const fromEmail = business?.inbound_email_alias 
        ? `${business.inbound_email_alias}@pourhub.au`
        : 'Hello@pourhub.au';
      
      await resend.emails.send({
        from: `${business?.name || 'PourHub'} <${fromEmail}>`,
        to: [invite.recipient_email],
        subject: `${statusEmoji} ${statusText} - ${pour?.pour_name || "Work Invite"}`,
        html: `<p>Hi ${invite.recipient_name}, your response has been recorded. ${business?.name} has been notified.</p>`,
      });
    } catch (err) {
      console.error("Email error:", err);
    }
  }
}

// Send notification to business for single invite
async function sendBusinessNotification(
  invite: any,
  response: string,
  pourDateFormatted: string,
  business: any,
  pour: any,
  job: any
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (resendApiKey && business?.email) {
    try {
      const resend = new Resend(resendApiKey);
      const statusEmoji = response === "accepted" ? "✅" : "❌";
      const statusText = response === "accepted" ? "ACCEPTED" : "DECLINED";

      // Use business-specific alias if available for business notification
      const fromEmail = business?.inbound_email_alias 
        ? `${business.inbound_email_alias}@pourhub.au`
        : 'Hello@pourhub.au';
      
      await resend.emails.send({
        from: `${business?.name || 'PourHub'} <${fromEmail}>`,
        to: [business.email],
        subject: `${statusEmoji} ${invite.recipient_name} ${response} - ${invite.role} for ${pour?.pour_name}`,
        html: `<p><strong>${invite.recipient_name}</strong> has <strong>${response}</strong> the invite for ${pour?.pour_name} on ${pourDateFormatted}.</p>`,
      });
    } catch (err) {
      console.error("Business notification error:", err);
    }
  }
}

// Send batch confirmation to subbie
async function sendBatchConfirmation(
  firstInvite: any,
  acceptedInvites: any[],
  declinedInvites: any[],
  business: any
) {
  const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  const acceptedCount = acceptedInvites.length;
  const declinedCount = declinedInvites.length;

  if (acceptedCount === 0 && declinedCount === 0) return;

  // Send SMS
  if (firstInvite.recipient_phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const formattedPhone = formatPhoneE164(firstInvite.recipient_phone);
      let smsMessage: string;

      if (acceptedCount > 0 && declinedCount === 0) {
        smsMessage = `Confirmed! You're booked for ${acceptedCount} pour${acceptedCount > 1 ? "s" : ""} with ${business?.name || "the business"}.`;
      } else if (declinedCount > 0 && acceptedCount === 0) {
        smsMessage = `Thanks for letting us know. ${business?.name || "We"}'ll keep you in mind for future work.`;
      } else {
        smsMessage = `Thanks! You've accepted ${acceptedCount} pour${acceptedCount > 1 ? "s" : ""} and declined ${declinedCount}. ${business?.name} has been notified.`;
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      await fetch(twilioUrl, {
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
    } catch (err) {
      console.error("Batch SMS error:", err);
    }
  }

  // Send email
  if (firstInvite.recipient_email && resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);

      let subject: string;
      if (acceptedCount > 0 && declinedCount === 0) {
        subject = `✅ Confirmed - ${acceptedCount} pour${acceptedCount > 1 ? "s" : ""} with ${business?.name}`;
      } else if (declinedCount > 0 && acceptedCount === 0) {
        subject = `Response Recorded - ${business?.name}`;
      } else {
        subject = `✅ ${acceptedCount} accepted, ❌ ${declinedCount} declined - ${business?.name}`;
      }

      // Use business-specific alias if available
      const fromEmail = business?.inbound_email_alias 
        ? `${business.inbound_email_alias}@pourhub.au`
        : 'Hello@pourhub.au';
      
      await resend.emails.send({
        from: `${business?.name || 'PourHub'} <${fromEmail}>`,
        to: [firstInvite.recipient_email],
        subject,
        html: `<p>Hi ${firstInvite.recipient_name}, your responses have been recorded. ${business?.name} has been notified.</p>`,
      });
    } catch (err) {
      console.error("Batch email error:", err);
    }
  }
}

// Send batch notification to business
async function sendBatchBusinessNotification(
  firstInvite: any,
  acceptedInvites: any[],
  declinedInvites: any[],
  business: any
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey || !business?.email) return;

  const acceptedCount = acceptedInvites.length;
  const declinedCount = declinedInvites.length;

  if (acceptedCount === 0 && declinedCount === 0) return;

  try {
    const resend = new Resend(resendApiKey);

    const acceptedPours = acceptedInvites.map(inv => (inv.job_pours as any)?.pour_name).join(", ");
    const declinedPours = declinedInvites.map(inv => (inv.job_pours as any)?.pour_name).join(", ");

    let subject: string;
    if (acceptedCount > 0 && declinedCount === 0) {
      subject = `✅ ${firstInvite.recipient_name} accepted ${acceptedCount} pour${acceptedCount > 1 ? "s" : ""}`;
    } else if (declinedCount > 0 && acceptedCount === 0) {
      subject = `❌ ${firstInvite.recipient_name} declined ${declinedCount} pour${declinedCount > 1 ? "s" : ""}`;
    } else {
      subject = `${firstInvite.recipient_name} responded - ${acceptedCount} accepted, ${declinedCount} declined`;
    }

    let htmlContent = `<p><strong>${firstInvite.recipient_name}</strong> (${firstInvite.role}) has responded:</p>`;
    if (acceptedCount > 0) {
      htmlContent += `<p>✅ <strong>Accepted:</strong> ${acceptedPours}</p>`;
    }
    if (declinedCount > 0) {
      htmlContent += `<p>❌ <strong>Declined:</strong> ${declinedPours}</p>`;
    }

    // Use business-specific alias if available
    const fromEmail = business?.inbound_email_alias 
      ? `${business.inbound_email_alias}@pourhub.au`
      : 'Hello@pourhub.au';
    
    await resend.emails.send({
      from: `${business?.name || 'PourHub'} <${fromEmail}>`,
      to: [business.email],
      subject,
      html: htmlContent,
    });
  } catch (err) {
    console.error("Batch business notification error:", err);
  }
}

serve(handler);
