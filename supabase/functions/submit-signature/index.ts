import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitSignatureRequest {
  type: 'quote' | 'variation';
  token: string;
  signature: string; // Base64 image data
  signerName: string;
}

// Helper to parse hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [249, 115, 22]; // Default orange
}

// Helper to wrap text for PDF
function splitTextToLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

// Helper to fetch logo as base64
async function fetchLogoAsBase64(logoUrl: string | null): Promise<{ base64: string; format: string; width: number; height: number } | null> {
  if (!logoUrl) return null;
  
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    
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
    }
    
    // Parse image dimensions
    let width = 100;
    let height = 100;
    
    if (format === 'PNG' && uint8Array.length > 24) {
      width = (uint8Array[16] << 24) | (uint8Array[17] << 16) | (uint8Array[18] << 8) | uint8Array[19];
      height = (uint8Array[20] << 24) | (uint8Array[21] << 16) | (uint8Array[22] << 8) | uint8Array[23];
    }
    
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

// Generate signed PDF with embedded signature
async function generateSignedQuotePDF(
  estimate: any,
  business: any,
  signature: string,
  signerName: string,
  signedAt: Date
): Promise<string> {
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

  const primaryColor = hexToRgb(business.quote_primary_color || '#f97316');
  const secondaryColor = hexToRgb(business.quote_secondary_color || '#1f2937');
  const darkColor = [51, 51, 51] as [number, number, number];
  const grayColor = [102, 102, 102] as [number, number, number];
  const pdfFont = 'helvetica';

  // Fetch logo
  const logoData = business.logo_url ? await fetchLogoAsBase64(business.logo_url) : null;

  // Header with logo
  let logoWidth = 0;
  if (logoData) {
    try {
      const logoDims = calculateLogoDimensions(logoData, 40, 25);
      doc.addImage(`data:image/${logoData.format.toLowerCase()};base64,${logoData.base64}`, logoData.format, margin, yPos - 5, logoDims.width, logoDims.height);
      logoWidth = logoDims.width + 5;
    } catch (e) {
      console.error("Failed to add logo to PDF:", e);
    }
  }

  // Business Name
  doc.setFontSize(20);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(business.name || "Company Name", margin + logoWidth, yPos);

  // Business Details (right side)
  doc.setFontSize(10);
  doc.setFont(pdfFont, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  let rightY = yPos;
  if (business.address) {
    doc.text(business.address, pageWidth - margin, rightY, { align: 'right' });
    rightY += 5;
  }
  if (business.phone) {
    doc.text(`Ph: ${business.phone}`, pageWidth - margin, rightY, { align: 'right' });
    rightY += 5;
  }
  if (business.email) {
    doc.text(business.email, pageWidth - margin, rightY, { align: 'right' });
    rightY += 5;
  }
  if (business.abn) {
    doc.text(`ABN: ${business.abn}`, pageWidth - margin, rightY, { align: 'right' });
    rightY += 5;
  }

  yPos = Math.max(yPos + 20, rightY + 5);

  // SIGNED QUOTE title with green accent
  doc.setFontSize(24);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(34, 197, 94); // Green for signed
  doc.text("SIGNED QUOTE", pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(estimate.estimate_number, pageWidth - margin, yPos, { align: 'right' });

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Date: ${new Date(estimate.created_at).toLocaleDateString('en-AU')}`, pageWidth - margin, yPos, { align: 'right' });

  yPos += 5;

  // Divider line
  doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Client Details Section
  const colWidth = contentWidth / 2;
  
  doc.setFontSize(9);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("CLIENT", margin, yPos);
  doc.text("SITE ADDRESS", margin + colWidth, yPos);
  yPos += 6;

  doc.setFontSize(11);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(estimate.client_name, margin, yPos);
  
  doc.setFont(pdfFont, "normal");
  const siteLines = splitTextToLines(doc, estimate.site_address, colWidth - 10);
  doc.text(siteLines, margin + colWidth, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont(pdfFont, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  if (estimate.client_email) {
    doc.text(estimate.client_email, margin, yPos);
    yPos += 5;
  }
  if (estimate.client_phone) {
    doc.text(estimate.client_phone, margin, yPos);
    yPos += 5;
  }

  yPos = Math.max(yPos, yPos + (siteLines.length * 5)) + 10;

  // Scope of Works
  if (estimate.description) {
    doc.setFontSize(9);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("SCOPE OF WORKS", margin, yPos);
    yPos += 6;

    const scopeItems = estimate.description.split(" | ");
    const scopeHeight = scopeItems.length * 6 + 10;
    
    doc.setFillColor(249, 249, 249);
    doc.setDrawColor(229, 229, 229);
    doc.roundedRect(margin, yPos - 2, contentWidth, scopeHeight, 2, 2, 'FD');
    
    yPos += 4;
    doc.setFontSize(10);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    
    scopeItems.forEach((item: string) => {
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
  const totalAmountNum = parseFloat(String(estimate.total_amount)) || 0;
  const exGstAmount = totalAmountNum / 1.1;
  const gstAmount = totalAmountNum - exGstAmount;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 90, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont(pdfFont, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Subtotal (ex GST)", pageWidth - margin - 90, yPos);
  doc.text(formatCurrency(exGstAmount), pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  doc.text("GST (10%)", pageWidth - margin - 90, yPos);
  doc.text(formatCurrency(gstAmount), pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 90, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(12);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("Total (inc GST)", pageWidth - margin - 90, yPos);
  
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(formatCurrency(totalAmountNum), pageWidth - margin, yPos, { align: 'right' });
  yPos += 20;

  // SIGNED ACCEPTANCE SECTION with green border
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(240, 253, 244); // Light green background
  doc.setDrawColor(34, 197, 94); // Green border
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, contentWidth, 60, 3, 3, 'FD');
  yPos += 8;

  // Signed stamp - use text instead of Unicode checkmark for PDF compatibility
  doc.setFontSize(11);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("QUOTE ACCEPTED", margin + 5, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont(pdfFont, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Signed electronically on ${signedAt.toLocaleDateString('en-AU')} at ${signedAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`, margin + 5, yPos);
  yPos += 10;

  // Add signature image
  try {
    // The signature is already base64, just need to add it
    const sigBase64 = signature.startsWith('data:') ? signature : `data:image/png;base64,${signature}`;
    doc.addImage(sigBase64, 'PNG', margin + 5, yPos, 50, 20);
    
    // Signature line under the image
    doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin + 5, yPos + 22, margin + 80, yPos + 22);
    
    // Signer name
    doc.setFontSize(10);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(signerName, margin + 5, yPos + 28);
    
    // Date on the right
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Date: ${signedAt.toLocaleDateString('en-AU')}`, margin + contentWidth - 50, yPos + 28);
  } catch (e) {
    console.error("Failed to add signature to PDF:", e);
    // Still add the name if signature fails
    doc.setFontSize(10);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`Signed by: ${signerName}`, margin + 5, yPos + 10);
  }

  yPos += 35;

  // Footer
  yPos = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.setDrawColor(238, 238, 238);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  doc.text(`Thank you for choosing ${business.name || "us"} for your project.`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.setFontSize(7);
  doc.text("Generated by PourHub • Digitally Signed Document", pageWidth / 2, yPos, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}

// Generate signed Variation PDF with embedded signature
async function generateSignedVariationPDF(
  variation: any,
  job: any,
  business: any,
  signature: string,
  signerName: string,
  signedAt: Date
): Promise<string> {
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

  const primaryColor = hexToRgb(business?.quote_primary_color || '#f97316');
  const darkColor = [51, 51, 51] as [number, number, number];
  const grayColor = [102, 102, 102] as [number, number, number];
  const pdfFont = 'helvetica';

  // Fetch logo
  const logoData = business?.logo_url ? await fetchLogoAsBase64(business.logo_url) : null;

  // Header with logo
  let logoWidth = 0;
  if (logoData) {
    try {
      const logoDims = calculateLogoDimensions(logoData, 40, 25);
      doc.addImage(`data:image/${logoData.format.toLowerCase()};base64,${logoData.base64}`, logoData.format, margin, yPos - 5, logoDims.width, logoDims.height);
      logoWidth = logoDims.width + 5;
    } catch (e) {
      console.error("Failed to add logo to variation PDF:", e);
    }
  }

  // Business Name
  doc.setFontSize(20);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(business?.name || "Company Name", margin + logoWidth, yPos);

  // Business Details (right side)
  doc.setFontSize(10);
  doc.setFont(pdfFont, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  let rightY = yPos;
  if (business?.address) {
    doc.text(business.address, pageWidth - margin, rightY, { align: 'right' });
    rightY += 5;
  }
  if (business?.phone) {
    doc.text(`Ph: ${business.phone}`, pageWidth - margin, rightY, { align: 'right' });
    rightY += 5;
  }
  if (business?.email) {
    doc.text(business.email, pageWidth - margin, rightY, { align: 'right' });
    rightY += 5;
  }
  if (business?.abn) {
    doc.text(`ABN: ${business.abn}`, pageWidth - margin, rightY, { align: 'right' });
    rightY += 5;
  }

  yPos = Math.max(yPos + 20, rightY + 5);

  // APPROVED VARIATION title with green accent
  doc.setFontSize(24);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(34, 197, 94); // Green
  doc.text("APPROVED VARIATION", pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(variation.variation_number, pageWidth - margin, yPos, { align: 'right' });

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Approved: ${signedAt.toLocaleDateString('en-AU')}`, pageWidth - margin, yPos, { align: 'right' });

  yPos += 5;

  // Divider line
  doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Job Details Section
  const colWidth = contentWidth / 2;
  
  doc.setFontSize(9);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("JOB", margin, yPos);
  doc.text("SITE ADDRESS", margin + colWidth, yPos);
  yPos += 6;

  doc.setFontSize(11);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(job?.name || 'N/A', margin, yPos);
  
  doc.setFont(pdfFont, "normal");
  const siteAddr = job?.site_address || 'N/A';
  const siteLines = splitTextToLines(doc, siteAddr, colWidth - 10);
  doc.text(siteLines, margin + colWidth, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont(pdfFont, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  if (job?.builder_client) {
    doc.text(`Client: ${job.builder_client}`, margin, yPos);
    yPos += 5;
  }

  yPos = Math.max(yPos, yPos + (siteLines.length * 5)) + 10;

  // Description
  if (variation.description) {
    doc.setFontSize(9);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("DESCRIPTION", margin, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const descLines = splitTextToLines(doc, variation.description, contentWidth);
    doc.text(descLines, margin, yPos);
    yPos += descLines.length * 5 + 10;
  }

  // Line Items Table
  const items = variation.items as Array<{ description: string; quantity: number; unit: string; unit_price: number; total: number }> || [];
  if (items.length > 0) {
    doc.setFontSize(9);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("COST BREAKDOWN", margin, yPos);
    yPos += 6;

    // Table header
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("Description", margin + 2, yPos + 5);
    doc.text("Qty", margin + 90, yPos + 5);
    doc.text("Unit", margin + 105, yPos + 5);
    doc.text("Rate", margin + 125, yPos + 5);
    doc.text("Total", pageWidth - margin - 5, yPos + 5, { align: 'right' });
    yPos += 10;

    // Table rows
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9);
    items.forEach((item) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      const itemDesc = splitTextToLines(doc, item.description, 85);
      doc.text(itemDesc[0], margin + 2, yPos + 4);
      doc.text(String(item.quantity), margin + 90, yPos + 4);
      doc.text(item.unit || '', margin + 105, yPos + 4);
      doc.text(`$${item.unit_price.toFixed(2)}`, margin + 125, yPos + 4);
      doc.text(`$${item.total.toFixed(2)}`, pageWidth - margin - 5, yPos + 4, { align: 'right' });
      
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, yPos + 7, pageWidth - margin, yPos + 7);
      yPos += 8;
    });
    yPos += 5;
  }

  // Totals
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const subtotal = Number(variation.amount) || 0;
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 90, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont(pdfFont, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Subtotal (ex GST)", pageWidth - margin - 90, yPos);
  doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  doc.text("GST (10%)", pageWidth - margin - 90, yPos);
  doc.text(formatCurrency(gst), pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 90, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(12);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("Total (inc GST)", pageWidth - margin - 90, yPos);
  
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(formatCurrency(total), pageWidth - margin, yPos, { align: 'right' });
  yPos += 20;

  // SIGNED APPROVAL SECTION with green border
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(240, 253, 244); // Light green background
  doc.setDrawColor(34, 197, 94); // Green border
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, contentWidth, 60, 3, 3, 'FD');
  yPos += 8;

  // Approved stamp - use text instead of Unicode checkmark for PDF compatibility
  doc.setFontSize(11);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("VARIATION APPROVED", margin + 5, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont(pdfFont, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Approved electronically on ${signedAt.toLocaleDateString('en-AU')} at ${signedAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`, margin + 5, yPos);
  yPos += 10;

  // Add signature image
  try {
    const sigBase64 = signature.startsWith('data:') ? signature : `data:image/png;base64,${signature}`;
    doc.addImage(sigBase64, 'PNG', margin + 5, yPos, 50, 20);
    
    // Signature line
    doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin + 5, yPos + 22, margin + 80, yPos + 22);
    
    // Signer name
    doc.setFontSize(10);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(signerName, margin + 5, yPos + 28);
    
    // Date
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Date: ${signedAt.toLocaleDateString('en-AU')}`, margin + contentWidth - 50, yPos + 28);
  } catch (e) {
    console.error("Failed to add signature to variation PDF:", e);
    doc.setFontSize(10);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`Approved by: ${signerName}`, margin + 5, yPos + 10);
  }

  // Footer
  yPos = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.setDrawColor(238, 238, 238);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  doc.text(`Thank you for choosing ${business?.name || "us"} for your project.`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.setFontSize(7);
  doc.text("Generated by PourHub • Digitally Signed Document", pageWidth / 2, yPos, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}

// Parse estimate data for job creation (simplified version)
function parseEstimateForJob(estimate: any) {
  const scopeData = estimate.scope_data as Record<string, any> | null;
  const selectedScopes = estimate.selected_scopes as string[] | null;
  
  let estimatedM3 = 0;
  let mpaStrength = '32';
  let slump = '100';
  let finishType = '';
  let concreteSupplier = '';
  const pours: { pour_name: string; estimated_m3?: number; mpa_strength?: string; slump?: string; notes?: string }[] = [];
  const noteParts: string[] = [];
  
  if (scopeData && selectedScopes) {
    for (const scope of selectedScopes) {
      const data = scopeData[scope];
      if (!data) continue;
      
      const moduleAnswers = data.moduleAnswers || {};
      const scopeAnswers = data.scopeAnswers || {};
      
      // Extract concrete data
      const concreteModule = moduleAnswers['concrete-supply'];
      if (concreteModule) {
        estimatedM3 += concreteModule.calculated_volume || 0;
        if (concreteModule.concrete_type) {
          mpaStrength = concreteModule.concrete_type.replace(/MPA/i, '').trim();
        }
      }
      
      // Create a pour for this scope
      const scopeLabel = scope.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      pours.push({
        pour_name: scopeLabel,
        estimated_m3: concreteModule?.calculated_volume || 0,
        mpa_strength: mpaStrength ? `${mpaStrength}MPA` : undefined,
        slump: slump,
        notes: estimate.description?.split(' | ').find((s: string) => s.toLowerCase().includes(scope.replace(/_/g, ' '))) || undefined
      });
    }
  }
  
  // If no pours created, create a default one
  if (pours.length === 0) {
    pours.push({
      pour_name: 'Main Pour',
      estimated_m3: estimatedM3 || undefined,
      mpa_strength: mpaStrength ? `${mpaStrength}MPA` : undefined,
      slump: slump
    });
  }
  
  return {
    name: `${estimate.client_name} - ${estimate.site_address.split(',')[0]}`,
    site_address: estimate.site_address,
    builder_client: estimate.client_name,
    estimated_m3: estimatedM3 || null,
    mpa_strength: mpaStrength ? `${mpaStrength}MPA` : null,
    slump: slump,
    finish_type: finishType || null,
    concrete_supplier: concreteSupplier || null,
    job_notes: estimate.description || null,
    pours: pours,
    source_estimate_id: estimate.id
  };
}

// BOQ Item interface
interface BOQItem {
  id: string;
  category: 'concrete' | 'reinforcement' | 'formwork' | 'finishing' | 'other';
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

// Rebar weights in kg per metre
const REBAR_WEIGHTS: Record<string, number> = {
  'N12': 0.888,
  'N16': 1.58,
  'N20': 2.47,
  'N24': 3.55,
  'N28': 4.83,
  'R10': 0.617,
  'R12': 0.888,
};

// Maps scope key to human-readable label
function getScopeLabel(scopeKey: string): string {
  const labels: Record<string, string> = {
    standard_slab: "Slab on Ground",
    raft_slab: "Raft Slab",
    waffle_pod: "Waffle Pod",
    strip_footings: "Strip Footings",
    piers: "Piers",
    suspended_slab: "Suspended Slab",
    crossovers: "Crossover",
    driveway: "Small Slab",
    paths_surrounds: "Paths & Surrounds",
    retaining_wall: "Retaining Wall",
  };
  return labels[scopeKey] || scopeKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// Generate BOQ items from estimate scope data
function generateBOQFromEstimateData(
  scopeData: Record<string, any> | null,
  selectedScopes: string[] | null,
  description?: string | null
): BOQItem[] {
  // Check if scopeData is empty or has no valid scopes
  const hasValidScopeData = scopeData && selectedScopes && selectedScopes.length > 0 &&
    Object.keys(scopeData).some(key => {
      const entry = scopeData[key];
      return entry && (entry.scopeAnswers || entry.moduleAnswers);
    });

  // If no valid scope data, try to generate from description
  if (!hasValidScopeData) {
    return generateBOQFromDescription(description || null);
  }

  const items: BOQItem[] = [];
  let itemId = 1;

  const addItem = (
    category: BOQItem['category'],
    description: string,
    quantity: number,
    unit: string,
    unitPrice?: number,
    notes?: string
  ) => {
    if (quantity > 0) {
      items.push({
        id: `boq-${itemId++}`,
        category,
        description,
        quantity: Math.round(quantity * 100) / 100,
        unit,
        unitPrice,
        totalPrice: unitPrice ? Math.round(quantity * unitPrice * 100) / 100 : undefined,
        notes,
      });
    }
  };

  // Process each selected scope
  for (const scopeKey of selectedScopes || []) {
    const scopeEntry = scopeData[scopeKey];
    if (!scopeEntry) continue;

    const scopeAnswers = scopeEntry.scopeAnswers || {};
    const moduleAnswers = scopeEntry.moduleAnswers || {};
    const label = getScopeLabel(scopeKey);

    // CONCRETE
    const concreteModule = moduleAnswers["concrete-supply"];
    if (concreteModule) {
      const volume = concreteModule.calculated_volume || 0;
      const concreteType = concreteModule.concrete_type || "32MPA";
      const mpa = concreteType.replace(/MPA/i, "").trim();
      
      if (volume > 0) {
        addItem("concrete", `N${mpa} Concrete (${label})`, volume, "m³", concreteModule.concrete_price);
      }
    }

    // SLAB REINFORCEMENT
    const reoSlabModule = moduleAnswers["reinforcement-slab"];
    if (reoSlabModule) {
      if ((reoSlabModule.reo_type === "mesh" || !reoSlabModule.reo_type) && reoSlabModule.mesh_type) {
        const meshArea = reoSlabModule.mesh_area || scopeAnswers.area || 0;
        const meshSheets = reoSlabModule.mesh_sheets || Math.ceil((meshArea * 1.1) / 14.4);
        if (meshSheets > 0) {
          addItem("reinforcement", `${reoSlabModule.mesh_type} Mesh`, meshSheets, "sheets", reoSlabModule.mesh_price_per_sheet);
        }
      }
      
      if (reoSlabModule.reo_type === "bar" && reoSlabModule.bar_size) {
        const barArea = reoSlabModule.bar_area || scopeAnswers.area || 0;
        const spacing = Number(reoSlabModule.bar_spacing) || 200;
        const layers = Number(reoSlabModule.bar_layers) || 1;
        const barSize = reoSlabModule.bar_size || 'N12';
        const weightPerMetre = REBAR_WEIGHTS[barSize] || 0.888;
        
        const barsPerMetre = 1000 / spacing;
        const sideLength = Math.sqrt(barArea);
        const barsPerDirection = Math.ceil(sideLength * barsPerMetre);
        const totalBarLength = barsPerDirection * sideLength * 2 * layers;
        const totalWeight = totalBarLength * weightPerMetre * 1.1;
        
        if (totalWeight > 0) {
          const pricePerTonne = reoSlabModule.rebar_price_per_tonne || 2100;
          addItem("reinforcement", `${barSize} Rebar @ ${spacing}mm ctrs`, Math.round(totalWeight), "kg", pricePerTonne / 1000);
        }
      }

      if (reoSlabModule.bar_chairs) {
        const area = scopeAnswers.area || 0;
        const chairsPerM2 = reoSlabModule.chairs_per_m2 || 4;
        const chairCount = Math.ceil(area * chairsPerM2);
        if (chairCount > 0) {
          addItem("reinforcement", `Bar Chairs`, chairCount, "pcs", reoSlabModule.chair_price_each);
        }
      }

      if (reoSlabModule.tie_wire && reoSlabModule.tie_wire_coils) {
        addItem("reinforcement", "Tie Wire (1.6mm)", reoSlabModule.tie_wire_coils, "coils", reoSlabModule.tie_wire_price);
      }
    }

    // RAFT REINFORCEMENT
    const reoRaftModule = moduleAnswers["reinforcement-raft"];
    if (reoRaftModule) {
      const totalArea = scopeAnswers.area || 0;
      const defaultSlabReoType = reoRaftModule.slab_reo_type || 'mesh';
      const defaultMeshType = reoRaftModule.mesh_type || 'SL82';
      const lapPercent = 1 + (Number(reoRaftModule.mesh_lap_allowance) || 12.5) / 100;

      if (totalArea > 0 && defaultSlabReoType === 'mesh') {
        const totalMeshArea = totalArea * lapPercent;
        const sheets = Math.ceil(totalMeshArea / 14.4);
        addItem("reinforcement", `${defaultMeshType} Mesh (${label})`, sheets, "sheets", reoRaftModule.mesh_price_per_sheet || 95);
      }

      if (reoRaftModule.bar_chairs) {
        const chairsPerM2 = reoRaftModule.chairs_per_m2 || 4;
        const bags = Math.ceil((totalArea * chairsPerM2) / 100);
        if (bags > 0) {
          addItem("reinforcement", "Bar Chairs", bags, "bags", reoRaftModule.chair_price_per_100 || 35);
        }
      }

      if (reoRaftModule.tie_wire) {
        const coils = reoRaftModule.tie_wire_coils || 2;
        addItem("reinforcement", "Tie Wire (1.6mm)", coils, "coils", reoRaftModule.tie_wire_price || 15);
      }

      // Edge beams
      if (reoRaftModule.edge_beam_reo) {
        const perimeter = scopeAnswers.perimeter || scopeAnswers.edge_beam_length || 0;
        if (perimeter > 0) {
          const tmType = reoRaftModule.edge_beam_tm_type || 'L11TM4';
          const tmLengthWithLap = perimeter * 1.125;
          const tmSheets = Math.ceil(tmLengthWithLap / 6);
          addItem("reinforcement", `Edge Beams – ${tmType}`, tmSheets, "sheets", reoRaftModule.edge_beam_tm_price || 108);
        }
      }

      // Internal beams
      if (reoRaftModule.internal_beam_reo) {
        const totalInternalLength = scopeAnswers.internal_beams_length || 0;
        if (totalInternalLength > 0) {
          const tmType = reoRaftModule.internal_beam_tm_type || 'L11TM4';
          const tmLengthWithLap = totalInternalLength * 1.125;
          const tmSheets = Math.ceil(tmLengthWithLap / 6);
          addItem("reinforcement", `Internal Beams – ${tmType}`, tmSheets, "sheets", reoRaftModule.internal_beam_tm_price || 108);
        }
      }
    }

    // PIER REINFORCEMENT
    const reoPiersModule = moduleAnswers["reinforcement-piers"];
    if (reoPiersModule && reoPiersModule.is_reinforced) {
      const pierCount = scopeAnswers.num_piers || 0;
      if (pierCount > 0) {
        const verticalBars = reoPiersModule.vertical_bars_count || 4;
        const verticalSize = reoPiersModule.vertical_bar_size || 'N16';
        addItem("reinforcement", `Pier Cages (${verticalSize} x ${verticalBars})`, pierCount, "units");
        
        if (reoPiersModule.tie_wire && reoPiersModule.tie_wire_coils) {
          addItem("reinforcement", "Tie Wire (1.6mm)", reoPiersModule.tie_wire_coils, "coils", reoPiersModule.tie_wire_price);
        }
      }
    }

    // FOOTING REINFORCEMENT
    const reoFootingModule = moduleAnswers["reinforcement-footing"];
    if (reoFootingModule) {
      const trenchLength = reoFootingModule.trench_mesh_length || scopeAnswers.trench_length || scopeAnswers.connection_length || 0;
      
      if ((reoFootingModule.reo_type === "trench_mesh" || reoFootingModule.reo_type === "both") && trenchLength > 0) {
        const meshType = reoFootingModule.trench_mesh_type || "L11TM4";
        addItem("reinforcement", `Trench Mesh (${meshType})`, trenchLength, "m", reoFootingModule.trench_mesh_price_per_m);
      }

      if (reoFootingModule.tie_wire && reoFootingModule.tie_wire_coils) {
        addItem("reinforcement", "Tie Wire (1.6mm)", reoFootingModule.tie_wire_coils, "coils", reoFootingModule.tie_wire_price);
      }
    }

    // BASE PREPARATION
    const basePrepModule = moduleAnswers["base-preparation"];
    if (basePrepModule) {
      if (basePrepModule.crusher_dust_required) {
        const area = basePrepModule.crusher_dust_area || scopeAnswers.area || 0;
        const depthMM = Number(basePrepModule.crusher_dust_depth) || 75;
        const volume = area * (depthMM / 1000);
        const tonnes = volume * 1.6;
        if (tonnes > 0) {
          const pricePerM3 = basePrepModule.crusher_dust_price || 60;
          addItem("other", `Crusher Dust (${depthMM}mm)`, Math.round(tonnes * 10) / 10, "tonnes", pricePerM3 / 1.6);
        }
      }

      if (basePrepModule.membrane_required !== false) {
        const membraneArea = basePrepModule.membrane_area || scopeAnswers.area || 0;
        const overlapPercent = 1 + (Number(basePrepModule.membrane_overlap) || 15) / 100;
        const totalArea = membraneArea * overlapPercent;
        const rollsRequired = Math.ceil(totalArea / 200);
        if (rollsRequired > 0) {
          addItem("other", "Poly Membrane", rollsRequired, "rolls", basePrepModule.membrane_price || 180);
          
          // Duct tape - 2 rolls per membrane roll
          const ductTapeRolls = rollsRequired * 2;
          addItem("other", "Duct Tape", ductTapeRolls, "rolls", 4);
        }
      }
    }

    // FORMWORK
    const formworkModule = moduleAnswers["formwork"];
    if (formworkModule && formworkModule.formwork_required) {
      const formworkMetres = formworkModule.formwork_metres || scopeAnswers.perimeter || 0;
      if (formworkMetres > 0) {
        const timberType = formworkModule.timber_type || "90x45";
        addItem("formwork", `Formwork Timber (${timberType})`, formworkMetres, "lm", formworkModule.timber_price || 8);

        if (formworkModule.stakes_included) {
          const stakeCount = Math.ceil(formworkMetres / 0.6) + 1;
          if (stakeCount > 0) {
            addItem("formwork", "Timber Stakes", stakeCount, "pcs", formworkModule.stake_price || 3);
          }
        }
      }
    }

    // CONNECTIONS & JOINTS
    const connectionsModule = moduleAnswers["connections-joints"];
    if (connectionsModule) {
      if (connectionsModule.dowels_required && connectionsModule.dowel_count) {
        const dowelSize = connectionsModule.dowel_size || "N12";
        addItem("reinforcement", `Dowel Bars (${dowelSize})`, connectionsModule.dowel_count, "pcs", connectionsModule.dowel_price_each);
      }

      if (connectionsModule.foam_required && connectionsModule.foam_length) {
        addItem("other", "Expansion Foam", connectionsModule.foam_length, "m", connectionsModule.foam_price_per_m);
      }

      if (connectionsModule.expansion_joints_required && connectionsModule.joint_quantity) {
        addItem("other", "Expansion Joints", connectionsModule.joint_quantity, "pcs", connectionsModule.joint_price_each);
      }
    }

    // CONTROL JOINTS
    const controlModule = moduleAnswers["joints-control"];
    if (controlModule) {
      if (controlModule.saw_cutting_required && controlModule.saw_cut_metres) {
        addItem("finishing", "Saw Cut Control Joints", controlModule.saw_cut_metres, "m", controlModule.saw_cut_price_per_m);
      }
      if (controlModule.caulking_required && controlModule.caulking_metres) {
        addItem("finishing", "Joint Caulking/Sealant", controlModule.caulking_metres, "m", controlModule.caulking_price_per_m);
      }
    }

    // PLUMBING
    const plumbingModule = moduleAnswers["plumbing"];
    if (plumbingModule && plumbingModule.plumbing_required) {
      if (plumbingModule.strip_drain_required && plumbingModule.strip_drain_length && plumbingModule.strip_drain_length > 0) {
        addItem("other", "Strip Drain", plumbingModule.strip_drain_length, "m", plumbingModule.strip_drain_price || 85);
      }
    }

    // SURFACE FINISHING
    const finishingModule = moduleAnswers["surface-finishing"];
    if (finishingModule && finishingModule.finish_required) {
      const finishArea = finishingModule.finish_area || scopeAnswers.area || 0;
      
      if ((finishingModule.sealing_required || finishingModule.sealer_required) && finishingModule.sealer_type) {
        const coverageRate = finishingModule.sealer_coverage_rate || 8;
        const coats = finishingModule.sealer_coats || 2;
        const sealerLitres = Math.ceil((finishArea * coats) / coverageRate);
        if (sealerLitres > 0) {
          addItem("finishing", "Sealer", sealerLitres, "L", finishingModule.sealer_price_per_litre || 35);
        }
      }

      if (finishingModule.curing_required && finishingModule.curing_method !== "water" && finishingModule.curing_method !== "plastic") {
        const coverageRate = finishingModule.curing_coverage_rate || 6;
        const curingLitres = Math.ceil(finishArea / coverageRate);
        if (curingLitres > 0) {
          addItem("finishing", "Curing Compound", curingLitres, "L", finishingModule.curing_product_price || 25);
        }
      }
    }

    // PIERS (scope-specific fallback)
    if (scopeKey === "piers" && scopeAnswers.num_piers && !concreteModule?.calculated_volume) {
      const pierCount = scopeAnswers.num_piers;
      const diameter = scopeAnswers.diameter || 450;
      const depth = scopeAnswers.depth || 1000;
      const radiusM = (diameter / 1000) / 2;
      const depthM = depth / 1000;
      const volumePerPier = Math.PI * radiusM * radiusM * depthM;
      const totalVolume = pierCount * volumePerPier * 1.1;
      addItem("concrete", `N25 Concrete (${label})`, totalVolume, "m³");
    }

    // WAFFLE POD
    if (scopeKey === "waffle_pod") {
      const area = scopeAnswers.area || 0;
      const podSize = Number(scopeAnswers.pod_size) || 1090;
      const ribWidth = Number(scopeAnswers.rib_width) || 110;
      const moduleSize = (podSize + ribWidth) / 1000;
      
      // Use explicit pod_count if provided, otherwise calculate from area
      const podCount = scopeAnswers.pod_count 
        ? Number(scopeAnswers.pod_count)
        : Math.ceil(area / (moduleSize * moduleSize));
      
      if (podCount > 0) {
        const podThickness = Number(scopeAnswers.pod_thickness) || 225;
        addItem("formwork", `Waffle Pods (${podSize}×${podSize}×${podThickness}mm)`, podCount, "units");
      }
    }
  }

  if (items.length === 0) {
    return generateBOQFromDescription(description || null);
  }

  return items;
}

// Fallback: Generate BOQ from description text
function generateBOQFromDescription(description: string | null): BOQItem[] {
  if (!description) return [];

  const items: BOQItem[] = [];
  let itemId = 1;

  const addItem = (
    category: BOQItem['category'],
    desc: string,
    quantity: number,
    unit: string
  ) => {
    if (quantity > 0) {
      items.push({
        id: `boq-${itemId++}`,
        category,
        description: desc,
        quantity: Math.round(quantity * 100) / 100,
        unit,
      });
    }
  };

  // Parse "Standard Slab: 100.0m² standard slab"
  const slabMatch = description.match(/Standard Slab:\s*([\d.]+)\s*m²/i);
  if (slabMatch) {
    const area = parseFloat(slabMatch[1]);
    const volume = area * 0.1 * 1.05;
    addItem("concrete", "N32 Concrete (Standard Slab)", volume, "m³");
    const meshSheets = Math.ceil((area * 1.1) / 14.4);
    addItem("reinforcement", "SL82 Mesh", meshSheets, "sheets");
    addItem("other", "Poly Membrane", area, "m²");
  }

  // Parse "Piers: 10 piers"
  const piersMatch = description.match(/Piers:\s*(\d+)\s*piers?/i);
  if (piersMatch) {
    const count = parseInt(piersMatch[1]);
    const volumePerPier = Math.PI * 0.225 * 0.225 * 1;
    addItem("concrete", "N25 Concrete (Piers)", count * volumePerPier, "m³");
    addItem("reinforcement", "Pier Cages", count, "units");
  }

  // Parse "Driveway: 50.0m² driveway"
  const drivewayMatch = description.match(/Driveway:\s*([\d.]+)\s*m²/i);
  if (drivewayMatch) {
    const area = parseFloat(drivewayMatch[1]);
    if (area > 0) {
      const volume = area * 0.1 * 1.05;
      addItem("concrete", "N32 Concrete (Driveway)", volume, "m³");
      const meshSheets = Math.ceil((area * 1.1) / 14.4);
      addItem("reinforcement", "SL82 Mesh", meshSheets, "sheets");
    }
  }

  // Parse "Concrete: 52.50m³ @ 32MPa"
  const concreteMatch = description.match(/Concrete:\s*([\d.]+)\s*m³\s*@\s*(\d+)\s*MPa/i);
  if (concreteMatch && items.length === 0) {
    const volume = parseFloat(concreteMatch[1]);
    const mpa = concreteMatch[2];
    addItem("concrete", `N${mpa} Concrete`, volume, "m³");
  }

  // Parse "Reo: 39 sheets SL82"
  const reoMatch = description.match(/Reo:\s*(\d+)\s*sheets?\s*(\w+)/i);
  if (reoMatch && !items.find(i => i.category === 'reinforcement')) {
    const sheets = parseInt(reoMatch[1]);
    const meshType = reoMatch[2];
    addItem("reinforcement", `${meshType} Mesh`, sheets, "sheets");
  }

  return items;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, token, signature, signerName }: SubmitSignatureRequest = await req.json();

    if (!type || !token || !signature || !signerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const now = new Date();
    const nowIso = now.toISOString();

    if (type === 'quote') {
      // Validate token and check it hasn't been used
      const { data: estimate, error: fetchError } = await supabase
        .from('estimates')
        .select(`
          id,
          estimate_number,
          client_name,
          client_email,
          client_phone,
          site_address,
          total_amount,
          description,
          notes,
          created_at,
          signed_at,
          signing_token_expires_at,
          business_id,
          scope_data,
          selected_scopes,
          businesses (
            id,
            name,
            email,
            phone,
            address,
            abn,
            logo_url,
            quote_primary_color,
            quote_secondary_color
          )
        `)
        .eq('signing_token', token)
        .single();

      if (fetchError || !estimate) {
        console.error('Token lookup error:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Invalid signing link' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (estimate.signed_at) {
        return new Response(
          JSON.stringify({ error: 'This quote has already been signed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (estimate.signing_token_expires_at && new Date(estimate.signing_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'This signing link has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const business = estimate.businesses as any;

      // Update estimate with signature and mark as accepted
      const { error: updateError } = await supabase
        .from('estimates')
        .update({
          client_signature: signature,
          client_signature_name: signerName,
          signed_at: nowIso,
          status: 'accepted',
          signing_token_expires_at: nowIso // Invalidate token
        })
        .eq('id', estimate.id);

      if (updateError) {
        console.error('Failed to save signature:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save signature' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Signature saved, generating signed PDF...');

      // Generate signed PDF
      let signedPdfBase64: string | null = null;
      try {
        signedPdfBase64 = await generateSignedQuotePDF(estimate, business, signature, signerName, now);
        console.log('Signed PDF generated successfully');
      } catch (pdfError) {
        console.error('Failed to generate signed PDF:', pdfError);
        // Continue without PDF - don't fail the whole request
      }

      // Create job from estimate
      console.log('Creating job from accepted quote...');
      let newJobId: string | null = null;
      
      try {
        const jobData = parseEstimateForJob(estimate);
        const pours = jobData.pours;
        delete (jobData as any).pours;
        
        const { data: newJob, error: jobError } = await supabase
          .from('jobs')
          .insert({
            ...jobData,
            business_id: estimate.business_id,
            job_type: 'retail',
            status: 'scheduled'
          })
          .select('id')
          .single();

        if (jobError) {
          console.error('Failed to create job:', jobError);
        } else {
          newJobId = newJob.id;
          console.log('Job created:', newJobId);

          // Create pours for the job
          if (pours && pours.length > 0) {
            const poursToInsert = pours.map((pour) => ({
              job_id: newJob.id,
              pour_name: pour.pour_name,
              estimated_m3: pour.estimated_m3 || null,
              mpa_strength: pour.mpa_strength || null,
              slump: pour.slump || null,
              notes: pour.notes || null,
              status: 'scheduled'
            }));

            const { error: poursError } = await supabase
              .from('job_pours')
              .insert(poursToInsert);
            
            if (poursError) {
              console.error('Failed to create pours:', poursError);
            } else {
              console.log('Pours created successfully');
            }
          }

          // Generate BOQ from estimate data
          console.log('Generating BOQ from estimate data...');
          try {
            const boqItems = generateBOQFromEstimateData(
              estimate.scope_data as Record<string, any> | null,
              estimate.selected_scopes as string[] | null,
              estimate.description
            );
            
            if (boqItems.length > 0) {
              const { error: boqError } = await supabase
                .from('job_boq')
                .insert({
                  job_id: newJob.id,
                  items: boqItems,
                  notes: `Auto-generated from signed quote ${estimate.estimate_number}`,
                });
              
              if (boqError) {
                console.error('Failed to create BOQ:', boqError);
              } else {
                console.log(`BOQ created with ${boqItems.length} items`);
              }
            }
          } catch (boqErr) {
            console.error('Error generating BOQ:', boqErr);
          }

          // Upload signed PDF to storage and create document record
          if (signedPdfBase64) {
            try {
              // Convert base64 to Uint8Array
              const binaryString = atob(signedPdfBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              const fileName = `${newJob.id}/${Date.now()}-signed-quote-${estimate.estimate_number}.pdf`;
              
              const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, bytes, {
                  contentType: 'application/pdf',
                  upsert: false
                });

              if (uploadError) {
                console.error('Failed to upload signed PDF:', uploadError);
              } else {
                const { data: urlData } = supabase.storage
                  .from('documents')
                  .getPublicUrl(fileName);

                // Create document record linked to job
                const { error: docError } = await supabase
                  .from('documents')
                  .insert({
                    business_id: estimate.business_id,
                    file_name: `Signed Quote - ${estimate.estimate_number}.pdf`,
                    file_type: 'application/pdf',
                    file_url: urlData.publicUrl,
                    category: 'job',
                    reference_id: newJob.id
                  });

                if (docError) {
                  console.error('Failed to create document record:', docError);
                } else {
                  console.log('Signed PDF uploaded and linked to job');
                }
              }
            } catch (uploadErr) {
              console.error('Error uploading signed PDF:', uploadErr);
            }
          }

          // Transfer quote plans to job documents
          console.log('Transferring quote plans to job documents...');
          try {
            // First get the estimate's takeoff
            const { data: takeoff, error: takeoffError } = await supabase
              .from('estimate_takeoffs')
              .select('id')
              .eq('estimate_id', estimate.id)
              .single();

            if (takeoffError && takeoffError.code !== 'PGRST116') {
              console.error('Error fetching takeoff:', takeoffError);
            }

            if (takeoff) {
              // Get all takeoff files
              const { data: takeoffFiles, error: filesError } = await supabase
                .from('takeoff_files')
                .select('*')
                .eq('takeoff_id', takeoff.id)
                .order('sort_order', { ascending: true });

              if (filesError) {
                console.error('Error fetching takeoff files:', filesError);
              }

              if (takeoffFiles && takeoffFiles.length > 0) {
                console.log(`Found ${takeoffFiles.length} plan files to transfer`);
                
                for (let i = 0; i < takeoffFiles.length; i++) {
                  const file = takeoffFiles[i];
                  try {
                    // Fetch the original file
                    const response = await fetch(file.file_url);
                    if (!response.ok) {
                      console.error(`Failed to fetch file: ${file.file_name}`);
                      continue;
                    }
                    
                    const arrayBuffer = await response.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer);
                    
                    // Generate new filename for job documents
                    const planNumber = takeoffFiles.length > 1 ? ` ${i + 1}` : '';
                    const newFileName = `${newJob.id}/${Date.now()}-quote-plan${planNumber}-${file.file_name}`;
                    
                    // Upload to documents storage
                    const { error: uploadError } = await supabase.storage
                      .from('documents')
                      .upload(newFileName, bytes, {
                        contentType: file.file_type || 'application/pdf',
                        upsert: false
                      });

                    if (uploadError) {
                      console.error(`Failed to upload plan file: ${file.file_name}`, uploadError);
                      continue;
                    }

                    const { data: urlData } = supabase.storage
                      .from('documents')
                      .getPublicUrl(newFileName);

                    // Create document record
                    const displayName = takeoffFiles.length > 1 
                      ? `Quote Building Plans (${i + 1} of ${takeoffFiles.length})`
                      : 'Quote Building Plans';
                      
                    const { error: docError } = await supabase
                      .from('documents')
                      .insert({
                        business_id: estimate.business_id,
                        file_name: displayName,
                        file_type: file.file_type || 'application/pdf',
                        file_url: urlData.publicUrl,
                        category: 'job',
                        reference_id: newJob.id
                      });

                    if (docError) {
                      console.error('Failed to create plan document record:', docError);
                    } else {
                      console.log(`Plan transferred: ${displayName}`);
                    }
                  } catch (fileErr) {
                    console.error(`Error transferring file ${file.file_name}:`, fileErr);
                  }
                }
              } else {
                console.log('No plan files found for this estimate');
              }
            } else {
              console.log('No takeoff found for this estimate');
            }
          } catch (plansErr) {
            console.error('Error transferring plans:', plansErr);
          }
        }
      } catch (jobErr) {
        console.error('Error creating job:', jobErr);
      }

      // Send signed PDF to client
      if (resend && estimate.client_email && signedPdfBase64) {
        try {
          const senderName = business?.name ? `${business.name} via Pourhub` : "Pourhub";
          
          await resend.emails.send({
            from: `${senderName} <Hello@contact.pourhub.au>`,
            to: estimate.client_email,
            cc: business?.email ? [business.email] : undefined,
            subject: `Your Signed Quote ${estimate.estimate_number} - Confirmed`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { padding: 30px 20px; background: #f9f9f9; }
                  .highlight { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">✓ Quote Accepted</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${estimate.client_name},</p>
                    <p>Thank you for accepting our quote! This email confirms your acceptance and includes a copy of your signed quote for your records.</p>
                    
                    <div class="highlight">
                      <p style="margin: 0;"><strong>Quote Reference:</strong> ${estimate.estimate_number}</p>
                      <p style="margin: 10px 0 0;"><strong>Total Amount:</strong> $${Number(estimate.total_amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
                      <p style="margin: 10px 0 0;"><strong>Signed By:</strong> ${signerName}</p>
                      <p style="margin: 10px 0 0;"><strong>Date:</strong> ${now.toLocaleDateString('en-AU')}</p>
                    </div>
                    
                    <p>We will be in touch shortly to discuss next steps and scheduling.</p>
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Kind regards,<br><strong>${business?.name || 'The Team'}</strong></p>
                  </div>
                  <div class="footer">
                    <p>A copy of your signed quote is attached to this email.</p>
                    <p style="font-size: 10px; color: #9ca3af;">Powered by PourHub</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            attachments: [
              {
                filename: `Signed-Quote-${estimate.estimate_number}.pdf`,
                content: signedPdfBase64,
              },
            ],
          });
          console.log('Signed quote email sent to client');
        } catch (clientEmailError) {
          console.error('Failed to send signed quote to client:', clientEmailError);
        }
      }

      // Send notification email to business
      if (resend && business?.email) {
        try {
          await resend.emails.send({
            from: 'PourHub <notifications@pourhub.com.au>',
            to: business.email,
            subject: `Quote ${estimate.estimate_number} Signed by ${signerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22c55e;">Quote Accepted! 🎉</h2>
                <p>Great news! Your quote has been signed and accepted.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                  <p><strong>Quote Number:</strong> ${estimate.estimate_number}</p>
                  <p><strong>Client:</strong> ${estimate.client_name}</p>
                  <p><strong>Site:</strong> ${estimate.site_address || 'Not specified'}</p>
                  <p><strong>Amount:</strong> $${Number(estimate.total_amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
                  <p><strong>Signed By:</strong> ${signerName}</p>
                  <p><strong>Signed At:</strong> ${now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</p>
                </div>
                <p style="background: #dbeafe; padding: 15px; border-radius: 8px;">
                  <strong>✓ A job has been automatically created</strong><br>
                  The signed quote PDF has been uploaded to the job documents.
                </p>
                <p>Log in to PourHub to view the job and start scheduling.</p>
              </div>
            `
          });
          console.log('Notification email sent to business');
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Quote signed successfully',
          documentNumber: estimate.estimate_number,
          jobCreated: !!newJobId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'variation') {
      // Validate token
      const { data: variation, error: fetchError } = await supabase
        .from('job_variations')
        .select(`
          id,
          variation_number,
          description,
          amount,
          items,
          signed_at,
          signing_token_expires_at,
          job_id,
          business_id,
          submitted_to_email,
          jobs (
            name,
            builder_client,
            site_address,
            business_id,
            businesses (
              name,
              email,
              phone,
              address,
              abn,
              logo_url,
              quote_primary_color,
              quote_secondary_color
            )
          )
        `)
        .eq('signing_token', token)
        .single();

      if (fetchError || !variation) {
        console.error('Token lookup error:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Invalid signing link' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (variation.signed_at) {
        return new Response(
          JSON.stringify({ error: 'This variation has already been approved' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (variation.signing_token_expires_at && new Date(variation.signing_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'This signing link has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update variation with signature
      const { error: updateError } = await supabase
        .from('job_variations')
        .update({
          client_signature: signature,
          client_signature_name: signerName,
          signed_at: nowIso,
          approved_at: nowIso,
          approved_by: signerName,
          status: 'approved',
          signing_token_expires_at: nowIso // Invalidate token
        })
        .eq('id', variation.id);

      if (updateError) {
        console.error('Failed to save signature:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save signature' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Variation signature saved, generating signed PDF...');

      const job = variation.jobs as any;
      const business = job?.businesses as any;

      // Generate signed variation PDF
      let signedPdfBase64: string | null = null;
      try {
        signedPdfBase64 = await generateSignedVariationPDF(variation, job, business, signature, signerName, now);
        console.log('Signed variation PDF generated successfully');
      } catch (pdfError) {
        console.error('Failed to generate signed variation PDF:', pdfError);
      }

      // Upload signed PDF to storage and create document record
      if (signedPdfBase64 && variation.job_id) {
        try {
          const binaryString = atob(signedPdfBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const fileName = `${variation.job_id}/${Date.now()}-signed-variation-${variation.variation_number}.pdf`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, bytes, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (uploadError) {
            console.error('Failed to upload signed variation PDF:', uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(fileName);

            const { error: docError } = await supabase
              .from('documents')
              .insert({
                business_id: variation.business_id,
                file_name: `Signed Variation - ${variation.variation_number}.pdf`,
                file_type: 'application/pdf',
                file_url: urlData.publicUrl,
                category: 'job',
                reference_id: variation.job_id
              });

            if (docError) {
              console.error('Failed to create variation document record:', docError);
            } else {
              console.log('Signed variation PDF uploaded and linked to job');
            }
          }
        } catch (uploadErr) {
          console.error('Error uploading signed variation PDF:', uploadErr);
        }
      }

      // Send signed PDF to client
      const clientEmail = variation.submitted_to_email;
      if (resend && clientEmail && signedPdfBase64) {
        try {
          const senderName = business?.name ? `${business.name} via Pourhub` : "Pourhub";
          const totalAmount = (Number(variation.amount) * 1.1);
          
          await resend.emails.send({
            from: `${senderName} <Hello@contact.pourhub.au>`,
            to: clientEmail,
            cc: business?.email ? [business.email] : undefined,
            subject: `Approved: Variation ${variation.variation_number} - ${job?.name || 'Job'}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { padding: 30px 20px; background: #f9f9f9; }
                  .highlight { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">✓ Variation Approved</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${signerName},</p>
                    <p>Thank you for approving this variation. This email confirms your approval and includes a copy of the signed variation for your records.</p>
                    
                    <div class="highlight">
                      <p style="margin: 0;"><strong>Variation:</strong> ${variation.variation_number}</p>
                      <p style="margin: 10px 0 0;"><strong>Job:</strong> ${job?.name || 'N/A'}</p>
                      <p style="margin: 10px 0 0;"><strong>Amount:</strong> $${totalAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} inc GST</p>
                      <p style="margin: 10px 0 0;"><strong>Approved By:</strong> ${signerName}</p>
                      <p style="margin: 10px 0 0;"><strong>Date:</strong> ${now.toLocaleDateString('en-AU')}</p>
                    </div>
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Kind regards,<br><strong>${business?.name || 'The Team'}</strong></p>
                  </div>
                  <div class="footer">
                    <p>A copy of your approved variation is attached to this email.</p>
                    <p style="font-size: 10px; color: #9ca3af;">Powered by PourHub</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            attachments: [
              {
                filename: `Signed-Variation-${variation.variation_number}.pdf`,
                content: signedPdfBase64,
              },
            ],
          });
          console.log('Signed variation email sent to client');
        } catch (clientEmailError) {
          console.error('Failed to send signed variation to client:', clientEmailError);
        }
      }

      // Send notification email to business
      if (resend && business?.email) {
        try {
          await resend.emails.send({
            from: 'PourHub <notifications@pourhub.com.au>',
            to: business.email,
            subject: `Variation ${variation.variation_number} Approved by ${signerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22c55e;">Variation Approved! ✅</h2>
                <p>A variation has been approved by the client.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                  <p><strong>Variation Number:</strong> ${variation.variation_number}</p>
                  <p><strong>Job:</strong> ${job?.name || 'N/A'}</p>
                  <p><strong>Description:</strong> ${variation.description}</p>
                  <p><strong>Amount:</strong> $${Number(variation.amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })} + GST</p>
                  <p><strong>Approved By:</strong> ${signerName}</p>
                  <p><strong>Approved At:</strong> ${now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</p>
                </div>
                <p style="background: #dbeafe; padding: 15px; border-radius: 8px;">
                  <strong>✓ The signed variation PDF has been uploaded to the job documents.</strong>
                </p>
                <p>Log in to PourHub to view the approved variation.</p>
              </div>
            `
          });
          console.log('Notification email sent to business');
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Variation approved successfully',
          documentNumber: variation.variation_number
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid document type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error submitting signature:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit signature' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
