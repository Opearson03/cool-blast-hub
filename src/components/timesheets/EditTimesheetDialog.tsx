import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface Timesheet {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  profiles: { full_name: string };
}

interface EditTimesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timesheet: Timesheet | null;
  businessId: string;
}

export function EditTimesheetDialog({
  open,
  onOpenChange,
  timesheet,
  businessId,
}: EditTimesheetDialogProps) {
  const [clockInDate, setClockInDate] = useState("");
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutDate, setClockOutDate] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (timesheet) {
      const clockIn = new Date(timesheet.clock_in);
      setClockInDate(format(clockIn, "yyyy-MM-dd"));
      setClockInTime(format(clockIn, "HH:mm"));

      if (timesheet.clock_out) {
        const clockOut = new Date(timesheet.clock_out);
        setClockOutDate(format(clockOut, "yyyy-MM-dd"));
        setClockOutTime(format(clockOut, "HH:mm"));
      } else {
        setClockOutDate("");
        setClockOutTime("");
      }

      setNotes(timesheet.notes || "");
    }
  }, [timesheet]);

  const updateTimesheet = useMutation({
    mutationFn: async () => {
      if (!timesheet) throw new Error("No timesheet");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const clockIn = new Date(`${clockInDate}T${clockInTime}`);
      const clockOut = clockOutDate && clockOutTime
        ? new Date(`${clockOutDate}T${clockOutTime}`)
        : null;

      const { error } = await supabase
        .from("timesheets")
        .update({
          clock_in: clockIn.toISOString(),
          clock_out: clockOut?.toISOString() || null,
          notes: notes || null,
          edited_by: user.id,
          edited_at: new Date().toISOString(),
          status: clockOut ? "completed" : "active",
        })
        .eq("id", timesheet.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-timesheets"] });
      toast({ title: "Timesheet updated" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Timesheet</DialogTitle>
        </DialogHeader>

        {timesheet && (
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              Employee: <span className="font-medium text-foreground">{timesheet.profiles?.full_name}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Clock In Date</Label>
                <Input
                  type="date"
                  value={clockInDate}
                  onChange={(e) => setClockInDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Clock In Time</Label>
                <Input
                  type="time"
                  value={clockInTime}
                  onChange={(e) => setClockInTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Clock Out Date</Label>
                <Input
                  type="date"
                  value={clockOutDate}
                  onChange={(e) => setClockOutDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Clock Out Time</Label>
                <Input
                  type="time"
                  value={clockOutTime}
                  onChange={(e) => setClockOutTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this entry..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => updateTimesheet.mutate()}
            disabled={updateTimesheet.isPending}
          >
            {updateTimesheet.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}