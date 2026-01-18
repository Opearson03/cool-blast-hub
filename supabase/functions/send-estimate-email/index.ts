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
  businessLogoUrl: string | null;
  quoteTemplate: string;
  quotePrimaryColor: string;
  quoteSecondaryColor: string;
  quoteFont: string;
  totalAmount: string;
  siteAddress: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
  validUntil: string | null;
  paymentTermsType: string;
  depositPercentage: number;
  quoteValidityDays: number;
}

// Helper to wrap text for PDF
function splitTextToLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

// Helper to parse hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [249, 115, 22]; // Default orange
}

// Helper to fetch logo and convert to base64
async function fetchLogoAsBase64(logoUrl: string | null): Promise<{ base64: string; format: string } | null> {
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
    
    console.log("Logo fetched successfully, format:", format);
    return { base64, format };
  } catch (error) {
    console.error('Failed to fetch logo:', error);
    return null;
  }
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
      businessLogoUrl,
      quoteTemplate = 'classic',
      quotePrimaryColor = '#f97316',
      quoteSecondaryColor = '#1f2937',
      quoteFont = 'Arial',
      totalAmount,
      siteAddress,
      description,
      notes,
      createdAt,
      validUntil,
      paymentTermsType = 'deposit_balance',
      depositPercentage = 50,
      quoteValidityDays = 14
    }: SendEstimateRequest = await req.json();

    console.log(`Generating PDF with template "${quoteTemplate}" and sending estimate ${estimateNumber} to ${clientEmail}`);

    if (!clientEmail) {
      throw new Error("Client email is required");
    }

    // Fetch logo
    const logoData = await fetchLogoAsBase64(businessLogoUrl);

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

    // Colors from branding
    const primaryColor = hexToRgb(quotePrimaryColor);
    const secondaryColor = hexToRgb(quoteSecondaryColor);
    const darkColor = [51, 51, 51] as [number, number, number];
    const grayColor = [102, 102, 102] as [number, number, number];
    const pdfFont = getPdfFont(quoteFont);

    // Generate PDF based on template
    if (quoteTemplate === 'modern') {
      // ====== MODERN TEMPLATE ======
      // Dark header bar
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Logo in header
      if (logoData) {
        try {
          doc.addImage(`data:image/${logoData.format.toLowerCase()};base64,${logoData.base64}`, logoData.format, margin, 8, 24, 24);
        } catch (e) {
          console.error("Failed to add logo to PDF:", e);
        }
      }

      // Business name in header
      doc.setFontSize(18);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(businessName || "Company Name", logoData ? margin + 30 : margin, 20);
      
      if (businessAbn) {
        doc.setFontSize(9);
        doc.setFont(pdfFont, "normal");
        doc.text(`ABN: ${businessAbn}`, logoData ? margin + 30 : margin, 28);
      }

      // QUOTE title
      doc.setFontSize(24);
      doc.setFont(pdfFont, "bold");
      doc.text("QUOTE", pageWidth - margin, 18, { align: 'right' });
      
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(estimateNumber, pageWidth - margin, 28, { align: 'right' });

      yPos = 48;

      // Contact strip with primary color underline
      doc.setFontSize(9);
      doc.setFont(pdfFont, "normal");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      
      let contactX = margin;
      if (businessPhone) {
        doc.text(`📞 ${businessPhone}`, contactX, yPos);
        contactX += 50;
      }
      if (businessEmail) {
        doc.text(`✉️ ${businessEmail}`, contactX, yPos);
      }
      
      doc.text(`Date: ${createdAt}`, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 4;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 12;

      // Client and Site boxes
      const boxWidth = (contentWidth - 10) / 2;
      
      // Client box
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, boxWidth, 30, 'FD');
      doc.line(margin, yPos, margin, yPos + 30); // Left accent
      doc.setLineWidth(2);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.line(margin, yPos, margin, yPos + 30);
      
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
      if (clientPhone) doc.text(clientPhone, margin + 5, yPos + 27);

      // Site box
      doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setLineWidth(0.5);
      doc.rect(margin + boxWidth + 10, yPos, boxWidth, 30, 'FD');
      doc.setLineWidth(2);
      doc.line(margin + boxWidth + 10, yPos, margin + boxWidth + 10, yPos + 30);
      
      doc.setFontSize(8);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("SITE LOCATION", margin + boxWidth + 15, yPos + 6);
      
      doc.setFontSize(10);
      doc.setFont(pdfFont, "normal");
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      const siteLines = splitTextToLines(doc, siteAddress, boxWidth - 10);
      doc.text(siteLines, margin + boxWidth + 15, yPos + 14);

      yPos += 40;

    } else if (quoteTemplate === 'minimal') {
      // ====== MINIMAL TEMPLATE ======
      // Clean, spacious layout
      
      // Logo top left
      if (logoData) {
        try {
          doc.addImage(`data:image/${logoData.format.toLowerCase()};base64,${logoData.base64}`, logoData.format, margin, yPos, 30, 30);
          yPos += 35;
        } catch (e) {
          console.error("Failed to add logo to PDF:", e);
        }
      }

      // Business name - understated
      doc.setFontSize(14);
      doc.setFont(pdfFont, "normal");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(businessName || "Company Name", margin, yPos);
      yPos += 15;

      // Quote number and date - minimal style
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Quote ${estimateNumber}  •  ${createdAt}`, margin, yPos);
      if (validUntil) {
        doc.text(`Valid until ${validUntil}`, margin, yPos + 5);
        yPos += 5;
      }
      yPos += 15;

      // Thin divider
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // Client info - minimal
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("To", margin, yPos);
      yPos += 5;
      
      doc.setFontSize(11);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(clientName, margin, yPos);
      yPos += 5;
      
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      if (clientEmail) {
        doc.text(clientEmail, margin, yPos);
        yPos += 5;
      }
      
      yPos += 5;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Site", margin, yPos);
      yPos += 5;
      
      doc.setFontSize(10);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(siteAddress, margin, yPos);
      yPos += 15;

    } else {
      // ====== CLASSIC TEMPLATE (default) ======
      
      // Logo and business name side by side
      let logoWidth = 0;
      if (logoData) {
        try {
          doc.addImage(`data:image/${logoData.format.toLowerCase()};base64,${logoData.base64}`, logoData.format, margin, yPos - 5, 25, 25);
          logoWidth = 30;
        } catch (e) {
          console.error("Failed to add logo to PDF:", e);
        }
      }

      // Header - Business Name
      doc.setFontSize(20);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(businessName || "Company Name", margin + logoWidth, yPos);

      // Business Details (right side)
      doc.setFontSize(10);
      doc.setFont(pdfFont, "normal");
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

      yPos = Math.max(yPos + 20, rightY + 5);

      // ESTIMATE title
      doc.setFontSize(24);
      doc.setFont(pdfFont, "bold");
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
      doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Client Details Section
      const colWidth = contentWidth / 2;
      
      // Bill To
      doc.setFontSize(9);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("BILL TO", margin, yPos);
      
      // Site Address
      doc.text("SITE ADDRESS", margin + colWidth, yPos);
      yPos += 6;

      doc.setFontSize(11);
      doc.setFont(pdfFont, "bold");
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(clientName, margin, yPos);
      
      doc.setFont(pdfFont, "normal");
      const siteLines = splitTextToLines(doc, siteAddress, colWidth - 10);
      doc.text(siteLines, margin + colWidth, yPos);
      
      yPos += 5;
      doc.setFontSize(10);
      doc.setFont(pdfFont, "normal");
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
    }

    // ====== COMMON SECTIONS FOR ALL TEMPLATES ======

    // Scope of Works
    if (description) {
      doc.setFontSize(9);
      doc.setFont(pdfFont, "bold");
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
      doc.setFont(pdfFont, "normal");
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

    // Total Amount Box - Calculate GST breakdown
    const totalAmountNum = parseFloat(totalAmount.replace(/[^0-9.-]+/g, '')) || 0;
    const exGstAmount = totalAmountNum / 1.1;
    const gstAmount = totalAmountNum - exGstAmount;
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 2,
      }).format(amount);
    };

    doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 90, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Subtotal (ex GST)
    doc.setFontSize(10);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Subtotal (ex GST)", pageWidth - margin - 90, yPos);
    doc.text(formatCurrency(exGstAmount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    // GST
    doc.text("GST (10%)", pageWidth - margin - 90, yPos);
    doc.text(formatCurrency(gstAmount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    // Divider before total
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - margin - 90, yPos, pageWidth - margin, yPos);
    yPos += 6;

    // Total (inc GST)
    doc.setFontSize(12);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("Total (inc GST)", pageWidth - margin - 90, yPos);
    
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(totalAmount, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    // Terms & Conditions
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("TERMS & CONDITIONS", margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

    // Generate dynamic payment terms based on settings
    const getPaymentTerms = (): string[] => {
      const validity = quoteValidityDays;
      const deposit = depositPercentage;
      
      switch (paymentTermsType) {
        case 'deposit_balance':
          return [
            `• This quote is valid for ${validity} days from the date of issue.`,
            `• A ${deposit}% deposit is required before commencement of works.`,
            `• Final payment is due upon completion of works.`,
            `• Prices include GST unless otherwise stated.`,
            `• Any variations to the scope of works may result in additional charges.`,
          ];
        case 'progress':
          return [
            `• This quote is valid for ${validity} days from the date of issue.`,
            `• Payment is due in progress claims as milestones are completed.`,
            `• Prices include GST unless otherwise stated.`,
            `• Any variations to the scope of works may result in additional charges.`,
          ];
        case 'on_completion':
          return [
            `• This quote is valid for ${validity} days from the date of issue.`,
            `• Full payment is due upon completion of works.`,
            `• Prices include GST unless otherwise stated.`,
            `• Any variations to the scope of works may result in additional charges.`,
          ];
        case 'net_14':
          return [
            `• This quote is valid for ${validity} days from the date of issue.`,
            `• Payment is due within 14 days of invoice date.`,
            `• Prices include GST unless otherwise stated.`,
            `• Any variations to the scope of works may result in additional charges.`,
          ];
        case 'net_30':
          return [
            `• This quote is valid for ${validity} days from the date of issue.`,
            `• Payment is due within 30 days of invoice date.`,
            `• Prices include GST unless otherwise stated.`,
            `• Any variations to the scope of works may result in additional charges.`,
          ];
        default:
          return [
            `• This quote is valid for ${validity} days from the date of issue.`,
            `• A ${deposit}% deposit is required before commencement of works.`,
            `• Final payment is due upon completion of works.`,
            `• Prices include GST unless otherwise stated.`,
          ];
      }
    };

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
      const paymentTerms = getPaymentTerms();
      paymentTerms.forEach((term) => {
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
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("ACCEPTANCE", margin + 4, yPos);
    yPos += 5;

    doc.setFont(pdfFont, "normal");
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
            .header { background: ${quoteSecondaryColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .highlight { background: #f0f9ff; border-left: 4px solid ${quotePrimaryColor}; padding: 15px; margin: 20px 0; }
            .total { font-size: 24px; font-weight: bold; color: ${quotePrimaryColor}; }
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