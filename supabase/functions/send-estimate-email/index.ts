import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEstimateRequest {
  estimateId: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string | null;
  estimateNumber: string;
  businessName: string;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessAbn: string | null;
  totalAmount: string;
  siteAddress: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
  validUntil: string | null;
}

// Helper to wrap text for PDF
function splitTextToLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      estimateId, 
      clientEmail, 
      clientName,
      clientPhone,
      estimateNumber,
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      businessAbn,
      totalAmount,
      siteAddress,
      description,
      notes,
      createdAt,
      validUntil
    }: SendEstimateRequest = await req.json();

    console.log(`Generating PDF and sending estimate ${estimateNumber} to ${clientEmail}`);

    if (!clientEmail) {
      throw new Error("Client email is required");
    }

    // Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Colors
    const primaryColor = [249, 115, 22]; // Orange
    const darkColor = [51, 51, 51];
    const grayColor = [102, 102, 102];

    // Header - Business Name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(businessName || "Company Name", margin, yPos);

    // Business Details (right side)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    
    let rightY = yPos;
    if (businessAddress) {
      doc.text(businessAddress, pageWidth - margin, rightY, { align: 'right' });
      rightY += 5;
    }
    if (businessPhone) {
      doc.text(`Ph: ${businessPhone}`, pageWidth - margin, rightY, { align: 'right' });
      rightY += 5;
    }
    if (businessEmail) {
      doc.text(businessEmail, pageWidth - margin, rightY, { align: 'right' });
      rightY += 5;
    }
    if (businessAbn) {
      doc.text(`ABN: ${businessAbn}`, pageWidth - margin, rightY, { align: 'right' });
      rightY += 5;
    }

    yPos = Math.max(yPos + 15, rightY + 5);

    // ESTIMATE title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("ESTIMATE", pageWidth - margin, yPos, { align: 'right' });
    
    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(estimateNumber, pageWidth - margin, yPos, { align: 'right' });

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Date: ${createdAt}`, pageWidth - margin, yPos, { align: 'right' });
    
    if (validUntil) {
      yPos += 5;
      doc.text(`Valid Until: ${validUntil}`, pageWidth - margin, yPos, { align: 'right' });
    }

    yPos += 5;

    // Divider line
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Client Details Section
    const colWidth = contentWidth / 2;
    
    // Bill To
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("BILL TO", margin, yPos);
    
    // Site Address
    doc.text("SITE ADDRESS", margin + colWidth, yPos);
    yPos += 6;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(clientName, margin, yPos);
    
    doc.setFont("helvetica", "normal");
    const siteLines = splitTextToLines(doc, siteAddress, colWidth - 10);
    doc.text(siteLines, margin + colWidth, yPos);
    
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    
    if (clientEmail) {
      doc.text(clientEmail, margin, yPos);
      yPos += 5;
    }
    if (clientPhone) {
      doc.text(clientPhone, margin, yPos);
      yPos += 5;
    }

    yPos = Math.max(yPos, yPos + (siteLines.length * 5)) + 10;

    // Scope of Works
    if (description) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("SCOPE OF WORKS", margin, yPos);
      yPos += 6;

      // Background box
      const scopeItems = description.split(" | ");
      const scopeHeight = scopeItems.length * 6 + 10;
      
      doc.setFillColor(249, 249, 249);
      doc.setDrawColor(229, 229, 229);
      doc.roundedRect(margin, yPos - 2, contentWidth, scopeHeight, 2, 2, 'FD');
      
      yPos += 4;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      scopeItems.forEach((item) => {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("•", margin + 4, yPos);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        const itemLines = splitTextToLines(doc, item.trim(), contentWidth - 15);
        doc.text(itemLines, margin + 10, yPos);
        yPos += itemLines.length * 5 + 2;
      });

      yPos += 8;
    }

    // Total Amount Box
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 80, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("Total (inc GST)", pageWidth - margin - 80, yPos);
    
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(totalAmount, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    // Terms & Conditions
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("TERMS & CONDITIONS", margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

    if (notes) {
      const noteLines = notes.split('\n');
      noteLines.forEach((line) => {
        const wrappedLines = splitTextToLines(doc, line, contentWidth);
        wrappedLines.forEach((wl: string) => {
          if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(wl, margin, yPos);
          yPos += 4;
        });
      });
    } else {
      const defaultTerms = [
        "• This quote is valid for 14 days from the date of issue unless otherwise specified.",
        "• A 50% deposit is required before commencement of works.",
        "• Final payment is due upon completion of works.",
        "• Prices include GST unless otherwise stated."
      ];
      defaultTerms.forEach((term) => {
        doc.text(term, margin, yPos);
        yPos += 5;
      });
    }

    yPos += 8;

    // Acceptance Box
    if (yPos > pageHeight - 55) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(249, 249, 249);
    doc.setDrawColor(229, 229, 229);
    doc.roundedRect(margin, yPos, contentWidth, 45, 2, 2, 'FD');
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("ACCEPTANCE", margin + 4, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("I accept this estimate and authorize the commencement of works as described above.", margin + 4, yPos);
    yPos += 10;

    // Signature lines
    const sigLineWidth = (contentWidth - 20) / 2;
    
    doc.setFontSize(7);
    doc.text("Signature", margin + 4, yPos);
    doc.text("Date", margin + 4 + sigLineWidth + 10, yPos);
    yPos += 8;
    
    doc.setDrawColor(153, 153, 153);
    doc.line(margin + 4, yPos, margin + 4 + sigLineWidth - 5, yPos);
    doc.line(margin + 4 + sigLineWidth + 10, yPos, margin + contentWidth - 4, yPos);
    yPos += 8;

    doc.text("Print Name", margin + 4, yPos);
    yPos += 8;
    doc.line(margin + 4, yPos, margin + contentWidth - 4, yPos);

    // Footer
    yPos = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153);
    doc.setDrawColor(238, 238, 238);
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    doc.text(`Thank you for considering ${businessName || "us"} for your project.`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.setFontSize(7);
    doc.text("Generated by PourHub", pageWidth / 2, yPos, { align: 'center' });

    // Get PDF as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    console.log("PDF generated successfully, sending email...");

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
            .highlight { background: #f0f9ff; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; }
            .total { font-size: 24px; font-weight: bold; color: #f97316; }
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
          content: pdfBase64,
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
