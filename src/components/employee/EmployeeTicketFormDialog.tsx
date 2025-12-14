import { useState, useRef } from "react";
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
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

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

type Ticket = Tables<"employee_tickets">;

interface EmployeeTicketFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  editTicket?: Ticket | null;
}

export function EmployeeTicketFormDialog({
  open,
  onOpenChange,
  employeeId,
  editTicket,
}: EmployeeTicketFormDialogProps) {
  const [ticketType, setTicketType] = useState(editTicket?.ticket_type || "");
  const [ticketNumber, setTicketNumber] = useState(editTicket?.ticket_number || "");
  const [issueDate, setIssueDate] = useState(editTicket?.issue_date || "");
  const [expiryDate, setExpiryDate] = useState(editTicket?.expiry_date || "");
  const [notes, setNotes] = useState(editTicket?.notes || "");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(
    editTicket?.document_url || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setTicketType("");
    setTicketNumber("");
    setIssueDate("");
    setExpiryDate("");
    setNotes("");
    setDocumentFile(null);
    setDocumentPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, WebP or PDF file",
        variant: "destructive",
      });
      return;
    }

    setDocumentFile(file);
    if (file.type.startsWith("image/")) {
      setDocumentPreview(URL.createObjectURL(file));
    } else {
      setDocumentPreview(null);
    }
  };

  const uploadDocument = async (): Promise<string | null> => {
    if (!documentFile) return editTicket?.document_url || null;

    const fileExt = documentFile.name.split(".").pop();
    const fileName = `${employeeId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("employee-tickets")
      .upload(fileName, documentFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("employee-tickets").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);

      let documentUrl = editTicket?.document_url || null;
      if (documentFile) {
        documentUrl = await uploadDocument();
      }

      const ticketData = {
        employee_id: employeeId,
        ticket_type: ticketType,
        ticket_number: ticketNumber || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        notes: notes || null,
        document_url: documentUrl,
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
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["employee-tickets"] });
      toast({ title: editTicket ? "Ticket updated" : "Ticket added" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketType) {
      toast({ title: "Please select a ticket type", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const removeDocument = () => {
    setDocumentFile(null);
    setDocumentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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

          {/* Document Upload */}
          <div>
            <Label>Photo of Ticket/Licence</Label>
            <div className="mt-1.5">
              {documentPreview || documentFile ? (
                <div className="relative rounded-lg border border-border p-3 bg-muted/50">
                  <div className="flex items-center gap-3">
                    {documentPreview && documentFile?.type.startsWith("image/") ? (
                      <img
                        src={documentPreview}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {documentFile?.name || "Existing document"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {documentFile
                          ? `${(documentFile.size / 1024).toFixed(1)} KB`
                          : "Uploaded previously"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeDocument}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Tap to upload a photo or PDF
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP or PDF (max 10MB)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
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
            <Button
              type="submit"
              disabled={mutation.isPending || isUploading}
              className="flex-1 touch-target"
            >
              {(mutation.isPending || isUploading) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editTicket ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
