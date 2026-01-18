import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReferralInviteRequest {
  referrerName: string;
  referralCode: string;
  friendEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referrerName, referralCode, friendEmail }: ReferralInviteRequest = await req.json();

    if (!referralCode || !friendEmail) {
      console.error("Missing required fields:", { referralCode, friendEmail });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const referralLink = `https://pourhub.com.au?ref=${referralCode}`;
    const displayName = referrerName || "Your mate";

    console.log(`Sending referral invite to ${friendEmail} from ${displayName}`);

    const emailResponse = await resend.emails.send({
      from: "PourHub <hello@contact.pourhub.au>",
      to: [friendEmail],
      subject: `${displayName} invited you to join PourHub! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a1a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #262626; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #F97316; font-size: 28px; font-weight: bold;">PourHub</h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px;">Hey! 👋</h2>
                      
                      <p style="margin: 0 0 20px 0; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        <strong style="color: #ffffff;">${displayName}</strong> thinks you'd love PourHub — the all-in-one management platform for Aussie concreters.
                      </p>
                      
                      <!-- Free Month Offer -->
                      <div style="background-color: #F97316; border-radius: 8px; padding: 24px; margin: 30px 0; text-align: center;">
                        <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 20px;">🎁 You Both Get 1 Month FREE!</h3>
                        <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.5;">
                          Join the waitlist using the link below and you'll BOTH get your first month free when PourHub launches.
                        </p>
                      </div>
                      
                      <p style="margin: 0 0 20px 0; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        PourHub helps concreting businesses manage:
                      </p>
                      
                      <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #a3a3a3; font-size: 16px; line-height: 1.8;">
                        <li>Jobs & schedules</li>
                        <li>Estimates & quotes</li>
                        <li>Concrete test results</li>
                        <li>And heaps more...</li>
                      </ul>
                      
                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${referralLink}" style="display: inline-block; background-color: #F97316; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                          Join the Waitlist →
                        </a>
                      </div>
                      
                      <p style="margin: 20px 0 0 0; color: #666666; font-size: 12px; text-align: center;">
                        Or copy this link: <a href="${referralLink}" style="color: #F97316;">${referralLink}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; background-color: #1a1a1a; text-align: center; border-top: 1px solid #333333;">
                      <p style="margin: 0; color: #666666; font-size: 12px;">
                        © ${new Date().getFullYear()} PourHub. Operations management for Australian concreting businesses.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Referral invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-referral-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
