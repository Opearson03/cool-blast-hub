import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Calendar, DollarSign, Mail, Phone, MapPin, Send, Loader2, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrintableEstimate } from "./PrintableEstimate";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type EstimateStatus = "draft" | "sent" | "accepted" | "declined";

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  site_address: string;
  description: string | null;
  total_amount: number;
  status: EstimateStatus;
  created_at: string;
  valid_until: string | null;
  notes: string | null;
}

interface EstimateDetailSheetProps {
  estimate: Estimate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToJob?: (estimate: Estimate) => void;
}

const statusConfig: Record<EstimateStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
};

export function EstimateDetailSheet({ estimate, open, onOpenChange, onConvertToJob }: EstimateDetailSheetProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch business details for the estimate
  const { data: business } = useQuery({
    queryKey: ["business-for-estimate"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return null;

      const { data: businessData } = await supabase
        .from("businesses")
        .select("name, logo_url, address, phone, email, abn")
        .eq("id", profile.business_id)
        .single();

      return businessData;
    },
    enabled: open,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const generateHTMLContent = useCallback((): string => {
    const descriptionItems = estimate?.description?.split(' | ').map(p => `<li style="margin-bottom: 4px;">• ${p}</li>`).join('') || '';
    const notesContent = estimate?.notes?.split('\n').map(line => `<p style="margin: 2px 0; font-size: 11px;">${line}</p>`).join('') || '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 25px; }
          .company-info { display: flex; gap: 15px; }
          .company-details h1 { margin: 0 0 5px 0; font-size: 20px; }
          .company-details p { margin: 2px 0; font-size: 12px; color: #666; }
          .estimate-info { text-align: right; }
          .estimate-title { font-size: 24px; font-weight: bold; margin: 0; }
          .estimate-number { font-size: 16px; color: #f97316; font-weight: bold; margin: 5px 0; }
          .estimate-date { font-size: 12px; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; }
          .client-grid { display: flex; gap: 40px; margin-bottom: 20px; }
          .client-box { flex: 1; }
          .scope-box { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 6px; padding: 15px; }
          .scope-list { list-style: none; padding: 0; margin: 0; }
          .scope-list li { font-size: 13px; color: #333; }
          .total-section { display: flex; justify-content: flex-end; margin: 25px 0; }
          .total-box { border-top: 2px solid #333; padding-top: 12px; min-width: 250px; }
          .total-row { display: flex; justify-content: space-between; align-items: center; }
          .total-label { font-size: 16px; font-weight: bold; }
          .total-amount { font-size: 22px; font-weight: bold; color: #f97316; }
          .terms-section { border-top: 1px solid #ddd; padding-top: 15px; margin-bottom: 20px; }
          .acceptance-box { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 6px; padding: 15px; margin-bottom: 20px; }
          .signature-grid { display: flex; gap: 30px; margin-top: 15px; }
          .signature-field { flex: 1; }
          .signature-label { font-size: 10px; color: #666; margin-bottom: 4px; }
          .signature-line { border-bottom: 1px solid #999; height: 25px; }
          .footer { text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; }
          .footer p { font-size: 10px; color: #999; margin: 3px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            ${business?.logo_url ? `<img src="${business.logo_url}" alt="Logo" style="height: 50px; width: 50px; object-fit: contain;">` : ''}
            <div class="company-details">
              <h1>${business?.name || 'Company Name'}</h1>
              ${business?.address ? `<p>${business.address}</p>` : ''}
              ${business?.phone ? `<p>Ph: ${business.phone}</p>` : ''}
              ${business?.email ? `<p>${business.email}</p>` : ''}
              ${business?.abn ? `<p>ABN: ${business.abn}</p>` : ''}
            </div>
          </div>
          <div class="estimate-info">
            <p class="estimate-title">ESTIMATE</p>
            <p class="estimate-number">${estimate?.estimate_number}</p>
            <p class="estimate-date">Date: ${estimate ? format(new Date(estimate.created_at), "d MMMM yyyy") : ''}</p>
            ${estimate?.valid_until ? `<p class="estimate-date">Valid Until: ${format(new Date(estimate.valid_until), "d MMMM yyyy")}</p>` : ''}
          </div>
        </div>
        
        <div class="client-grid">
          <div class="client-box">
            <p class="section-title">Bill To</p>
            <p style="font-weight: bold; margin: 0 0 3px 0;">${estimate?.client_name}</p>
            ${estimate?.client_email ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">${estimate.client_email}</p>` : ''}
            ${estimate?.client_phone ? `<p style="font-size: 12px; color: #666; margin: 2px 0;">${estimate.client_phone}</p>` : ''}
          </div>
          <div class="client-box">
            <p class="section-title">Site Address</p>
            <p style="margin: 0; font-size: 13px;">${estimate?.site_address}</p>
          </div>
        </div>
        
        ${descriptionItems ? `
        <div class="section">
          <p class="section-title">Scope of Works</p>
          <div class="scope-box">
            <ul class="scope-list">${descriptionItems}</ul>
          </div>
        </div>
        ` : ''}
        
        <div class="total-section">
          <div class="total-box">
            <div class="total-row">
              <span class="total-label">Total (inc GST)</span>
              <span class="total-amount">${formatCurrency(estimate?.total_amount || 0)}</span>
            </div>
          </div>
        </div>
        
        <div class="terms-section">
          <p class="section-title">Terms & Conditions</p>
          ${notesContent || `
            <p style="font-size: 11px; margin: 2px 0;">• This quote is valid for 14 days from the date of issue unless otherwise specified.</p>
            <p style="font-size: 11px; margin: 2px 0;">• A 50% deposit is required before commencement of works.</p>
            <p style="font-size: 11px; margin: 2px 0;">• Final payment is due upon completion of works.</p>
            <p style="font-size: 11px; margin: 2px 0;">• Prices include GST unless otherwise stated.</p>
          `}
        </div>
        
        <div class="acceptance-box">
          <p class="section-title" style="margin-top: 0;">Acceptance</p>
          <p style="font-size: 11px; color: #666; margin-bottom: 15px;">I accept this estimate and authorize the commencement of works as described above.</p>
          <div class="signature-grid">
            <div class="signature-field">
              <p class="signature-label">Signature</p>
              <div class="signature-line"></div>
            </div>
            <div class="signature-field">
              <p class="signature-label">Date</p>
              <div class="signature-line"></div>
            </div>
          </div>
          <div style="margin-top: 15px;">
            <p class="signature-label">Print Name</p>
            <div class="signature-line"></div>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for considering ${business?.name || 'us'} for your project.</p>
          <p>Generated by PourHub • ${format(new Date(), "d MMM yyyy")}</p>
        </div>
      </body>
      </html>
    `;
  }, [estimate, business, formatCurrency]);

  const handleSendEmail = async () => {
    if (!estimate) return;
    
    if (!estimate.client_email) {
      toast({
        title: "No email address",
        description: "This client doesn't have an email address on file.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      const htmlContent = generateHTMLContent();
      
      const { data, error } = await supabase.functions.invoke("send-estimate-email", {
        body: {
          estimateId: estimate.id,
          htmlContent,
          clientEmail: estimate.client_email,
          clientName: estimate.client_name,
          estimateNumber: estimate.estimate_number,
          businessName: business?.name || "PourHub",
          totalAmount: formatCurrency(estimate.total_amount),
        },
      });

      if (error) throw error;

      toast({
        title: "Quote sent!",
        description: `Email sent to ${estimate.client_email}`,
      });

      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending estimate:", error);
      toast({
        title: "Failed to send",
        description: error.message || "Could not send the estimate email.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!estimate) return null;

  // Render printable content in a portal outside the dialog for proper print isolation
  const printablePortal = isPrinting ? createPortal(
    <div className="print-estimate-portal">
      <PrintableEstimate
        ref={printRef}
        estimate={estimate}
        business={business}
      />
    </div>,
    document.body
  ) : null;

  return (
    <>
      {printablePortal}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto no-print">
        <DialogHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <DialogTitle className="text-xl">{estimate.estimate_number}</DialogTitle>
            <Badge variant={statusConfig[estimate.status].variant} className="mt-1">
              {statusConfig[estimate.status].label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 no-print">
          {/* Convert to Job - always available */}
          {onConvertToJob && (
            <Button 
              onClick={() => {
                onConvertToJob(estimate);
                onOpenChange(false);
              }} 
              className="w-full gap-2 h-12 bg-green-600 hover:bg-green-700"
            >
              <Briefcase className="w-4 h-4" />
              Convert to Job
            </Button>
          )}

          {/* Actions - Central prominent buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handlePrint} variant="outline" className="gap-2 h-12">
              <Printer className="w-4 h-4" />
              Print Estimate
            </Button>
            <Button 
              onClick={handleSendEmail} 
              className="gap-2 h-12"
              disabled={isSending || !estimate.client_email}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Email to Client
            </Button>
          </div>

          {!estimate.client_email && (
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Add client email to enable sending
            </p>
          )}

          {/* Client Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Client Details</h3>
            <div className="space-y-2">
              <p className="font-medium text-lg">{estimate.client_name}</p>
              {estimate.client_email && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {estimate.client_email}
                </p>
              )}
              {estimate.client_phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {estimate.client_phone}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                {estimate.site_address}
              </p>
            </div>
          </div>

          {/* Quote Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Quote Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(estimate.created_at), "d MMM yyyy")}
                </p>
              </div>
              {estimate.valid_until && (
                <div>
                  <p className="text-xs text-muted-foreground">Valid Until</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(estimate.valid_until), "d MMM yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {estimate.description && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Scope of Works</h3>
              <div className="bg-muted/50 rounded-lg p-3">
                <ul className="space-y-1">
                  {estimate.description.split(" | ").map((part, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{part}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-primary flex items-center gap-1">
                <DollarSign className="w-5 h-5" />
                {formatCurrency(estimate.total_amount).replace("$", "")}
              </span>
            </div>
          </div>

          {/* Notes */}
          {estimate.notes && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Terms & Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{estimate.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
