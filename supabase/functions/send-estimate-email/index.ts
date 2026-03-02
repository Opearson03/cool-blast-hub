import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEstimateRequest {
  estimateId: string;
  clientEmail: string;
  clientName: string;
  estimateNumber: string;
  businessName: string;
  businessEmailAlias: string | null; // e.g. "jefconptyltd" for alias@pourhub.au
  totalAmount: string;
  siteAddress: string;
  pdfBase64: string; // Pre-generated PDF from client
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create user-scoped client to validate JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth validation failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { 
      estimateId, 
      clientEmail, 
      clientName,
      estimateNumber,
      businessName,
      businessEmailAlias,
      totalAmount,
      siteAddress,
      pdfBase64,
    }: SendEstimateRequest = await req.json();

    console.log(`Sending estimate ${estimateNumber} to ${clientEmail} with pre-generated PDF`);

    if (!clientEmail) {
      throw new Error("Client email is required");
    }

    if (!pdfBase64) {
      throw new Error("PDF content is required");
    }

    // Initialize service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify estimate belongs to user's business
    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .select("id, business_id")
      .eq("id", estimateId)
      .single();

    if (estimateError || !estimate) {
      console.error("Estimate lookup failed:", estimateError);
      return new Response(
        JSON.stringify({ error: "Estimate not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup failed:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (estimate.business_id !== profile.business_id) {
      console.error(`Access denied: estimate business ${estimate.business_id} != user business ${profile.business_id}`);
      return new Response(
        JSON.stringify({ error: "Access denied - estimate belongs to different business" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a signing token for the accept link
    const signingToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token valid for 30 days

    // Update the estimate with the signing token
    const { error: updateError } = await supabase
      .from("estimates")
      .update({
        signing_token: signingToken,
        signing_token_expires_at: expiresAt.toISOString(),
        status: "sent",
      })
      .eq("id", estimateId);

    if (updateError) {
      console.error("Failed to update estimate with signing token:", updateError);
      throw new Error("Failed to prepare estimate for signing");
    }

    // Get the app URL for the signing link (strip trailing slash if present)
    const appUrl = (Deno.env.get("APP_URL") || "https://pourhub.au").replace(/\/+$/, '');
    const signingLink = `${appUrl}/sign/quote/${signingToken}`;

    // Send email with the pre-generated PDF attachment
    // Resend expects base64 string directly for attachments, not Uint8Array
    // Use business-specific alias if available, otherwise fallback to generic address
    const fromEmail = businessEmailAlias 
      ? `${businessEmailAlias}@contact.pourhub.com.au`
      : 'Hello@contact.pourhub.com.au';
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${businessName} <${fromEmail}>`,
      to: [clientEmail],
      subject: `Quote ${estimateNumber} from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Your Quote is Ready</h2>
          <p>Hi ${clientName},</p>
          <p>Please find attached your quote <strong>${estimateNumber}</strong> for the works at:</p>
          <p style="background: #f3f4f6; padding: 12px; border-radius: 6px;"><strong>${siteAddress}</strong></p>
          <p><strong>Quote Total: ${totalAmount}</strong> (inc. GST)</p>
          <div style="margin: 24px 0;">
            <a href="${signingLink}" 
               style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View & Accept Quote
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Click the button above to review the full quote details and accept online.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            This quote was sent via <a href="https://pourhub.au" style="color: #f97316;">Pourhub</a>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Quote-${estimateNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (emailError) {
      console.error("Resend API error:", emailError);
      throw new Error(emailError.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Estimate sent successfully",
        emailId: emailData?.id,
        signingLink 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-estimate-email function:", error);
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
