import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ITPFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
}

interface Template {
  id: string;
  name: string;
  itp_type: string;
  checklist_items: Array<{ id: number; item: string; required: boolean }>;
}

export function ITPFormDialog({ open, onOpenChange, jobId }: ITPFormDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customName, setCustomName] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["itp-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itp_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []).map((t) => ({
        ...t,
        checklist_items: t.checklist_items as unknown as Array<{ id: number; item: string; required: boolean }>,
      }));
    },
  });

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("No template selected");

      const checklistData = selectedTemplate.checklist_items.map((item) => ({
        ...item,
        checked: false,
        comment: "",
        photo_url: null,
      }));

      const { error } = await supabase.from("job_itps").insert([{
        job_id: jobId,
        template_id: selectedTemplate.id,
        name: customName || selectedTemplate.name,
        itp_type: selectedTemplate.itp_type,
        checklist_data: checklistData,
        status: "pending",
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-itps", jobId] });
      toast.success("ITP created successfully");
      onOpenChange(false);
      setSelectedTemplateId("");
      setCustomName("");
    },
    onError: (error) => {
      toast.error("Failed to create ITP: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inspection & Test Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <>
              <div className="space-y-2">
                <Label>ITP Name (optional override)</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={selectedTemplate.name}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Checklist items:</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedTemplate.checklist_items.slice(0, 4).map((item) => (
                    <li key={item.id}>{item.item}</li>
                  ))}
                  {selectedTemplate.checklist_items.length > 4 && (
                    <li>...and {selectedTemplate.checklist_items.length - 4} more</li>
                  )}
                </ul>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!selectedTemplateId || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create ITP"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
