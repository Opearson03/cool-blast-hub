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

  // Signed stamp
  doc.setFontSize(11);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("✓ QUOTE ACCEPTED", margin + 5, yPos);
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

  // Approved stamp
  doc.setFontSize(11);
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("✓ VARIATION APPROVED", margin + 5, yPos);
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
