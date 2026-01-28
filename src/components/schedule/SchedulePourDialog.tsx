import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PourFormDialog } from "@/components/jobs/PourFormDialog";

interface SchedulePourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchedulePourDialog({ open, onOpenChange }: SchedulePourDialogProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showPourForm, setShowPourForm] = useState(false);

  // Fetch active jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ["active-jobs-for-pour"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data, error } = await supabase
        .from("jobs")
        .select("id, name, site_address, job_number")
        .eq("business_id", profile.business_id)
        .neq("job_type", "misc")
        .in("status", ["scheduled", "in_progress"])
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedJobId(null);
      setShowPourForm(false);
    }
  }, [open]);

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    setShowPourForm(true);
  };

  const handlePourFormClose = (isOpen: boolean) => {
    if (!isOpen) {
      setShowPourForm(false);
      onOpenChange(false);
    }
  };

  // Show job selection first
  if (!showPourForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Pour</DialogTitle>
            <DialogDescription>
              Select a job to add a pour to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Job</Label>
              <Select onValueChange={handleJobSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No active jobs found
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex flex-col">
                          <span>{job.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {job.job_number} • {job.site_address?.split(",")[0]}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show pour form after job is selected
  return (
    <PourFormDialog
      open={showPourForm}
      onOpenChange={handlePourFormClose}
      jobId={selectedJobId!}
      editPour={null}
    />
  );
}
