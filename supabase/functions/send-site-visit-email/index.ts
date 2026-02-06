import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import Twilio from "npm:twilio@4.19.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SiteVisitRequest {
  clientEmail?: string;
  clientPhone?: string;
  clientName: string;
  siteAddress: string;
  visitDate: string;
  siteVisitTime?: string;
  businessName: string;
  businessPhone: string | null;
  businessEmail: string | null;
  businessEmailAlias: string | null;
  isFollowUp?: boolean;
  notifyMethod?: "email" | "sms" | "both";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      clientEmail, 
      clientPhone,
      clientName,
      siteAddress,
      siteVisitTime,
      businessName,
      businessPhone,
      businessEmail,
      businessEmailAlias,
      isFollowUp,
      notifyMethod = "email",
    } = body as SiteVisitRequest;
    
    const visitDate = body.visitDate || body.siteVisitDate;

    const eventType = isFollowUp ? 'follow-up call' : 'site visit';
    console.log(`Sending ${eventType} confirmation via ${notifyMethod} for ${visitDate}`);

    const results: { email?: any; sms?: any } = {};

    // Format the date nicely
    const formattedDate = new Date(visitDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format time for display
    let formattedTime = 'Time to be confirmed';
    if (siteVisitTime) {
      const [hours, minutes] = siteVisitTime.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    // Send Email if needed
    if ((notifyMethod === "email" || notifyMethod === "both") && clientEmail) {
      // Build contact details section
      let contactInfo = '';
      if (businessPhone || businessEmail) {
        contactInfo = `
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-weight: 600; color: #374151;">Need to reschedule?</p>
            <p style="margin: 0; color: #6b7280;">Contact us and we'll find a time that works for you:</p>
            ${businessPhone ? `<p style="margin: 10px 0 0;"><strong>Phone:</strong> <a href="tel:${businessPhone}" style="color: #f97316;">${businessPhone}</a></p>` : ''}
            ${businessEmail ? `<p style="margin: 5px 0 0;"><strong>Email:</strong> <a href="mailto:${businessEmail}" style="color: #f97316;">${businessEmail}</a></p>` : ''}
          </div>
        `;
      }

      const emailSubject = isFollowUp 
        ? `Follow-up Call Scheduled - ${formattedDate}`
        : `Site Visit Confirmed - ${formattedDate}`;
      
      const headerEmoji = isFollowUp ? '📞' : '📅';
      const cardTitle = isFollowUp ? 'Follow-up Call Details' : 'Site Visit Details';
      const introText = isFollowUp
        ? `We've scheduled a follow-up call to discuss your project and answer any questions you may have.`
        : `Great news! Your site visit has been confirmed. We're looking forward to meeting with you to discuss your project.`;
      const locationLabel = isFollowUp ? 'Regarding Property' : 'Location';
      const closingText = isFollowUp
        ? `We'll be calling you on the scheduled date. Please ensure you're available to take our call.`
        : `Please ensure access to the site is available on the scheduled date. If you have any specific requirements or concerns, feel free to let us know beforehand.`;

      const fromEmail = businessEmailAlias 
        ? `${businessEmailAlias}@pourhub.au`
        : 'Hello@pourhub.au';
      
      const emailResponse = await resend.emails.send({
        from: `${businessName} <${fromEmail}>`,
        to: [clientEmail],
        subject: emailSubject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { padding: 30px 25px; }
              .greeting { font-size: 18px; margin-bottom: 20px; }
              .visit-card { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px solid #fed7aa; border-radius: 12px; padding: 25px; margin: 25px 0; }
              .visit-card h2 { margin: 0 0 20px; color: #c2410c; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
              .visit-detail { display: flex; margin-bottom: 15px; }
              .visit-icon { width: 40px; height: 40px; background: #f97316; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
              .visit-icon svg { width: 20px; height: 20px; fill: white; }
              .visit-info { flex: 1; }
              .visit-label { font-size: 12px; color: #9a3412; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
              .visit-value { font-size: 16px; font-weight: 600; color: #1f2937; }
              .footer { text-align: center; padding: 25px; background: #f9fafb; color: #6b7280; font-size: 13px; }
              .footer p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${businessName}</h1>
              </div>
              <div class="content">
                <p class="greeting">Hi ${clientName},</p>
                <p>${introText}</p>
                
                <div class="visit-card">
                  <h2>${headerEmoji} ${cardTitle}</h2>
                  
                  <div class="visit-detail">
                    <div class="visit-info">
                      <div class="visit-label">Date & Time</div>
                      <div class="visit-value">${formattedDate} at ${formattedTime}</div>
                    </div>
                  </div>
                  
                  <div class="visit-detail">
                    <div class="visit-info">
                      <div class="visit-label">${locationLabel}</div>
                      <div class="visit-value">${siteAddress}</div>
                    </div>
                  </div>
                </div>

                ${contactInfo}
                
                <p>${closingText}</p>
                
                <p>We look forward to speaking with you!</p>
                
                <p style="margin-top: 25px;">
                  Kind regards,<br>
                  <strong>${businessName}</strong>
                </p>
              </div>
              <div class="footer">
                <p>This email was sent by ${businessName}</p>
                <p>Powered by PourHub</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Site visit email sent:", emailResponse);
      results.email = emailResponse;
    }

    // Send SMS if needed
    if ((notifyMethod === "sms" || notifyMethod === "both") && clientPhone) {
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        console.error("Twilio credentials not configured");
        throw new Error("SMS service not configured");
      }

      const client = new Twilio.Twilio(twilioAccountSid, twilioAuthToken);

      const eventLabel = isFollowUp ? "Follow-up call" : "Site visit";
      const smsBody = `Hi ${clientName}, ${eventLabel} confirmed with ${businessName} for ${formattedDate} at ${formattedTime}. Location: ${siteAddress}. ${businessPhone ? `Contact: ${businessPhone}` : ''} - PourHub`;

      const smsResponse = await client.messages.create({
        body: smsBody,
        to: clientPhone,
        from: twilioPhoneNumber,
      });

      console.log("Site visit SMS sent:", smsResponse.sid);
      results.sms = { sid: smsResponse.sid, status: smsResponse.status };
    }

    return new Response(
      JSON.stringify({ success: true, data: results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending site visit notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
