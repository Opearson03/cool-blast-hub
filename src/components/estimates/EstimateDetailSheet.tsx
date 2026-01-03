import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, X, Calendar, DollarSign, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrintableEstimate } from "./PrintableEstimate";
import { format } from "date-fns";

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
}

const statusConfig: Record<EstimateStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
};

export function EstimateDetailSheet({ estimate, open, onOpenChange }: EstimateDetailSheetProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  if (!estimate) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="flex flex-row items-start justify-between">
          <div>
            <SheetTitle className="text-xl">{estimate.estimate_number}</SheetTitle>
            <Badge variant={statusConfig[estimate.status].variant} className="mt-1">
              {statusConfig[estimate.status].label}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="no-print">
            <X className="w-4 h-4" />
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-6 no-print">
          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="flex-1 gap-2">
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
          </div>

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

        {/* Printable Version (hidden on screen) */}
        <div className={isPrinting ? "block" : "hidden print:block"}>
          <PrintableEstimate
            ref={printRef}
            estimate={estimate}
            business={business}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
