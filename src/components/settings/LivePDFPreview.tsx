import { useState, useEffect, useCallback } from "react";
import { Loader2, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { generateQuotePDF } from "@/lib/generate-quote-pdf";

interface LivePDFPreviewProps {
  quoteTemplate: string;
  quotePrimaryColor: string;
  quoteSecondaryColor: string;
  quoteFont: string;
  logoUrl: string | null;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAbn?: string;
}

export function LivePDFPreview({
  quoteTemplate,
  quotePrimaryColor,
  quoteSecondaryColor,
  quoteFont,
  logoUrl,
  businessName,
  businessAddress,
  businessPhone,
  businessEmail,
  businessAbn,
}: LivePDFPreviewProps) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  const generatePreview = useCallback(async () => {
    setGeneratingPreview(true);
    try {
      // Generate a sample PDF using current branding settings
      const sampleEstimate = {
        estimate_number: "Q-PREVIEW",
        client_name: "Sample Customer",
        company_name: null,
        client_email: "customer@example.com",
        client_phone: "0400 000 000",
        site_address: "123 Example Street, Sydney NSW 2000",
        description: "Sample concrete work",
        total_amount: 12500,
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        notes: null,
        created_at: new Date().toISOString(),
      };

      const tempBusiness = {
        name: businessName,
        logo_url: logoUrl,
        address: businessAddress || "123 Business Street",
        phone: businessPhone || "0400 000 000",
        email: businessEmail || "email@company.com",
        abn: businessAbn || null,
        quote_template: quoteTemplate,
        quote_primary_color: quotePrimaryColor,
        quote_secondary_color: quoteSecondaryColor,
        quote_font: quoteFont,
      };

      const pdfBase64 = await generateQuotePDF({
        estimate: sampleEstimate,
        business: tempBusiness,
        scopeData: { 
          _selectedScopes: ["Raft Slab"], 
          _globalMargin: 15,
          "Raft Slab": {
            calculatedTotal: 10869.57, // This will become $12,500 with 15% margin
          }
        },
        selectedScopes: ["Raft Slab"],
      });

      // Convert base64 to blob URL
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Revoke previous URL to prevent memory leaks
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (error) {
      console.error("Failed to generate preview:", error);
    } finally {
      setGeneratingPreview(false);
    }
  }, [
    quoteTemplate,
    quotePrimaryColor,
    quoteSecondaryColor,
    quoteFont,
    logoUrl,
    businessName,
    businessAddress,
    businessPhone,
    businessEmail,
    businessAbn,
  ]);

  // Debounced PDF preview generation
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [generatePreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, []);

  return (
    <div>
      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
        <Eye className="w-4 h-4" />
        Live Preview
      </Label>
      <div
        className="border rounded-lg overflow-hidden bg-muted"
        style={{ height: "400px" }}
      >
        {generatingPreview ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Generating preview...
            </span>
          </div>
        ) : pdfPreviewUrl ? (
          <iframe
            src={pdfPreviewUrl}
            className="w-full h-full"
            title="Quote Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Preview will appear here</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        This is a live preview of your quote template with sample data.
      </p>
    </div>
  );
}
