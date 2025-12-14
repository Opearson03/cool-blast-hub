import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const TICKET_TYPES = [
  "White Card",
  "Forklift (LF)",
  "EWP (Boom Lift)",
  "Dogging",
  "Rigging",
  "Crane Operator",
  "HR Licence",
  "MR Licence",
  "HC Licence",
  "MC Licence",
  "First Aid",
  "Working at Heights",
  "Confined Space",
  "Other",
];

type Ticket = {
  id: string;
  employee_id: string;
  ticket_type: string;
  ticket_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
};

interface TicketFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  editTicket?: Ticket | null;
}

export function TicketFormDialog({
  open,
  onOpenChange,
  employeeId,
  editTicket,
}: TicketFormDialogProps) {
  const [ticketType, setTicketType] = useState(editTicket?.ticket_type || "");
  const [ticketNumber, setTicketNumber] = useState(editTicket?.ticket_number || "");
  const [issueDate, setIssueDate] = useState(editTicket?.issue_date || "");
  const [expiryDate, setExpiryDate] = useState(editTicket?.expiry_date || "");
  const [notes, setNotes] = useState(editTicket?.notes || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const ticketData = {
        employee_id: employeeId,
        ticket_type: ticketType,
        ticket_number: ticketNumber || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        notes: notes || null,
      };

      if (editTicket) {
        const { error } = await supabase
          .from("employee_tickets")
          .update(ticketData)
          .eq("id", editTicket.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employee_tickets").insert(ticketData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tickets"] });
      toast({ title: editTicket ? "Ticket updated" : "Ticket added" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTicketType("");
    setTicketNumber("");
    setIssueDate("");
    setExpiryDate("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketType) {
      toast({ title: "Please select a ticket type", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editTicket ? "Edit Ticket" : "Add Ticket/Certification"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ticketType">Ticket Type *</Label>
            <Select value={ticketType} onValueChange={setTicketType}>
              <SelectTrigger className="touch-target">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ticketNumber">Ticket/Licence Number</Label>
            <Input
              id="ticketNumber"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="e.g., 123456789"
              className="touch-target"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="touch-target"
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="touch-target"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 touch-target"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 touch-target">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editTicket ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
