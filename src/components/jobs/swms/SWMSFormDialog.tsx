import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface SWMSFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
}

interface Employee {
  id: string;
  full_name: string;
}

export function SWMSFormDialog({ open, onOpenChange, jobId }: SWMSFormDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

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

  // Fetch employees assigned to this job's pours
  const { data: jobEmployees = [] } = useQuery({
    queryKey: ["job-employees", jobId],
    queryFn: async () => {
      // Get all pours for this job
      const { data: pours, error: poursError } = await supabase
        .from("job_pours")
        .select("id")
        .eq("job_id", jobId);
      
      if (poursError) throw poursError;
      if (!pours || pours.length === 0) return [];

      const pourIds = pours.map(p => p.id);

      // Get unique employees assigned to these pours
      const { data: pourEmployees, error: peError } = await supabase
        .from("pour_employees")
        .select("employee_id")
        .in("pour_id", pourIds);
      
      if (peError) throw peError;
      if (!pourEmployees || pourEmployees.length === 0) return [];

      const uniqueEmployeeIds = [...new Set(pourEmployees.map(pe => pe.employee_id))];

      // Fetch employee details
      const { data: profiles, error: profilesError } = await supabase
        .rpc("get_team_profiles");
      
      if (profilesError) throw profilesError;

      // Filter to only employees on this job
      const employees = (profiles || [])
        .filter((p: any) => uniqueEmployeeIds.includes(p.id))
        .map((p: any) => ({ id: p.id, full_name: p.full_name }));

      return employees as Employee[];
    },
    enabled: open,
  });

  // Fetch all team members for selection
  const { data: allEmployees = [] } = useQuery({
    queryKey: ["all-employees-for-swms"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_profiles");
      if (error) throw error;
      return (data || []).map((p: any) => ({ id: p.id, full_name: p.full_name })) as Employee[];
    },
    enabled: open,
  });

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedTemplateId("");
      setCustomName("");
      setSelectedEmployeeIds([]);
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("No template selected");

      // Create SWMS with required_signers
      const { error: swmsError } = await supabase
        .from("job_swms")
        .insert([{
          job_id: jobId,
          template_id: selectedTemplate.id,
          name: customName || selectedTemplate.name,
          content: selectedTemplate.content,
          hazards: (selectedTemplate.content as any)?.hazards || [],
          status: "pending",
          required_signers: selectedEmployeeIds,
        }]);

      if (swmsError) throw swmsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-swms", jobId] });
      toast.success("SWMS created successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to create SWMS: " + error.message);
    },
  });

  const handleSelectAll = () => {
    setSelectedEmployeeIds(jobEmployees.map(e => e.id));
  };

  const handleClearAll = () => {
    setSelectedEmployeeIds([]);
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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

              {/* Employee Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Workers Required to Sign
                  </Label>
                  <div className="flex gap-2">
                    {jobEmployees.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-xs h-7"
                      >
                        Select All on Job
                      </Button>
                    )}
                    {selectedEmployeeIds.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-xs h-7"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {allEmployees.length > 0 ? (
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {allEmployees.map((employee) => {
                      const isOnJob = jobEmployees.some(je => je.id === employee.id);
                      return (
                        <div
                          key={employee.id}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`emp-${employee.id}`}
                            checked={selectedEmployeeIds.includes(employee.id)}
                            onCheckedChange={() => toggleEmployee(employee.id)}
                          />
                          <label
                            htmlFor={`emp-${employee.id}`}
                            className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                          >
                            {employee.full_name}
                            {isOnJob && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                On Job
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No employees found</p>
                )}

                {selectedEmployeeIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedEmployeeIds.length} worker{selectedEmployeeIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
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
