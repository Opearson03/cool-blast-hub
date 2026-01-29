import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Bell, Flag, HardHat, ClipboardCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AddJobDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  businessId: string;
  initialDate?: Date | null;
}

const DATE_TYPES = [
  { value: "reminder", label: "Reminder", icon: Bell, description: "General reminder" },
  { value: "deadline", label: "Deadline", icon: Flag, description: "Important deadline" },
  { value: "milestone", label: "Milestone", icon: HardHat, description: "Project milestone" },
  { value: "inspection", label: "Inspection", icon: ClipboardCheck, description: "Site inspection" },
];

export function AddJobDateDialog({
  open,
  onOpenChange,
  jobId,
  businessId,
  initialDate,
}: AddJobDateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateType, setDateType] = useState("reminder");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate ?? undefined
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !title.trim()) {
        throw new Error("Please fill in required fields");
      }

      const { error } = await supabase.from("job_dates").insert({
        job_id: jobId,
        business_id: businessId,
        date: format(selectedDate, "yyyy-MM-dd"),
        title: title.trim(),
        description: description.trim() || null,
        date_type: dateType,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-dates", jobId] });
      toast({ title: "Date added successfully" });
      handleClose();
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDateType("reminder");
    setSelectedDate(undefined);
    onOpenChange(false);
  };

  // Update selected date when dialog opens with initial date
  useState(() => {
    if (open && initialDate) {
      setSelectedDate(initialDate);
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Key Date</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Order steel reinforcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={dateType} onValueChange={setDateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => createMutation.mutate()}
            disabled={!selectedDate || !title.trim() || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Add Date
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}