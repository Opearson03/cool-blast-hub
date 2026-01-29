import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VariationItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface SendVariationRequest {
  variationId: string;
  clientEmail: string;
  clientName: string;
  variationNumber: string;
  jobName: string;
  jobNumber: string | null;
  siteAddress: string;
  description: string;
  reason: string | null;
  items: VariationItem[];
  amount: number;
  daysExtension: number;
  notes: string | null;
  businessName: string;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessAbn: string | null;
  businessLogoUrl: string | null;
  quotePrimaryColor: string;
  quoteSecondaryColor: string;
  quoteFont: string;
}

// Helper to parse hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [249, 115, 22];
}

// Helper to fetch logo, convert to base64, and get dimensions
async function fetchLogoAsBase64(logoUrl: string | null): Promise<{ base64: string; format: string; width: number; height: number } | null> {
  if (!logoUrl) return null;
  
  try {
    console.log("Fetching logo from:", logoUrl);
    const response = await fetch(logoUrl);
    
    if (!response.ok) {
      console.error("Failed to fetch logo:", response.status);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    const contentType = response.headers.get('content-type') || 'image/png';
    let format = 'PNG';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      format = 'JPEG';
    } else if (contentType.includes('gif')) {
      format = 'GIF';
    }
    
    // Parse image dimensions from the binary data
    let width = 100;
    let height = 100;
    
    try {
      if (format === 'PNG') {
        // PNG: width at bytes 16-19, height at bytes 20-23 (big-endian)
        if (uint8Array.length > 24) {
          width = (uint8Array[16] << 24) | (uint8Array[17] << 16) | (uint8Array[18] << 8) | uint8Array[19];
          height = (uint8Array[20] << 24) | (uint8Array[21] << 16) | (uint8Array[22] << 8) | uint8Array[23];
        }
      } else if (format === 'JPEG') {
        // JPEG: Search for SOF0 marker (0xFF 0xC0) to find dimensions
        for (let i = 0; i < uint8Array.length - 10; i++) {
          if (uint8Array[i] === 0xFF && (uint8Array[i + 1] === 0xC0 || uint8Array[i + 1] === 0xC2)) {
            height = (uint8Array[i + 5] << 8) | uint8Array[i + 6];
            width = (uint8Array[i + 7] << 8) | uint8Array[i + 8];
            break;
          }
        }
      } else if (format === 'GIF') {
        // GIF: width at bytes 6-7, height at bytes 8-9 (little-endian)
        if (uint8Array.length > 10) {
          width = uint8Array[6] | (uint8Array[7] << 8);
          height = uint8Array[8] | (uint8Array[9] << 8);
        }
      }
    } catch (dimError) {
      console.error("Failed to parse image dimensions:", dimError);
    }
    
    console.log("Logo fetched successfully, format:", format, "dimensions:", width, "x", height);
    return { base64, format, width, height };
  } catch (error) {
    console.error('Failed to fetch logo:', error);
    return null;
  }
}

// Helper to calculate logo dimensions preserving aspect ratio
function calculateLogoDimensions(logoData: { width: number; height: number }, maxWidth: number, maxHeight: number): { width: number; height: number } {
  const aspectRatio = logoData.width / logoData.height;
  
  let width = maxWidth;
  let height = width / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width, height };
}

// Map PDF-safe fonts
function getPdfFont(fontName: string): string {
  const fontMap: Record<string, string> = {
    'Arial': 'helvetica',
    'Helvetica': 'helvetica',
    'Times New Roman': 'times',
    'Times': 'times',
    'Courier': 'courier',
    'Courier New': 'courier',
    'Georgia': 'times',
    'Inter': 'helvetica',
    'Roboto': 'helvetica',
  };
  return fontMap[fontName] || 'helvetica';
}

