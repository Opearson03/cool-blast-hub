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
  pdfBase64: string;
  clientEmail: string;
  clientName: string;
  estimateNumber: string;
  businessName: string;
  totalAmount: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      estimateId, 
      pdfBase64, 
      clientEmail, 
      clientName, 
      estimateNumber,
      businessName,
      totalAmount 
    }: SendEstimateRequest = await req.json();

    console.log(`Sending estimate ${estimateNumber} to ${clientEmail}`);

    if (!clientEmail) {
      throw new Error("Client email is required");
    }

    if (!pdfBase64) {
      throw new Error("PDF data is required");
    }

    // Remove data URL prefix if present
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

    const emailResponse = await resend.emails.send({
      from: "PourHub <Hello@contact.pourhub.au>",
      to: [clientEmail],
      subject: `Quote ${estimateNumber} from ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .highlight { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
            .total { font-size: 24px; font-weight: bold; color: #0ea5e9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${businessName}</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>Thank you for your interest in our services. Please find attached our quote for your project.</p>
              
              <div class="highlight">
                <p style="margin: 0;"><strong>Quote Reference:</strong> ${estimateNumber}</p>
                <p style="margin: 10px 0 0;"><strong>Total Amount:</strong> <span class="total">${totalAmount}</span></p>
              </div>
              
              <p>If you have any questions about this quote or would like to proceed, please don't hesitate to contact us.</p>
              
              <p>We look forward to working with you.</p>
              
              <p>Kind regards,<br><strong>${businessName}</strong></p>
            </div>
            <div class="footer">
              <p>This quote was generated using PourHub</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `${estimateNumber}.pdf`,
          content: base64Data,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    // Update estimate status to 'sent' in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from("estimates")
      .update({ status: "sent" })
      .eq("id", estimateId);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending estimate email:", error);
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
