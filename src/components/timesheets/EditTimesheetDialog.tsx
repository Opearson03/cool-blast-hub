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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes } from "date-fns";
import { Loader2, Coffee } from "lucide-react";

interface Timesheet {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
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
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakEndTime, setBreakEndTime] = useState("");
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

      if (timesheet.break_start) {
        setBreakStartTime(format(new Date(timesheet.break_start), "HH:mm"));
      } else {
        setBreakStartTime("");
      }

      if (timesheet.break_end) {
        setBreakEndTime(format(new Date(timesheet.break_end), "HH:mm"));
      } else {
        setBreakEndTime("");
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

      // Use clock in date for break times
      const breakStart = breakStartTime
        ? new Date(`${clockInDate}T${breakStartTime}`)
        : null;
      const breakEnd = breakEndTime
        ? new Date(`${clockInDate}T${breakEndTime}`)
        : null;

      const { error } = await supabase
        .from("timesheets")
        .update({
          clock_in: clockIn.toISOString(),
          clock_out: clockOut?.toISOString() || null,
          break_start: breakStart?.toISOString() || null,
          break_end: breakEnd?.toISOString() || null,
          break_applied_by: (breakStart || breakEnd) ? user.id : null,
          break_applied_at: (breakStart || breakEnd) ? new Date().toISOString() : null,
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

  const applyStandardBreak = () => {
    if (!clockInDate) return;
    
    // Default break at 12:00 for 30 minutes
    setBreakStartTime("12:00");
    setBreakEndTime("12:30");
    toast({ title: "30 minute break applied at 12:00" });
  };

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

            <Separator />

            {/* Break Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  Break Time
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyStandardBreak}
                  disabled={!clockInDate}
                >
                  Apply 30 min break
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Break Start</Label>
                  <Input
                    type="time"
                    value={breakStartTime}
                    onChange={(e) => setBreakStartTime(e.target.value)}
                    placeholder="--:--"
                  />
                </div>
                <div>
                  <Label className="text-xs">Break End</Label>
                  <Input
                    type="time"
                    value={breakEndTime}
                    onChange={(e) => setBreakEndTime(e.target.value)}
                    placeholder="--:--"
                  />
                </div>
              </div>
              {breakStartTime && breakEndTime && (
                <p className="text-xs text-muted-foreground">
                  Break duration will be deducted from total hours
                </p>
              )}
            </div>

            <Separator />

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