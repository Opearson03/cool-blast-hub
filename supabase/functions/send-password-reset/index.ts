import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: PasswordResetRequest = await req.json();

    console.log(`Processing password reset request for ${email}`);

    if (!email) {
      throw new Error("Email is required");
    }

    // Create Supabase admin client to generate reset link
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use the provided redirectTo or default to the reset-password page
    const resetRedirect = redirectTo || "https://pourhub.com.au/reset-password";
    
    // Generate password reset link using Supabase Admin API
    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: resetRedirect,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resetLink = data?.properties?.action_link;
    
    if (!resetLink) {
      console.error("No reset link generated");
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Reset link generated, sending email...");

    const emailResponse = await resend.emails.send({
      from: "PourHub <Hello@pourhub.au>",
      to: [email],
      subject: "Reset your PourHub password",
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
                      <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 24px;">Reset Your Password</h2>
                      
                      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        We received a request to reset the password for your PourHub account. Click the button below to create a new password.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${resetLink}" 
                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
                        This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
                      </p>
                      
                      <p style="color: #a1a1aa; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${resetLink}" style="color: #71717a; word-break: break-all;">${resetLink}</a>
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

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    // Always return success to prevent email enumeration attacks
    return new Response(
      JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
