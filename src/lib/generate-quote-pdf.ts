import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';

interface GeneratePDFOptions {
  estimate: {
    estimate_number: string;
    client_name: string;
    company_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    site_address: string;
    description: string | null;
    total_amount: number;
    valid_until: string | null;
    notes: string | null;
    created_at: string;
    payment_terms_type?: string | null;
    deposit_percentage?: number | null;
    quote_validity_days?: number | null;
  };
  business: {
    name: string;
    logo_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    abn: string | null;
    quote_template?: string;
    quote_primary_color?: string;
    quote_secondary_color?: string;
    quote_font?: string;
  } | null;
  scopeData?: Record<string, any> | null;
  selectedScopes?: string[] | null;
}

/**
 * Waits for all images in an element to load
 */
const waitForImages = (container: HTMLElement): Promise<void> => {
  return new Promise((resolve) => {
    const maxWait = setTimeout(() => resolve(), 3000); // Max 3s wait
    
    const images = container.querySelectorAll('img');
    if (images.length === 0) {
      clearTimeout(maxWait);
      resolve();
      return;
    }
    
    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= images.length) {
        clearTimeout(maxWait);
        resolve();
      }
    };
    
    images.forEach((img) => {
      if (img.complete) {
        checkAllLoaded();
      } else {
        img.addEventListener('load', checkAllLoaded);
        img.addEventListener('error', checkAllLoaded);
      }
    });
  });
};

/**
 * Generates a PDF from the PrintableEstimate component
 * Returns the PDF as a base64 string (without the data:... prefix)
 */
export const generateQuotePDF = async (options: GeneratePDFOptions): Promise<string> => {
  // Dynamically import PrintableEstimate to avoid circular dependencies
  const { PrintableEstimate } = await import('@/components/estimates/PrintableEstimate');
  
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.id = 'pdf-render-container';
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
    z-index: -1;
  `;
  document.body.appendChild(container);
  
  try {
    // Render the PrintableEstimate component
    const root = createRoot(container);
    
    await new Promise<void>((resolve) => {
      root.render(
        createElement(PrintableEstimate, {
          estimate: options.estimate,
          business: options.business,
          scopeData: options.scopeData,
          selectedScopes: options.selectedScopes,
        })
      );
      // Wait for React to finish rendering
      setTimeout(resolve, 100);
    });
    
    // Wait for images to load (logos, etc.)
    await waitForImages(container);
    
    // Add some additional time for fonts and styles to apply
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Capture the content with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true, // Allow cross-origin images
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });
    
    // Calculate A4 dimensions in mm
    const a4Width = 210;
    const a4Height = 297;
    
    // Calculate the aspect ratio and how many pages we need
    const imgWidth = a4Width;
    const imgHeight = (canvas.height * a4Width) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Add pages as needed
    let heightLeft = imgHeight;
    let position = 0;
    let page = 0;
    
    // Convert canvas to JPEG for smaller file size
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    
    while (heightLeft > 0) {
      if (page > 0) {
        pdf.addPage();
      }
      
      // Add the image, cropping to fit the page
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      
      heightLeft -= a4Height;
      position -= a4Height;
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 10) break;
    }
    
    // Clean up React root
    root.unmount();
    
    // Return the PDF as base64 (without the data:application/pdf;base64, prefix)
    const pdfBase64 = pdf.output('datauristring');
    return pdfBase64.split(',')[1];
    
  } finally {
    // Clean up the container
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};
