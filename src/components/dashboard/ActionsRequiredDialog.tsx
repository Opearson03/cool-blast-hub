import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format-currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, MapPin, Loader2, Mail } from "lucide-react";

interface UnsignedQuote {
  id: string;
  client_name: string;
  client_email: string | null;
  site_address: string;
  total_amount: number | null;
  estimate_number: string | null;
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
  const [quotes, setQuotes] = useState<UnsignedQuote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchUnsignedQuotes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("estimates")
        .select("id, client_name, client_email, site_address, total_amount, estimate_number")
        .eq("business_id", businessId)
        .eq("status", "sent")
        .is("signed_at", null)
        .order("created_at", { ascending: false });

      setQuotes(data ?? []);
      setLoading(false);
    };

    fetchUnsignedQuotes();
  }, [open, businessId]);

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
            quotes.map((quote) => (
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
                      onClick={() => handleViewQuote(quote.id)}
                    >
                      Resend Quote
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
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
