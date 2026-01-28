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
import { SubTradeInviteDialog } from "@/components/jobs/SubTradeInviteDialog";

interface ScheduleSubbieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Pour = {
  id: string;
  pour_name: string;
  pour_date: string | null;
  job: {
    id: string;
    name: string;
    site_address: string;
  };
};

export function ScheduleSubbieDialog({ open, onOpenChange }: ScheduleSubbieDialogProps) {
  const [selectedPour, setSelectedPour] = useState<Pour | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Fetch scheduled pours
  const { data: pours = [] } = useQuery({
    queryKey: ["pours-for-subbie-invite"],
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
        .from("job_pours")
        .select(`
          id,
          pour_name,
          pour_date,
          job:jobs!inner(id, name, site_address, business_id)
        `)
        .eq("job.business_id", profile.business_id)
        .in("status", ["scheduled", "in_progress"])
        .order("pour_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Pour[];
    },
    enabled: open,
  });

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedPour(null);
      setShowInviteDialog(false);
    }
  }, [open]);

  const handlePourSelect = (pourId: string) => {
    const pour = pours.find((p) => p.id === pourId);
    if (pour) {
      setSelectedPour(pour);
      setShowInviteDialog(true);
    }
  };

  const handleInviteDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setShowInviteDialog(false);
      onOpenChange(false);
    }
  };

  // Show pour selection first
  if (!showInviteDialog) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Subbie</DialogTitle>
            <DialogDescription>
              Select a pour to invite a subcontractor to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Pour</Label>
              <Select onValueChange={handlePourSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pour..." />
                </SelectTrigger>
                <SelectContent>
                  {pours.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No scheduled pours found
                    </div>
                  ) : (
                    pours.map((pour) => (
                      <SelectItem key={pour.id} value={pour.id}>
                        <div className="flex flex-col">
                          <span>{pour.pour_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {pour.job.name} • {pour.pour_date || "Unscheduled"}
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

  // Show invite dialog after pour is selected
  return (
    <SubTradeInviteDialog
      open={showInviteDialog}
      onOpenChange={handleInviteDialogClose}
      jobId={selectedPour!.job.id}
      pourId={selectedPour!.id}
      pourName={selectedPour!.pour_name}
      pourDate={selectedPour!.pour_date}
    />
  );
}
