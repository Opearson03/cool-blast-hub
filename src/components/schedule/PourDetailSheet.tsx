import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X, MapPin, Clock, Building2, Calendar, Users, Palmtree, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { isEmployeeOnLeave, useEmployeesOnLeave } from "@/hooks/useEmployeesOnLeave";
import { useEmployeeConflicts, getEmployeeConflict } from "@/hooks/useEmployeeConflicts";

type Pour = {
  id: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  status: string | null;
  visit_type: string | null;
  job_id: string;
  estimated_m3?: number | null;
  concrete_supplier?: string | null;
  mpa_strength?: string | null;
  slump?: string | null;
  notes?: string | null;
  job?: {
    id: string;
    name: string;
    site_address: string;
    job_number: string | null;
  };
};

interface PourDetailSheetProps {
  pour: Pour | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const visitTypeLabels: Record<string, string> = {
  pour: "Concrete Pour",
  earthworks: "Earthworks",
  formwork_place: "Place Formwork",
  formwork_strip: "Strip Formwork",
  cure: "Cure",
  seal: "Seal",
  other: "Other",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500 text-white",
  in_progress: "bg-orange-500 text-white",
  completed: "bg-green-500 text-white",
  cancelled: "bg-red-500 text-white",
};

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function PourDetailSheet({ pour, open, onOpenChange }: PourDetailSheetProps) {
  const queryClient = useQueryClient();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinessId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();
      if (profile?.business_id) setBusinessId(profile.business_id);
    };
    loadBusinessId();
  }, []);

  const { data: employeesOnLeave = [] } = useEmployeesOnLeave(businessId);
  const { data: conflictAssignments = [] } = useEmployeeConflicts(pour?.pour_date);

  // Fetch full pour details
  const { data: pourDetails } = useQuery({
    queryKey: ["pour-details", pour?.id],
    enabled: !!pour?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select(`
          *,
          jobs (id, name, site_address, job_number, builder_client)
        `)
        .eq("id", pour!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch all employees
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

  // Fetch assigned employees for this pour
  const { data: assignedEmployees = [] } = useQuery({
    queryKey: ["pour-employees", pour?.id],
    enabled: !!pour?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pour_employees")
        .select("employee_id, profiles(id, full_name)")
        .eq("pour_id", pour!.id);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (assignedEmployees.length > 0) {
      setSelectedEmployees(assignedEmployees.map((e) => e.employee_id));
    } else {
      setSelectedEmployees([]);
    }
  }, [assignedEmployees]);

  const updateEmployees = useMutation({
    mutationFn: async (newEmployees: string[]) => {
      if (!pour) return;
      
      // Delete existing assignments
      await supabase.from("pour_employees").delete().eq("pour_id", pour.id);

      // Insert new assignments
      if (newEmployees.length > 0) {
        const employeeAssignments = newEmployees.map((empId) => ({
          pour_id: pour.id,
          employee_id: empId,
        }));
        const { error } = await supabase
          .from("pour_employees")
          .insert(employeeAssignments);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pour-employees", pour?.id] });
      queryClient.invalidateQueries({ queryKey: ["schedule-pours"] });
      toast.success("Employees updated");
    },
    onError: () => {
      toast.error("Failed to update employees");
    },
  });

  const toggleEmployee = (employeeId: string) => {
    // Check if adding (not removing)
    if (!selectedEmployees.includes(employeeId)) {
      const conflict = getEmployeeConflict(employeeId, conflictAssignments, pour?.id);
      if (conflict) {
        const emp = employees.find((e) => e.id === employeeId);
        toast.error(
          `${emp?.full_name} is already assigned to "${conflict.pour_name}" at ${conflict.job_name} on this date`
        );
        return;
      }
    }
    const newSelection = selectedEmployees.includes(employeeId)
      ? selectedEmployees.filter((id) => id !== employeeId)
      : [...selectedEmployees, employeeId];
    
    setSelectedEmployees(newSelection);
    updateEmployees.mutate(newSelection);
  };

  const removeEmployee = (employeeId: string) => {
    const newSelection = selectedEmployees.filter((id) => id !== employeeId);
    setSelectedEmployees(newSelection);
    updateEmployees.mutate(newSelection);
  };

  if (!pour) return null;

  const visitType = pour.visit_type || "pour";
  const status = pour.status || "scheduled";
  const details = pourDetails || pour;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{pour.pour_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Status and Type */}
          <div className="flex gap-2">
            <Badge className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
            <Badge variant="outline">
              {visitTypeLabels[visitType]}
            </Badge>
          </div>

          {/* Date and Time */}
          {(pour.pour_date || pour.scheduled_time) && (
            <div className="space-y-2">
              {pour.pour_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(pour.pour_date), "EEEE, MMMM d, yyyy")}</span>
                </div>
              )}
              {pour.scheduled_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{pour.scheduled_time.slice(0, 5)}</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Job Info */}
          {pour.job && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Job Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link 
                    to={`/admin/jobs/${pour.job.id}`} 
                    className="text-primary hover:underline"
                  >
                    {pour.job.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{pour.job.site_address}</span>
                </div>
                {pour.job.job_number && (
                  <p className="text-xs text-muted-foreground pl-6">
                    #{pour.job.job_number}
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Assigned Employees */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Assigned Employees</h4>
            </div>

            {/* Selected employees badges */}
            {selectedEmployees.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedEmployees.map((empId) => {
                  const emp = employees.find((e) => e.id === empId);
                  const onLeave = pour?.pour_date && isEmployeeOnLeave(empId, pour.pour_date, employeesOnLeave);
                  return emp ? (
                    <Badge 
                      key={empId} 
                      variant="secondary" 
                      className={cn(
                        "flex items-center gap-1",
                        onLeave && "bg-amber-500/20 text-amber-500 border-amber-500/30"
                      )}
                    >
                      {onLeave && <Palmtree className="h-3 w-3" />}
                      {emp.full_name}
                      {onLeave && <span className="text-xs">(ON LEAVE)</span>}
                      <button
                        type="button"
                        onClick={() => removeEmployee(empId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {/* Add employee dropdown */}
            <Popover open={employeesOpen} onOpenChange={setEmployeesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  role="combobox"
                  className="w-full justify-between"
                >
                  Add employees...
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Search employees..." />
                  <CommandList>
                    <CommandEmpty>No employees found.</CommandEmpty>
                    <CommandGroup>
                      {employees.map((emp) => {
                        const conflict = getEmployeeConflict(emp.id, conflictAssignments, pour?.id);
                        const isSelected = selectedEmployees.includes(emp.id);
                        return (
                          <TooltipProvider key={emp.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CommandItem
                                  value={emp.full_name}
                                  onSelect={() => {
                                    toggleEmployee(emp.id);
                                  }}
                                  className={cn(
                                    conflict && !isSelected && "text-muted-foreground"
                                  )}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {emp.full_name}
                                  {conflict && !isSelected && (
                                    <AlertTriangle className="ml-auto h-4 w-4 text-amber-500" />
                                  )}
                                </CommandItem>
                              </TooltipTrigger>
                              {conflict && !isSelected && (
                                <TooltipContent side="right">
                                  <p>Already assigned to "{conflict.pour_name}" at {conflict.job_name}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Concrete Details (if pour type) */}
          {visitType === "pour" && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Concrete Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {details.estimated_m3 && (
                    <div>
                      <p className="text-muted-foreground text-xs">Estimated m³</p>
                      <p>{details.estimated_m3}</p>
                    </div>
                  )}
                  {details.mpa_strength && (
                    <div>
                      <p className="text-muted-foreground text-xs">MPa</p>
                      <p>{details.mpa_strength}</p>
                    </div>
                  )}
                  {details.slump && (
                    <div>
                      <p className="text-muted-foreground text-xs">Slump</p>
                      <p>{details.slump}</p>
                    </div>
                  )}
                  {details.concrete_supplier && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Supplier</p>
                      <p>{details.concrete_supplier}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {details.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground">{details.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/admin/jobs/${pour.job_id}`}>View Job</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
