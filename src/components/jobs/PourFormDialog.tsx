import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const pourSchema = z.object({
  pour_name: z.string().min(1, "Name is required"),
  visit_type: z.string().default("pour"),
  pour_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  estimated_m3: z.string().optional(),
  actual_m3: z.string().optional(),
  concrete_supplier: z.string().optional(),
  mpa_strength: z.string().optional(),
  slump: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("scheduled"),
});

type PourFormData = z.infer<typeof pourSchema>;

interface PourFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  editPour?: {
    id: string;
    pour_name: string;
    visit_type: string | null;
    pour_date: string | null;
    scheduled_time: string | null;
    estimated_m3: number | null;
    actual_m3: number | null;
    concrete_supplier: string | null;
    mpa_strength: string | null;
    slump: string | null;
    notes: string | null;
    status: string | null;
  } | null;
}

const visitTypeOptions = [
  { value: "pour", label: "Concrete Pour" },
  { value: "earthworks", label: "Earthworks" },
  { value: "formwork_place", label: "Place Formwork" },
  { value: "formwork_strip", label: "Strip Formwork" },
  { value: "cure", label: "Cure" },
  { value: "seal", label: "Seal" },
  { value: "other", label: "Other" },
];

export function PourFormDialog({
  open,
  onOpenChange,
  jobId,
  editPour,
}: PourFormDialogProps) {
  const queryClient = useQueryClient();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Fetch employees for the business
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch assigned employees if editing
  const { data: assignedEmployees = [] } = useQuery({
    queryKey: ["pour-employees", editPour?.id],
    enabled: !!editPour?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pour_employees")
        .select("employee_id")
        .eq("pour_id", editPour!.id);
      if (error) throw error;
      return data.map((e) => e.employee_id);
    },
  });

  useEffect(() => {
    if (assignedEmployees.length > 0) {
      setSelectedEmployees(assignedEmployees);
    } else if (!editPour) {
      setSelectedEmployees([]);
    }
  }, [assignedEmployees, editPour]);

  const form = useForm<PourFormData>({
    resolver: zodResolver(pourSchema),
    defaultValues: {
      pour_name: "",
      visit_type: "pour",
      pour_date: "",
      scheduled_time: "",
      estimated_m3: "",
      actual_m3: "",
      concrete_supplier: "",
      mpa_strength: "",
      slump: "",
      notes: "",
      status: "scheduled",
    },
    values: editPour
      ? {
          pour_name: editPour.pour_name,
          visit_type: editPour.visit_type || "pour",
          pour_date: editPour.pour_date || "",
          scheduled_time: editPour.scheduled_time?.slice(0, 5) || "",
          estimated_m3: editPour.estimated_m3?.toString() || "",
          actual_m3: editPour.actual_m3?.toString() || "",
          concrete_supplier: editPour.concrete_supplier || "",
          mpa_strength: editPour.mpa_strength || "",
          slump: editPour.slump || "",
          notes: editPour.notes || "",
          status: editPour.status || "scheduled",
        }
      : undefined,
  });

  const visitType = form.watch("visit_type");
  const isPour = visitType === "pour";

  const mutation = useMutation({
    mutationFn: async (data: PourFormData) => {
      const pourData = {
        job_id: jobId,
        pour_name: data.pour_name,
        visit_type: data.visit_type,
        pour_date: data.pour_date || null,
        scheduled_time: data.scheduled_time || null,
        estimated_m3: data.estimated_m3 ? parseFloat(data.estimated_m3) : null,
        actual_m3: data.actual_m3 ? parseFloat(data.actual_m3) : null,
        concrete_supplier: data.concrete_supplier || null,
        mpa_strength: data.mpa_strength || null,
        slump: data.slump || null,
        notes: data.notes || null,
        status: data.status,
      };

      let pourId: string;

      if (editPour) {
        const { error } = await supabase
          .from("job_pours")
          .update(pourData)
          .eq("id", editPour.id);
        if (error) throw error;
        pourId = editPour.id;
      } else {
        const { data: newPour, error } = await supabase
          .from("job_pours")
          .insert(pourData)
          .select("id")
          .single();
        if (error) throw error;
        pourId = newPour.id;
      }

      // Update employee assignments
      // Delete existing assignments
      await supabase.from("pour_employees").delete().eq("pour_id", pourId);

      // Insert new assignments
      if (selectedEmployees.length > 0) {
        const employeeAssignments = selectedEmployees.map((empId) => ({
          pour_id: pourId,
          employee_id: empId,
        }));
        const { error: empError } = await supabase
          .from("pour_employees")
          .insert(employeeAssignments);
        if (empError) throw empError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-pours", jobId] });
      queryClient.invalidateQueries({ queryKey: ["schedule-pours"] });
      toast.success(editPour ? "Updated successfully" : "Created successfully");
      onOpenChange(false);
      form.reset();
      setSelectedEmployees([]);
    },
    onError: () => {
      toast.error("Failed to save");
    },
  });

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPour ? "Edit" : "Add"} Site Visit</DialogTitle>
          <DialogDescription>
            Schedule a pour or other site activity
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField
              control={form.control}
              name="visit_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {visitTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pour_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Slab Pour 1, Footings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pour_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduled_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Employee Assignment */}
            <div className="space-y-2">
              <FormLabel>Assigned Employees</FormLabel>
              
              {/* Selected employees badges */}
              {selectedEmployees.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedEmployees.map((empId) => {
                    const emp = employees.find((e) => e.id === empId);
                    return emp ? (
                      <Badge key={empId} variant="secondary" className="flex items-center gap-1">
                        {emp.full_name}
                        <button
                          type="button"
                          onClick={() => toggleEmployee(empId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {/* Searchable employee selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedEmployees.length === 0
                      ? "Select employees..."
                      : `${selectedEmployees.length} selected`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-popover" align="start">
                  <Command>
                    <CommandInput placeholder="Search employees..." />
                    <CommandList>
                      <CommandEmpty>No employees found.</CommandEmpty>
                      <CommandGroup>
                        {employees.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            value={emp.full_name}
                            onSelect={() => toggleEmployee(emp.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployees.includes(emp.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {emp.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Concrete-specific fields - only show for pour type */}
            {isPour && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimated_m3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated m³</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actual_m3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual m³</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="concrete_supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concrete Supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mpa_strength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MPa Strength</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 32" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slump"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slump</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 100mm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editPour ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}