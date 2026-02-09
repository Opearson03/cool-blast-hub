import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format-currency";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, MapPin, Loader2, Mail, Send } from "lucide-react";

interface UnsignedQuote {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  company_name: string | null;
  site_address: string;
  total_amount: number | null;
  estimate_number: string | null;
  description: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  payment_terms_type: string | null;
  deposit_percentage: number | null;
  quote_validity_days: number | null;
  scope_data: any;
  selected_scopes: any;
}

interface BusinessInfo {
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  abn: string | null;
  inbound_email_alias: string | null;
  quote_template: string | null;
  quote_primary_color: string | null;
  quote_secondary_color: string | null;
  quote_font: string | null;
}

interface ActionsRequiredDialogProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActionsRequiredDialog({
  businessId,
  open,
  onOpenChange,
}: ActionsRequiredDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<UnsignedQuote[]>([]);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);

      const [quotesRes, businessRes] = await Promise.all([
        supabase
          .from("estimates")
          .select(
            "id, client_name, client_email, client_phone, company_name, site_address, total_amount, estimate_number, description, valid_until, notes, created_at, payment_terms_type, deposit_percentage, quote_validity_days, scope_data, selected_scopes"
          )
          .eq("business_id", businessId)
          .eq("status", "sent")
          .is("signed_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("businesses")
          .select(
            "name, logo_url, address, phone, email, abn, inbound_email_alias, quote_template, quote_primary_color, quote_secondary_color, quote_font"
          )
          .eq("id", businessId)
          .single(),
      ]);

      setQuotes(quotesRes.data ?? []);
      setBusiness(businessRes.data ?? null);
      setLoading(false);
    };

    fetchData();
  }, [open, businessId]);

  const handleResendQuote = async (quote: UnsignedQuote) => {
    if (!quote.client_email || !business) return;

    setSendingId(quote.id);

    try {
      toast({
        title: "Generating PDF...",
        description: "Creating your quote document.",
      });

      const { generateQuotePDF } = await import("@/lib/generate-quote-pdf");
      const pdfBase64 = await generateQuotePDF({
        estimate: {
          estimate_number: quote.estimate_number ?? "",
          client_name: quote.client_name,
          company_name: quote.company_name,
          client_email: quote.client_email,
          client_phone: quote.client_phone,
          site_address: quote.site_address,
          description: quote.description,
          total_amount: quote.total_amount ?? 0,
          valid_until: quote.valid_until,
          notes: quote.notes,
          created_at: quote.created_at,
          payment_terms_type: quote.payment_terms_type,
          deposit_percentage: quote.deposit_percentage,
          quote_validity_days: quote.quote_validity_days,
        },
        business: {
          name: business.name,
          logo_url: business.logo_url,
          address: business.address,
          phone: business.phone,
          email: business.email,
          abn: business.abn,
          quote_template: business.quote_template ?? undefined,
          quote_primary_color: business.quote_primary_color ?? undefined,
          quote_secondary_color: business.quote_secondary_color ?? undefined,
          quote_font: business.quote_font ?? undefined,
        },
        scopeData: quote.scope_data,
        selectedScopes: quote.selected_scopes,
      });

      toast({
        title: "Sending email...",
        description: `Sending quote to ${quote.client_email}`,
      });

      const { error } = await supabase.functions.invoke("send-estimate-email", {
        body: {
          estimateId: quote.id,
          clientEmail: quote.client_email,
          clientName: quote.client_name,
          estimateNumber: quote.estimate_number,
          businessName: business.name,
          businessEmailAlias: business.inbound_email_alias,
          totalAmount: formatCurrency(quote.total_amount ?? 0),
          siteAddress: quote.site_address,
          pdfBase64,
        },
      });

      if (error) throw error;

      toast({
        title: "Quote resent!",
        description: `Email sent to ${quote.client_email}`,
      });
    } catch (error: any) {
      console.error("Error resending quote:", error);
      toast({
        title: "Failed to send",
        description: error.message || "Could not send the quote email.",
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleViewQuote = (id: string) => {
    onOpenChange(false);
    navigate(`/admin/estimates?edit=${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Action Required</DialogTitle>
          <DialogDescription>
            Quotes sent but not yet signed by the client.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <p className="text-sm font-medium">No actions required</p>
            </div>
          ) : (
            quotes.map((quote) => {
              const isSending = sendingId === quote.id;

              return (
                <div
                  key={quote.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {quote.client_name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{quote.site_address}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Awaiting Signature
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {quote.estimate_number}
                      </span>
                      {quote.total_amount != null && (
                        <span className="font-semibold ml-1">
                          {formatCurrency(quote.total_amount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {quote.client_email ? (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{quote.client_email}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSending}
                        onClick={() => handleResendQuote(quote)}
                      >
                        {isSending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Send className="h-3.5 w-3.5 mr-1" />
                        )}
                        {isSending ? "Sending..." : "Resend Quote"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-destructive">No email on file</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewQuote(quote.id)}
                      >
                        View Quote
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
