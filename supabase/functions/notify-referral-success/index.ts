import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyReferralRequest {
  referrerId: string;
  newMemberName: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referrerId, newMemberName }: NotifyReferralRequest = await req.json();

    if (!referrerId) {
      console.error("Missing referrerId");
      return new Response(
        JSON.stringify({ error: "Missing referrerId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: referrer, error: fetchError } = await supabase
      .from("waiting_list")
      .select("email, full_name, referral_count")
      .eq("id", referrerId)
      .single();

    if (fetchError || !referrer) {
      console.error("Failed to fetch referrer:", fetchError);
      return new Response(
        JSON.stringify({ error: "Referrer not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const referrerName = referrer.full_name || "there";
    const newMemberDisplayName = newMemberName || "A mate";
    const referralCount = referrer.referral_count || 1;
    const freeMonths = 1 + referralCount;

    console.log(`Sending referral success email to ${referrer.email}`);

    const emailResponse = await resend.emails.send({
      from: "PourHub <hello@contact.pourhub.com.au>",
      to: [referrer.email],
      subject: `🎉 ${newMemberDisplayName} just joined using your code!`,
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
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #F97316; font-size: 28px; font-weight: bold;">PourHub</h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 20px 40px 40px 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; text-align: center;">
                        🎉 Nice one, ${referrerName}!
                      </h2>
                      
                      <p style="margin: 0 0 20px 0; color: #a3a3a3; font-size: 16px; line-height: 1.6; text-align: center;">
                        <strong style="color: #ffffff;">${newMemberDisplayName}</strong> just joined the waitlist using your referral code!
                      </p>
                      
                      <!-- Free Months Earned -->
                      <div style="background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0 0 4px 0; color: #ffffff; font-size: 14px;">You've now earned</p>
                        <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: bold;">${freeMonths}</p>
                        <p style="margin: 4px 0 0 0; color: #ffffff; font-size: 14px;">free month${freeMonths !== 1 ? 's' : ''} total</p>
                      </div>
                      
                      <div style="background-color: #1a1a1a; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; color: #a3a3a3; font-size: 14px;">Total referrals: <strong style="color: #ffffff;">${referralCount}</strong></p>
                      </div>
                      
                      <p style="margin: 30px 0 0 0; color: #a3a3a3; font-size: 16px; line-height: 1.6; text-align: center;">
                        Keep sharing your code — every mate who joins earns you another free month!
                      </p>
                      
                      <p style="margin: 20px 0 0 0; color: #a3a3a3; font-size: 16px; text-align: center;">
                        Cheers,<br>
                        <strong style="color: #ffffff;">The PourHub Team</strong>
                      </p>
                    </td>
                  </tr>
                  
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

    console.log("Referral success email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-referral-success function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
