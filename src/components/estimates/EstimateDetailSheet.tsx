import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Printer, Calendar as CalendarIcon, DollarSign, Mail, Phone, MapPin, Send, Loader2, Briefcase, Eye, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PrintableEstimate } from "./PrintableEstimate";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type EstimateStatus = "draft" | "sent" | "accepted" | "declined";

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  company_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  site_address: string;
  description: string | null;
  total_amount: number;
  status: EstimateStatus;
  created_at: string;
  valid_until: string | null;
  notes: string | null;
  site_visit_date?: string | null;
  follow_up_date?: string | null;
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
  const [siteVisitOpen, setSiteVisitOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
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
      const { data, error } = await supabase.functions.invoke("send-estimate-email", {
        body: {
          estimateId: estimate.id,
          clientEmail: estimate.client_email,
          clientName: estimate.client_name,
          clientPhone: estimate.client_phone,
          estimateNumber: estimate.estimate_number,
          businessName: business?.name || "PourHub",
          businessAddress: business?.address,
          businessPhone: business?.phone,
          businessEmail: business?.email,
          businessAbn: business?.abn,
          totalAmount: formatCurrency(estimate.total_amount),
          siteAddress: estimate.site_address,
          description: estimate.description,
          notes: estimate.notes,
          createdAt: format(new Date(estimate.created_at), "d MMMM yyyy"),
          validUntil: estimate.valid_until ? format(new Date(estimate.valid_until), "d MMMM yyyy") : null,
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

  const updateDateMutation = useMutation({
    mutationFn: async ({ field, date }: { field: 'site_visit_date' | 'follow_up_date'; date: Date | null }) => {
      if (!estimate) throw new Error("No estimate");
      const { error } = await supabase
        .from("estimates")
        .update({ [field]: date ? format(date, "yyyy-MM-dd") : null })
        .eq("id", estimate.id);
      if (error) throw error;
    },
    onSuccess: (_, { field }) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-estimates"] });
      toast({
        title: field === 'site_visit_date' ? "Site visit scheduled" : "Follow-up scheduled",
        description: "The date has been saved to the schedule.",
      });
      if (field === 'site_visit_date') setSiteVisitOpen(false);
      else setFollowUpOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

          {/* Schedule Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Popover open={siteVisitOpen} onOpenChange={setSiteVisitOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 h-12 border-primary/50 text-primary hover:bg-primary/10">
                  <Eye className="w-4 h-4" />
                  {estimate.site_visit_date ? format(new Date(estimate.site_visit_date), "d MMM") : "Site Visit"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="start" side="bottom" sideOffset={4}>
                <Calendar
                  mode="single"
                  selected={estimate.site_visit_date ? new Date(estimate.site_visit_date) : undefined}
                  onSelect={(date) => updateDateMutation.mutate({ field: 'site_visit_date', date: date || null })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Popover open={followUpOpen} onOpenChange={setFollowUpOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 h-12 border-primary/50 text-primary hover:bg-primary/10">
                  <PhoneCall className="w-4 h-4" />
                  {estimate.follow_up_date ? format(new Date(estimate.follow_up_date), "d MMM") : "Follow Up"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="end" side="bottom" sideOffset={4}>
                <Calendar
                  mode="single"
                  selected={estimate.follow_up_date ? new Date(estimate.follow_up_date) : undefined}
                  onSelect={(date) => updateDateMutation.mutate({ field: 'follow_up_date', date: date || null })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

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
              {estimate.company_name && (
                <p className="text-sm text-muted-foreground">{estimate.company_name}</p>
              )}
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
