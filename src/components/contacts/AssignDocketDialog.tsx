import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle, Truck } from "lucide-react";
import { toast } from "sonner";

interface AssignDocketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docketId: string;
  onAssigned: () => void;
}

export function AssignDocketDialog({
  open,
  onOpenChange,
  docketId,
  onAssigned,
}: AssignDocketDialogProps) {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedPourId, setSelectedPourId] = useState<string>("");

  // Fetch the docket
  const { data: docket, isLoading: isLoadingDocket } = useQuery({
    queryKey: ["pending-docket", docketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_documents")
        .select("*")
        .eq("id", docketId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!docketId,
  });

  // Fetch jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-for-assignment"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data } = await supabase
        .from("jobs")
        .select("id, name, job_number")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });

      return data || [];
    },
    enabled: open,
  });

  // Fetch pours for selected job
  const { data: pours = [] } = useQuery({
    queryKey: ["pours-for-job", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      const { data } = await supabase
        .from("job_pours")
        .select("id, pour_name")
        .eq("job_id", selectedJobId)
        .order("pour_date", { ascending: false });
      return data || [];
    },
    enabled: !!selectedJobId,
  });

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedJobId("");
      setSelectedPourId("");
    }
  }, [open]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobId) throw new Error("Please select a job");
      if (!selectedPourId) throw new Error("Please select a pour");

      // Update pending document status
      const { error: updateError } = await supabase
        .from("pending_documents")
        .update({
          status: "approved",
          linked_job_id: selectedJobId,
          linked_pour_id: selectedPourId,
        })
        .eq("id", docketId);

      if (updateError) throw updateError;

      // The trigger update_pour_actual_volume will auto-calculate the actual_m3
    },
    onSuccess: () => {
      toast.success("Docket assigned to pour");
      queryClient.invalidateQueries({ queryKey: ["inbox-history"] });
      queryClient.invalidateQueries({ queryKey: ["pending-docket", docketId] });
      onAssigned();
    },
    onError: (error) => {
      console.error("Error assigning docket:", error);
      toast.error("Failed to assign docket");
    },
  });

  if (isLoadingDocket) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const extractedData = docket?.extracted_data as {
    docket_number?: string;
    volume_m3?: number;
    supplier?: string;
  } | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Assign Docket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Docket info */}
          {extractedData && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
              {extractedData.docket_number && (
                <div><span className="text-muted-foreground">Docket:</span> {extractedData.docket_number}</div>
              )}
              {extractedData.volume_m3 && (
                <div><span className="text-muted-foreground">Volume:</span> {extractedData.volume_m3} m³</div>
              )}
              {extractedData.supplier && (
                <div><span className="text-muted-foreground">Supplier:</span> {extractedData.supplier}</div>
              )}
            </div>
          )}

          {/* Job selection */}
          <div className="space-y-2">
            <Label>Job</Label>
            <Select value={selectedJobId} onValueChange={(v) => {
              setSelectedJobId(v);
              setSelectedPourId("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_number ? `${job.job_number} - ` : ""}{job.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pour selection */}
          {selectedJobId && (
            <div className="space-y-2">
              <Label>Pour</Label>
              <Select value={selectedPourId} onValueChange={setSelectedPourId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pour" />
                </SelectTrigger>
                <SelectContent>
                  {pours.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No pours found for this job
                    </div>
                  ) : (
                    pours.map((pour) => (
                      <SelectItem key={pour.id} value={pour.id}>
                        {pour.pour_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedJobId || !selectedPourId || assignMutation.isPending}
          >
            {assignMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}