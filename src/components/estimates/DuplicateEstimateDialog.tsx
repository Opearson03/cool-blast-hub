import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  status: string;
  notes: string | null;
  estimate_type: string;
  scope_data: Record<string, unknown> | null;
  selected_scopes: string[] | null;
  deposit_percentage: number | null;
  quote_validity_days: number | null;
  payment_terms_type: string | null;
}

interface DuplicateEstimateDialogProps {
  estimate: Estimate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicated?: (newEstimateId: string) => void;
}

export function DuplicateEstimateDialog({
  estimate,
  open,
  onOpenChange,
  onDuplicated,
}: DuplicateEstimateDialogProps) {
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when dialog opens with new estimate
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && estimate) {
      setClientName("");
      setCompanyName("");
      setClientEmail("");
      setClientPhone("");
      setSiteAddress(estimate.site_address);
    }
    onOpenChange(isOpen);
  };

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!estimate) throw new Error("No estimate to duplicate");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      // Generate new estimate number
      const { data: latestEstimate } = await supabase
        .from("estimates")
        .select("estimate_number")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (latestEstimate?.estimate_number) {
        const match = latestEstimate.estimate_number.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      const newEstimateNumber = `EST-${String(nextNumber).padStart(4, "0")}`;

      // Create duplicated estimate with new client details
      const { data: newEstimate, error } = await supabase
        .from("estimates")
        .insert([{
          business_id: profile.business_id,
          estimate_number: newEstimateNumber,
          client_name: clientName.trim(),
          company_name: companyName.trim() || null,
          client_email: clientEmail.trim() || null,
          client_phone: clientPhone.trim() || null,
          site_address: siteAddress.trim(),
          description: estimate.description,
          total_amount: estimate.total_amount,
          status: "draft" as const,
          notes: estimate.notes,
          estimate_type: estimate.estimate_type,
          scope_data: estimate.scope_data as unknown as Record<string, never>,
          selected_scopes: estimate.selected_scopes as unknown as string[],
          deposit_percentage: estimate.deposit_percentage,
          quote_validity_days: estimate.quote_validity_days,
          payment_terms_type: estimate.payment_terms_type,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Duplicate takeoff data if exists
      const { data: takeoffs } = await supabase
        .from("estimate_takeoffs")
        .select("*")
        .eq("estimate_id", estimate.id);

      if (takeoffs && takeoffs.length > 0) {
        for (const takeoff of takeoffs) {
          // Create new takeoff record
          const { data: newTakeoff, error: takeoffError } = await supabase
            .from("estimate_takeoffs")
            .insert({
              estimate_id: newEstimate.id,
              current_page: takeoff.current_page,
            })
            .select()
            .single();

          if (takeoffError) continue;

          // Duplicate takeoff files
          const { data: files } = await supabase
            .from("takeoff_files")
            .select("*")
            .eq("takeoff_id", takeoff.id);

          if (files && files.length > 0) {
            const fileMapping: Record<string, string> = {};

            for (const file of files) {
              const { data: newFile, error: fileError } = await supabase
                .from("takeoff_files")
                .insert({
                  takeoff_id: newTakeoff.id,
                  file_url: file.file_url, // Reuse same storage file
                  file_type: file.file_type,
                  file_name: file.file_name,
                  page_count: file.page_count,
                  sort_order: file.sort_order,
                })
                .select()
                .single();

              if (!fileError && newFile) {
                fileMapping[file.id] = newFile.id;

                // Duplicate page scales
                const { data: scales } = await supabase
                  .from("takeoff_page_scales")
                  .select("*")
                  .eq("file_id", file.id);

                if (scales && scales.length > 0) {
                  await supabase.from("takeoff_page_scales").insert(
                    scales.map((scale) => ({
                      file_id: newFile.id,
                      page_number: scale.page_number,
                      scale_pixels_per_meter: scale.scale_pixels_per_meter,
                    }))
                  );
                }
              }
            }

            // Duplicate markups
            const { data: markups } = await supabase
              .from("takeoff_markups")
              .select("*")
              .eq("takeoff_id", takeoff.id);

            if (markups && markups.length > 0) {
              const markupMapping: Record<string, string> = {};
              
              // First pass: create markups without parent references
              for (const markup of markups.filter(m => !m.parent_markup_id)) {
                const { data: newMarkup } = await supabase
                  .from("takeoff_markups")
                  .insert({
                    takeoff_id: newTakeoff.id,
                    file_id: markup.file_id ? fileMapping[markup.file_id] : null,
                    scope_id: markup.scope_id,
                    shape_type: markup.shape_type,
                    points: markup.points,
                    area_sqm: markup.area_sqm,
                    perimeter_m: markup.perimeter_m,
                    page_number: markup.page_number,
                    color: markup.color,
                    name: markup.name,
                    markup_type: markup.markup_type,
                    diameter_mm: markup.diameter_mm,
                    depth_mm: markup.depth_mm,
                    pier_quantity: markup.pier_quantity,
                    width_mm: markup.width_mm,
                    height_mm: markup.height_mm,
                    length_m: markup.length_m,
                    toe_mm: markup.toe_mm,
                  })
                  .select()
                  .single();

                if (newMarkup) {
                  markupMapping[markup.id] = newMarkup.id;
                }
              }

              // Second pass: create child markups with parent references
              for (const markup of markups.filter(m => m.parent_markup_id)) {
                await supabase.from("takeoff_markups").insert({
                  takeoff_id: newTakeoff.id,
                  file_id: markup.file_id ? fileMapping[markup.file_id] : null,
                  scope_id: markup.scope_id,
                  shape_type: markup.shape_type,
                  points: markup.points,
                  area_sqm: markup.area_sqm,
                  perimeter_m: markup.perimeter_m,
                  page_number: markup.page_number,
                  color: markup.color,
                  name: markup.name,
                  markup_type: markup.markup_type,
                  diameter_mm: markup.diameter_mm,
                  depth_mm: markup.depth_mm,
                  pier_quantity: markup.pier_quantity,
                  width_mm: markup.width_mm,
                  height_mm: markup.height_mm,
                  length_m: markup.length_m,
                  toe_mm: markup.toe_mm,
                  parent_markup_id: markup.parent_markup_id ? markupMapping[markup.parent_markup_id] : null,
                });
              }
            }
          }
        }
      }

      return newEstimate;
    },
    onSuccess: (newEstimate) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({
        title: "Estimate duplicated",
        description: `Created ${newEstimate.estimate_number} for ${clientName}`,
      });
      onOpenChange(false);
      onDuplicated?.(newEstimate.id);
    },
    onError: (error) => {
      console.error("Duplicate error:", error);
      toast({
        title: "Failed to duplicate estimate",
        variant: "destructive",
      });
    },
  });

  const isValid = clientName.trim() && siteAddress.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Estimate
          </DialogTitle>
          <DialogDescription>
            Create a copy of {estimate?.estimate_number} with new client details.
            All scope data and calculations will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Phone</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteAddress">Site Address *</Label>
            <Input
              id="siteAddress"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="Enter site address"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => duplicateMutation.mutate()}
            disabled={!isValid || duplicateMutation.isPending}
          >
            {duplicateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplicating...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
