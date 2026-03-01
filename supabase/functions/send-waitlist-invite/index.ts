import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Validate staff JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isStaff } = await serviceClient.rpc("is_pourhub_staff", {
      _user_id: claimsData.claims.sub,
    });

    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Access denied: pourhub_staff role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { waitlistId, email, fullName, businessName, checkoutUrl, freeMonths, tier } = await req.json();

    if (!waitlistId || !email || !checkoutUrl) {
      return new Response(JSON.stringify({ error: "waitlistId, email, and checkoutUrl are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const displayName = fullName || "there";
    const months = freeMonths ?? 1;
    const tierLabel = tier === "pro" ? "PourHub Pro" : "PourHub Estimating";
    const tierPrice = tier === "pro" ? "$240" : "$99";

    const emailResponse = await resend.emails.send({
      from: "PourHub <hello@pourhub.au>",
      reply_to: "hello@pourhub.au",
      to: [email],
      subject: `Your PourHub access is ready — ${months} month${months !== 1 ? "s" : ""} free 🎉`,
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
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #262626; border-radius: 12px; overflow: hidden;">
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
                        Great news — your PourHub account is ready to go. We've set you up on the <strong style="color: #ffffff;">${tierLabel}</strong> plan (${tierPrice}/mo) with your free months locked in.
                      </p>

                      <!-- Free Months Highlight -->
                      <div style="background: linear-gradient(135deg, #F97316 0%, #ea580c 100%); border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                        <p style="margin: 0 0 4px 0; color: #ffffff; font-size: 14px; opacity: 0.9;">You start with</p>
                        <p style="margin: 0; color: #ffffff; font-size: 42px; font-weight: bold; line-height: 1;">${months} Month${months !== 1 ? "s" : ""} FREE</p>
                        <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">${tierLabel} · No charge until your trial ends</p>
                      </div>

                      <p style="margin: 0 0 24px 0; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        Click below to set up your account. You'll create your login, enter your business details, and then complete payment — your free period starts from there.
                      </p>
                      
                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${checkoutUrl}" style="display: inline-block; background-color: #F97316; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 18px; letter-spacing: 0.2px;">
                          Set Up Your Account →
                        </a>
                      </div>

                      <!-- What's included -->
                      <div style="background-color: #1a1a1a; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #404040;">
                        <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 16px;">What's included in ${tierLabel}:</h3>
                        ${tier === "pro" ? `
                        <ul style="margin: 0; padding-left: 20px; color: #a3a3a3; font-size: 14px; line-height: 2;">
                          <li>Unlimited professional quotes</li>
                          <li>Job management & scheduling</li>
                          <li>Crew management & timesheets</li>
                          <li>SWMS, ITP & compliance documents</li>
                          <li>Batch truck scheduling</li>
                          <li>And much more</li>
                        </ul>
                        ` : `
                        <ul style="margin: 0; padding-left: 20px; color: #a3a3a3; font-size: 14px; line-height: 2;">
                          <li>Unlimited professional quotes & estimates</li>
                          <li>PDF generation & email delivery</li>
                          <li>Digital client signatures</li>
                          <li>Takeoff tools</li>
                        </ul>
                        `}
                      </div>

                      <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        Have questions? Just reply to this email — we're happy to help.
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
                      <p style="margin: 8px 0 0 0; color: #555555; font-size: 11px;">
                        This link is personalised for ${email}. Do not share it.
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

    // Update the waitlist entry with outreach status
    await serviceClient.rpc("update_waitlist_outreach", {
      _id: waitlistId,
      _outreach_status: "invited",
      _invited_at: new Date().toISOString(),
      _checkout_url: checkoutUrl,
      _checkout_tier: tier,
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[send-waitlist-invite] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
