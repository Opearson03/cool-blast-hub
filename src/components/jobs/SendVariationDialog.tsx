import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface VariationItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface Variation {
  id: string;
  variation_number: string;
  description: string;
  reason: string | null;
  items: VariationItem[];
  amount: number;
  days_extension: number;
  notes: string | null;
}

interface Job {
  id: string;
  name: string;
  job_number: string | null;
  site_address: string;
  builder_client: string | null;
  source_estimate_id?: string | null;
}

interface SendVariationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variation: Variation;
  job: Job;
  defaultClientEmail?: string | null;
}

export function SendVariationDialog({
  open,
  onOpenChange,
  variation,
  job,
  defaultClientEmail,
}: SendVariationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { businessId } = useAuth();
  
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Fetch business data for branding
  const { data: business } = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId && open,
  });

  // Fetch client email from source estimate if available
  const { data: sourceEstimate } = useQuery({
    queryKey: ["source-estimate-email", job.source_estimate_id],
    queryFn: async () => {
      if (!job.source_estimate_id) return null;
      const { data, error } = await supabase
        .from("estimates")
        .select("client_email")
        .eq("id", job.source_estimate_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!job.source_estimate_id && open,
  });

  useEffect(() => {
    if (open) {
      // Prefill client name from job
      if (job.builder_client) {
        setClientName(job.builder_client);
      }
      // Prefill client email from source estimate or passed default
      const emailToUse = defaultClientEmail || sourceEstimate?.client_email || "";
      if (emailToUse) {
        setClientEmail(emailToUse);
      }
    }
  }, [open, job.builder_client, defaultClientEmail, sourceEstimate?.client_email]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error("Business data not loaded");
      
      const { data, error } = await supabase.functions.invoke("send-variation-email", {
        body: {
          variationId: variation.id,
          clientEmail,
          clientName,
          variationNumber: variation.variation_number,
          jobName: job.name,
          jobNumber: job.job_number,
          siteAddress: job.site_address,
          description: variation.description,
          reason: variation.reason,
          items: variation.items,
          amount: Number(variation.amount),
          daysExtension: variation.days_extension,
          notes: variation.notes,
          businessName: business.name,
          businessAddress: business.address,
          businessPhone: business.phone,
          businessEmail: business.email,
          businessAbn: business.abn,
          businessLogoUrl: business.logo_url,
          quotePrimaryColor: business.quote_primary_color || '#f97316',
          quoteSecondaryColor: business.quote_secondary_color || '#1f2937',
          quoteFont: business.quote_font || 'Arial',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-variations", job.id] });
      toast({
        title: "Variation sent",
        description: `Variation ${variation.variation_number} has been emailed to ${clientEmail}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    if (!clientName.trim()) {
      toast({ title: "Client name required", variant: "destructive" });
      return;
    }
    sendMutation.mutate();
  };

  const totalWithGst = Number(variation.amount) * 1.1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send to Client
          </DialogTitle>
          <DialogDescription>
            Send {variation.variation_number} for approval
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Variation Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Variation</span>
              <span className="font-mono font-medium">{variation.variation_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Job</span>
              <span className="font-medium">{job.name}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Total (inc GST)</span>
              <span className="font-bold text-lg">
                {totalWithGst.toLocaleString("en-AU", { style: "currency", currency: "AUD" })}
              </span>
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Variation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
