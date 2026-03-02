import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
  referralCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, referralCode }: WelcomeEmailRequest = await req.json();

    if (!email || !referralCode) {
      console.error("Missing required fields:", { email, referralCode });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const referralLink = `https://pourhub.com.au?ref=${referralCode}`;
    const displayName = fullName || "there";

    console.log(`Sending welcome email to ${email} with referral code ${referralCode}`);

    const emailResponse = await resend.emails.send({
      from: "PourHub <hello@pourhub.au>",
      to: [email],
      subject: "You're on the PourHub waitlist! 🎉",
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
                      <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px;">Hey ${displayName}! 👋</h2>
                      
                      <p style="margin: 0 0 20px 0; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        You're officially on the PourHub waitlist! We're stoked to have you.
                      </p>

                      <!-- Free Month Highlight -->
                      <div style="background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                        <p style="margin: 0 0 4px 0; color: #ffffff; font-size: 14px;">You've locked in</p>
                        <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold;">1 Month FREE</p>
                        <p style="margin: 4px 0 0 0; color: #ffffff; font-size: 14px;">when PourHub launches 🎉</p>
                      </div>
                      
                      <!-- Referral Section -->
                      <div style="background-color: #1a1a1a; border-radius: 8px; padding: 24px; margin: 30px 0; border: 1px solid #404040;">
                        <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 18px;">🎁 Want more free months?</h3>
                        <p style="margin: 0 0 16px 0; color: #a3a3a3; font-size: 14px; line-height: 1.5;">
                          Refer a mate to the waitlist — when they sign up, you <strong style="color: #F97316;">BOTH</strong> get an extra month FREE. No cap!
                        </p>
                        
                        <div style="background-color: #262626; border: 2px dashed #F97316; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 16px;">
                          <p style="margin: 0 0 8px 0; color: #a3a3a3; font-size: 12px; text-transform: uppercase;">Your Referral Code</p>
                          <p style="margin: 0; color: #F97316; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${referralCode}</p>
                        </div>
                        
                        <p style="margin: 0 0 12px 0; color: #a3a3a3; font-size: 14px; text-align: center;">Or share this link:</p>
                        <div style="background-color: #333333; border-radius: 6px; padding: 12px; text-align: center;">
                          <a href="${referralLink}" style="color: #F97316; font-size: 14px; text-decoration: none; word-break: break-all;">${referralLink}</a>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: center;">
                          <a href="https://cool-blast-hub.lovable.app/waitlist-status" style="display: inline-block; background-color: #F97316; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Check Your Status →</a>
                        </div>
                      </div>
                      <p style="margin: 30px 0 0 0; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        We'll let you know as soon as PourHub is ready for you.
                      </p>
                      
                      <p style="margin: 20px 0 0 0; color: #a3a3a3; font-size: 16px;">
                        Cheers,<br>
                        <strong style="color: #ffffff;">The PourHub Team</strong>
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

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-waitlist-welcome function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
