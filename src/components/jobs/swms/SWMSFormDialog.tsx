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

interface SWMSFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
}

export function SWMSFormDialog({ open, onOpenChange, jobId }: SWMSFormDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customName, setCustomName] = useState("");

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["swms-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swms_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("No template selected");

      const { error } = await supabase.from("job_swms").insert([{
        job_id: jobId,
        template_id: selectedTemplate.id,
        name: customName || selectedTemplate.name,
        content: selectedTemplate.content,
        hazards: (selectedTemplate.content as any)?.hazards || [],
        status: "pending",
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-swms", jobId] });
      toast.success("SWMS created successfully");
      onOpenChange(false);
      setSelectedTemplateId("");
      setCustomName("");
    },
    onError: (error) => {
      toast.error("Failed to create SWMS: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Safe Work Method Statement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
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
                <Label>SWMS Name (optional override)</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={selectedTemplate.name}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Hazards covered:</p>
                <ul className="list-disc list-inside space-y-1">
                  {((selectedTemplate.content as any)?.hazards || []).slice(0, 4).map((h: any, i: number) => (
                    <li key={i}>{h.hazard}</li>
                  ))}
                  {((selectedTemplate.content as any)?.hazards || []).length > 4 && (
                    <li>...and {((selectedTemplate.content as any)?.hazards || []).length - 4} more</li>
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
              {createMutation.isPending ? "Creating..." : "Create SWMS"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