const reasonLabels: Record<string, string> = {
  client_request: "Client Request",
  site_condition: "Site Condition",
  design_change: "Design Change",
  regulatory: "Regulatory",
  other: "Other",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      variationId,
      clientEmail,
      clientName,
      variationNumber,
      jobName,
      jobNumber,
      siteAddress,
      description,
      reason,
      items,
      amount,
      daysExtension,
      notes,
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      businessAbn,
      businessLogoUrl,
      quotePrimaryColor = '#f97316',
      quoteSecondaryColor = '#1f2937',
      quoteFont = 'Arial',
    }: SendVariationRequest = await req.json();

    console.log(`Generating Variation PDF and sending ${variationNumber} to ${clientEmail}`);

    if (!clientEmail) {
      throw new Error("Client email is required");
    }

    // Fetch logo
    const logoData = await fetchLogoAsBase64(businessLogoUrl);

    // Generate PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    const primaryColor = hexToRgb(quotePrimaryColor);
    const secondaryColor = hexToRgb(quoteSecondaryColor);
    const darkColor = [51, 51, 51] as [number, number, number];
    const grayColor = [102, 102, 102] as [number, number, number];
    const pdfFont = getPdfFont(quoteFont);

    // ====== HEADER ======
    // Dark header bar
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo in header (preserve aspect ratio)
    let logoDisplayWidth = 0;
    if (logoData) {
      try {
        const logoDims = calculateLogoDimensions(logoData, 40, 24);
        doc.addImage(`data:image/${logoData.format.toLowerCase()};base64,${logoData.base64}`, logoData.format, margin, 8, logoDims.width, logoDims.height);
        logoDisplayWidth = logoDims.width + 6;
      } catch (e) {
        console.error("Failed to add logo to PDF:", e);
      }
    }

    // Business name in header
    doc.setFontSize(18);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(businessName || "Company Name", logoData ? margin + logoDisplayWidth : margin, 20);
    
    if (businessAbn) {
      doc.setFontSize(9);
      doc.setFont(pdfFont, "normal");
      doc.text(`ABN: ${businessAbn}`, logoData ? margin + logoDisplayWidth : margin, 28);
    }

    // VARIATION title
    doc.setFontSize(20);
    doc.setFont(pdfFont, "bold");
    doc.text("VARIATION", pageWidth - margin, 16, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(variationNumber, pageWidth - margin, 26, { align: 'right' });

    yPos = 48;

    // Contact strip
    doc.setFontSize(9);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    
    let contactX = margin;
    if (businessPhone) {
      doc.text(`Phone: ${businessPhone}`, contactX, yPos);
      contactX += 50;
    }
    if (businessEmail) {
      doc.text(`Email: ${businessEmail}`, contactX, yPos);
    }
    
    const today = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(`Date: ${today}`, pageWidth - margin, yPos, { align: 'right' });
    
    yPos += 4;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // ====== CLIENT & JOB INFO ======
    const boxWidth = (contentWidth - 10) / 2;
    
    // Client box
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, boxWidth, 28, 'FD');
    doc.setLineWidth(2);
    doc.line(margin, yPos, margin, yPos + 28);
    
    doc.setFontSize(8);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("CLIENT", margin + 5, yPos + 6);
    
    doc.setFontSize(12);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(clientName, margin + 5, yPos + 14);
    
    doc.setFontSize(9);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    if (clientEmail) doc.text(clientEmail, margin + 5, yPos + 21);

    // Job box
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin + boxWidth + 10, yPos, boxWidth, 28, 'FD');
    doc.setLineWidth(2);
    doc.line(margin + boxWidth + 10, yPos, margin + boxWidth + 10, yPos + 28);
    
    doc.setFontSize(8);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("JOB DETAILS", margin + boxWidth + 15, yPos + 6);
    
    doc.setFontSize(10);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const jobTitle = jobNumber ? `${jobNumber} - ${jobName}` : jobName;
    doc.text(doc.splitTextToSize(jobTitle, boxWidth - 10)[0], margin + boxWidth + 15, yPos + 14);
    
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(doc.splitTextToSize(siteAddress, boxWidth - 10)[0], margin + boxWidth + 15, yPos + 21);

    yPos += 38;

    // ====== VARIATION DESCRIPTION ======
    doc.setFontSize(11);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("VARIATION DESCRIPTION", margin, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const descLines = doc.splitTextToSize(description, contentWidth);
    doc.text(descLines, margin, yPos);
    yPos += descLines.length * 5 + 5;

    if (reason) {
      doc.setFontSize(9);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Reason: ${reasonLabels[reason] || reason}`, margin, yPos);
      yPos += 8;
    }

    // ====== LINE ITEMS TABLE ======
    if (items && items.length > 0) {
      yPos += 5;
      doc.setFontSize(11);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("COST BREAKDOWN", margin, yPos);
      yPos += 8;

      // Table header
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Description", margin + 3, yPos + 5.5);
      doc.text("Qty", margin + 90, yPos + 5.5);
      doc.text("Unit", margin + 110, yPos + 5.5);
      doc.text("Rate", margin + 130, yPos + 5.5);
      doc.text("Total", pageWidth - margin - 3, yPos + 5.5, { align: 'right' });
      
      yPos += 8;

      // Table rows
      doc.setFont(pdfFont, "normal");
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      items.forEach((item, index) => {
        const rowY = yPos + (index * 8);
        
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, rowY, contentWidth, 8, 'F');
        }
        
        doc.setFontSize(9);
        const descText = doc.splitTextToSize(item.description, 85)[0];
        doc.text(descText, margin + 3, rowY + 5.5);
        doc.text(String(item.quantity), margin + 90, rowY + 5.5);
        doc.text(item.unit, margin + 110, rowY + 5.5);
        doc.text(`$${item.unit_price.toFixed(2)}`, margin + 130, rowY + 5.5);
        doc.text(`$${item.total.toFixed(2)}`, pageWidth - margin - 3, rowY + 5.5, { align: 'right' });
      });

      yPos += items.length * 8 + 5;
    }

    // ====== TOTAL ======
    doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin + 100, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Subtotal (ex GST):", margin + 100, yPos);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`$${amount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    const gst = amount * 0.1;
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("GST (10%):", margin + 100, yPos);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`$${gst.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin + 100, yPos - 2, contentWidth - 100, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL (inc GST):", margin + 103, yPos + 5);
    doc.text(`$${(amount + gst).toFixed(2)}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });
    
    yPos += 18;

    // Days extension if applicable
    if (daysExtension && daysExtension > 0) {
      doc.setFontSize(10);
      doc.setFont(pdfFont, "normal");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Time Extension: ${daysExtension} day${daysExtension > 1 ? 's' : ''}`, margin, yPos);
      yPos += 10;
    }

    // Notes
    if (notes) {
      doc.setFontSize(11);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("NOTES", margin, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setFont(pdfFont, "normal");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      const noteLines = doc.splitTextToSize(notes, contentWidth);
      doc.text(noteLines, margin, yPos);
      yPos += noteLines.length * 4 + 10;
    }

    // ====== APPROVAL SECTION ======
    yPos += 5;
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 35, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, 35, 'S');
    
    doc.setFontSize(10);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("APPROVAL", margin + 5, yPos + 8);
    
    doc.setFontSize(9);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("I hereby approve this variation to the contract.", margin + 5, yPos + 16);
    
    doc.text("Signature: ___________________________", margin + 5, yPos + 26);
    doc.text("Date: _______________", margin + 100, yPos + 26);
    doc.text("Name: ___________________________", margin + 5, yPos + 33);

    // Generate PDF output
    const pdfOutput = doc.output('datauristring');
    const base64Pdf = pdfOutput.split(',')[1];

    console.log("PDF generated successfully, preparing signing token...");

    // Set up Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate signing token expiry (48 hours)
    const signingTokenExpiry = new Date();
    signingTokenExpiry.setHours(signingTokenExpiry.getHours() + 48);

    // Get signing token and update expiry
    const { data: variationData } = await supabaseClient
      .from("job_variations")
      .select("signing_token")
      .eq("id", variationId)
      .single();

    const signingToken = variationData?.signing_token;
    await supabaseClient
      .from("job_variations")
      .update({ signing_token_expires_at: signingTokenExpiry.toISOString() })
      .eq("id", variationId);

    const appDomain = "https://pourhub.com.au";
    const signingUrl = signingToken ? `${appDomain}/sign/variation/${signingToken}` : null;

    // Format sender name
    const senderName = businessName ? `${businessName} via Pourhub` : "Pourhub";
    
    const totalWithGst = amount * 1.1;
    const formattedAmount = totalWithGst.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const emailResponse = await resend.emails.send({
      from: `${senderName} <Hello@pourhub.au>`,
      to: [clientEmail],
      cc: businessEmail ? [businessEmail] : undefined,
      subject: `Variation ${variationNumber} - ${jobName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${quoteSecondaryColor}; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${businessName}</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #374151;">Dear ${clientName},</p>
            <p style="font-size: 16px; color: #374151;">Please find attached a variation order for <strong>${siteAddress}</strong>.</p>
            
            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #6b7280;">Variation:</td><td style="text-align: right; font-weight: bold;">${variationNumber}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Job:</td><td style="text-align: right;">${jobNumber ? `${jobNumber} - ` : ''}${jobName}</td></tr>
                <tr style="border-top: 2px solid ${quotePrimaryColor};"><td style="padding: 12px 0; font-weight: bold; font-size: 18px;">Total:</td><td style="text-align: right; font-weight: bold; font-size: 18px; color: ${quotePrimaryColor};">${formattedAmount}</td></tr>
              </table>
            </div>
            
            ${signingUrl ? `<div style="text-align: center; margin: 20px 0;"><a href="${signingUrl}" style="display: inline-block; background: ${quotePrimaryColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">✍️ Approve & Sign Online</a><p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">— or print the PDF and sign manually —</p></div>` : '<p style="font-size: 14px; color: #6b7280;">Please sign the attached PDF to approve.</p>'}
            
            <p style="color: #374151;">Kind regards,<br><strong>${businessName}</strong></p>
            ${businessPhone ? `<p style="font-size: 14px; color: #6b7280;">📞 ${businessPhone}</p>` : ''}
          </div>
          <div style="text-align: center; padding: 15px; color: #9ca3af; font-size: 12px;">Sent via <a href="https://pourhub.au" style="color: ${quotePrimaryColor};">Pourhub</a></div>
        </div>
      `,
      attachments: [{ filename: `${variationNumber}.pdf`, content: base64Pdf }],
    });

    console.log("Email sent successfully:", emailResponse);

    const { error: updateError } = await supabaseClient
      .from("job_variations")
      .update({ status: "submitted", submitted_at: new Date().toISOString(), submitted_to_email: clientEmail })
      .eq("id", variationId);

    if (updateError) console.error("Failed to update variation status:", updateError);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-variation-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
