import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  employeeName: string;
  employeeEmail: string;
  businessName: string;
  inviterName: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeName, employeeEmail, businessName, inviterName, role }: InviteEmailRequest = await req.json();

    console.log(`Sending invite email to ${employeeEmail} for ${businessName}`);

    // Validate required fields
    if (!employeeName || !employeeEmail || !businessName) {
      throw new Error("Missing required fields: employeeName, employeeEmail, or businessName");
    }

    const loginUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}` || "https://pourhub.com.au";
    
    const emailResponse = await resend.emails.send({
      from: "PourHub <onboarding@resend.dev>",
      to: [employeeEmail],
      subject: `You've been invited to join ${businessName} on PourHub`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #18181b; padding: 32px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">PourHub</h1>
                      <p style="color: #a1a1aa; margin: 8px 0 0 0; font-size: 14px;">Concrete Management Platform</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 24px;">Hey ${employeeName}!</h2>
                      
                      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        <strong>${inviterName || 'Your employer'}</strong> has invited you to join <strong>${businessName}</strong> on PourHub as a${role === 'admin' ? 'n' : ''} <strong>${role === 'admin' ? 'Admin' : 'Employee'}</strong>.
                      </p>
                      
                      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                        PourHub helps concrete crews manage jobs, timesheets, safety documents, and more — all in one place.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="https://pourhub.com.au/auth?mode=signup&email=${encodeURIComponent(employeeEmail)}" 
                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Create Your Account
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
                        Use your email address <strong>${employeeEmail}</strong> when signing up.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #e4e4e7;">
                      <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
                        © ${new Date().getFullYear()} PourHub. Built for Australian concrete crews.
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

    if (emailResponse?.error) {
      console.error("Resend returned an error:", emailResponse.error);
      throw new Error(emailResponse.error.message);
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse.data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
