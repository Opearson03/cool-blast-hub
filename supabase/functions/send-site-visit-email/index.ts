import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SiteVisitEmailRequest {
  clientEmail: string;
  clientName: string;
  siteAddress: string;
  visitDate: string;
  businessName: string;
  businessPhone: string | null;
  businessEmail: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientEmail, 
      clientName,
      siteAddress,
      visitDate,
      businessName,
      businessPhone,
      businessEmail,
    }: SiteVisitEmailRequest = await req.json();

    console.log(`Sending site visit confirmation to ${clientEmail} for ${visitDate}`);

    if (!clientEmail) {
      throw new Error("Client email is required");
    }

    // Format the date nicely
    const formattedDate = new Date(visitDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

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

    const emailResponse = await resend.emails.send({
      from: "PourHub <Hello@contact.pourhub.au>",
      to: [clientEmail],
      subject: `Site Visit Confirmed - ${formattedDate}`,
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
              <p>Great news! Your site visit has been confirmed. We're looking forward to meeting with you to discuss your project.</p>
              
              <div class="visit-card">
                <h2>📅 Site Visit Details</h2>
                
                <div class="visit-detail">
                  <div class="visit-info">
                    <div class="visit-label">Date</div>
                    <div class="visit-value">${formattedDate}</div>
                  </div>
                </div>
                
                <div class="visit-detail">
                  <div class="visit-info">
                    <div class="visit-label">Location</div>
                    <div class="visit-value">${siteAddress}</div>
                  </div>
                </div>
              </div>

              ${contactInfo}
              
              <p>Please ensure access to the site is available on the scheduled date. If you have any specific requirements or concerns, feel free to let us know beforehand.</p>
              
              <p>We look forward to seeing you!</p>
              
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

    console.log("Site visit email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending site visit email:", error);
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
