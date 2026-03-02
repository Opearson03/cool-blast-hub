import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PositionUpdateRequest {
  userId?: string;
  batchAll?: boolean;
  minPositionChange?: number;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, batchAll = false, minPositionChange = 10 } = await req.json() as PositionUpdateRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let usersToNotify: any[] = [];

    if (batchAll) {
      // Get all users who haven't been notified recently (within 24 hours)
      const { data: allUsers, error } = await supabase
        .from("waiting_list")
        .select("*")
        .or("last_position_email_at.is.null,last_position_email_at.lt." + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      usersToNotify = allUsers || [];
    } else if (userId) {
      const { data: user, error } = await supabase
        .from("waiting_list")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (user) usersToNotify = [user];
    }

    const results = [];
    const baseUrl = "https://cool-blast-hub.lovable.app";

    for (const user of usersToNotify) {
      // Calculate current position
      const { data: statusData } = await supabase.rpc("get_waitlist_status", { _user_id: user.id });
      
      if (!statusData || !statusData.found) continue;

      const currentPosition = statusData.effective_position;
      const lastNotifiedPosition = user.last_position_notified;

      // Skip if position hasn't changed enough (unless never notified)
      if (lastNotifiedPosition !== null) {
        const positionChange = lastNotifiedPosition - currentPosition;
        if (positionChange < minPositionChange) {
          continue;
        }
      }

      const displayName = user.full_name || "there";
      const spotsJumped = statusData.spots_jumped || 0;
      const referralCount = statusData.referral_count || 0;
      const isVip = statusData.vip_status;
      const isFounder = user.founder_status;

      let statusMessage = "";
      if (isFounder) {
        statusMessage = `<p style="background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 16px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold;">
          👑 Founding Member - 1 YEAR FREE!
        </p>`;
      } else if (isVip) {
        statusMessage = `<p style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: white; padding: 16px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold;">
          🌟 VIP Status - Early Access Guaranteed!
        </p>`;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">📈 Position Update!</h1>
              </div>

              <p style="color: #333; font-size: 16px; line-height: 1.6;">Hey ${displayName},</p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Great news! Your position on the PourHub waitlist has been updated.</p>

              <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 24px 0;">
                <div style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">#${currentPosition}</div>
                <div style="font-size: 16px; opacity: 0.9;">Your Current Position</div>
                ${spotsJumped > 0 ? `<div style="margin-top: 12px; font-size: 20px; font-weight: bold;">🚀 +${spotsJumped} spots jumped!</div>` : ''}
              </div>

              ${statusMessage}

              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 16px;">Your Referral Stats:</h3>
                <p style="color: #666; margin: 0; font-size: 14px;">
                  👥 <strong>${referralCount}</strong> mate${referralCount !== 1 ? 's' : ''} referred<br>
                  🎯 <strong>${spotsJumped}</strong> total spots jumped
                </p>
              </div>

              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Want to move up even faster? Share your referral code with your mates!
              </p>

              <div style="background: #1a1a1a; color: white; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">Your Referral Code</div>
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${user.referral_code}</div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${baseUrl}/waitlist-status" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Check Your Full Status →
                </a>
              </div>

              <p style="color: #888; font-size: 14px; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                Cheers,<br>
                <strong>The PourHub Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResult = await resend.emails.send({
          from: "PourHub <Hello@contact.pourhub.com.au>",
          to: [user.email],
          subject: `📈 You're now #${currentPosition} on the PourHub waitlist!`,
          html: htmlContent,
        });

        // Update last notified position
        await supabase
          .from("waiting_list")
          .update({
            last_position_notified: currentPosition,
            last_position_email_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        results.push({ userId: user.id, email: user.email, success: true, position: currentPosition });
      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`Failed to send email to ${user.email}:`, emailError);
        results.push({ userId: user.id, email: user.email, success: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: usersToNotify.length,
        sent: results.filter(r => r.success).length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-position-update:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

serve(handler);
