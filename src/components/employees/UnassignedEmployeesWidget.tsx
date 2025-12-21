import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserX, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, UserPlus } from "lucide-react";
import { format, addDays, isWeekend, isToday, isSaturday, isSunday, nextMonday } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UnassignedEmployeesWidgetProps {
  businessId: string;
}

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
}

interface Pour {
  id: string;
  pour_name: string;
  pour_date: string;
  job_id: string;
  jobs?: { name: string; site_address: string };
}

export function UnassignedEmployeesWidget({ businessId }: UnassignedEmployeesWidgetProps) {
  const queryClient = useQueryClient();
  
  // Default to today, or next Monday if weekend
  const getDefaultDate = () => {
    const today = new Date();
    if (isSaturday(today)) return nextMonday(today);
    if (isSunday(today)) return nextMonday(today);
    return today;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPourId, setSelectedPourId] = useState<string>("");
  
  // Quick add pour state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddJobId, setQuickAddJobId] = useState<string>("");
  const [quickAddPourName, setQuickAddPourName] = useState<string>("");

  // Fetch all employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["team-employees-unassigned", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_profiles");
      if (error) throw error;
      return (data || []) as Employee[];
    },
    enabled: !!businessId,
  });

  // Fetch jobs for quick add
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-active", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, name, site_address")
        .eq("business_id", businessId)
        .in("status", ["scheduled", "in_progress"])
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId,
  });

  // Fetch pours for the selected date
  const { data: poursForDate = [] } = useQuery({
    queryKey: ["pours-for-date", businessId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("job_pours")
        .select(`
          id,
          pour_name,
          pour_date,
          job_id,
          jobs!inner(name, site_address, business_id)
        `)
        .eq("pour_date", dateStr)
        .eq("jobs.business_id", businessId);

      if (error) throw error;
      return (data || []) as Pour[];
    },
    enabled: !!businessId,
  });

  // Fetch pour assignments for the selected date
  const { data: pourAssignments = [] } = useQuery({
    queryKey: ["pour-assignments-date", businessId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("pour_employees")
        .select(`
          employee_id,
          job_pours!inner(pour_date)
        `)
        .eq("job_pours.pour_date", dateStr);

      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId,
  });

  // Fetch approved leave for the selected date
  const { data: leaveRecords = [] } = useQuery({
    queryKey: ["leave-date", businessId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("leave_requests")
        .select("employee_id, start_date, end_date")
        .eq("business_id", businessId)
        .eq("status", "approved")
        .lte("start_date", dateStr)
        .gte("end_date", dateStr);

      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId,
  });

  // Assign employee to pour mutation
  const assignMutation = useMutation({
    mutationFn: async ({ pourId, employeeId }: { pourId: string; employeeId: string }) => {
      const { error } = await supabase
        .from("pour_employees")
        .insert({ pour_id: pourId, employee_id: employeeId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pour-assignments-date"] });
      toast.success("Employee assigned successfully");
      setAssignDialogOpen(false);
      setSelectedEmployee(null);
      setSelectedPourId("");
    },
    onError: () => {
      toast.error("Failed to assign employee");
    },
  });

  // Quick add pour mutation
  const quickAddMutation = useMutation({
    mutationFn: async ({ jobId, pourName, employeeId }: { jobId: string; pourName: string; employeeId: string }) => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      // Create the pour
      const { data: newPour, error: pourError } = await supabase
        .from("job_pours")
        .insert({
          job_id: jobId,
          pour_name: pourName,
          pour_date: dateStr,
          status: "scheduled",
        })
        .select("id")
        .single();

      if (pourError) throw pourError;

      // Assign the employee
      const { error: assignError } = await supabase
        .from("pour_employees")
        .insert({ pour_id: newPour.id, employee_id: employeeId });

      if (assignError) throw assignError;

      return newPour;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pour-assignments-date"] });
      queryClient.invalidateQueries({ queryKey: ["pours-for-date"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-pours"] });
      toast.success("Site visit created and employee assigned");
      setQuickAddOpen(false);
      setQuickAddJobId("");
      setQuickAddPourName("");
      setSelectedEmployee(null);
    },
    onError: () => {
      toast.error("Failed to create site visit");
    },
  });

  // Find employees who are not assigned to any pour and not on leave for the selected date
  const unassignedEmployees = employees.filter((emp) => {
    const hasAssignment = pourAssignments.some(
      (pa: any) => pa.employee_id === emp.id
    );
    const isOnLeave = leaveRecords.some((lr: any) => lr.employee_id === emp.id);
    return !hasAssignment && !isOnLeave;
  });

  const assignedEmployees = employees.filter((emp) => {
    const hasAssignment = pourAssignments.some(
      (pa: any) => pa.employee_id === emp.id
    );
    return hasAssignment;
  });

  const onLeaveEmployees = employees.filter((emp) => {
    const isOnLeave = leaveRecords.some((lr: any) => lr.employee_id === emp.id);
    return isOnLeave;
  });

  const goToPreviousDay = () => {
    let newDate = addDays(selectedDate, -1);
    // Skip weekends
    while (isWeekend(newDate)) {
      newDate = addDays(newDate, -1);
    }
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    let newDate = addDays(selectedDate, 1);
    // Skip weekends
    while (isWeekend(newDate)) {
      newDate = addDays(newDate, 1);
    }
    setSelectedDate(newDate);
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    if (poursForDate.length > 0) {
      setAssignDialogOpen(true);
    } else {
      setQuickAddOpen(true);
    }
  };

  const handleAssign = () => {
    if (selectedEmployee && selectedPourId) {
      assignMutation.mutate({ pourId: selectedPourId, employeeId: selectedEmployee.id });
    }
  };

  const handleQuickAdd = () => {
    if (selectedEmployee && quickAddJobId && quickAddPourName) {
      quickAddMutation.mutate({
        jobId: quickAddJobId,
        pourName: quickAddPourName,
        employeeId: selectedEmployee.id,
      });
    }
  };

  if (loadingEmployees) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserX className="h-4 w-4 text-amber-600" />
            Employee Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Date Selector */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, d MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => isWeekend(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-amber-500/20">
              <p className="text-lg font-bold text-amber-600">{unassignedEmployees.length}</p>
              <p className="text-xs text-muted-foreground">Unassigned</p>
            </div>
            <div className="p-2 rounded bg-green-500/20">
              <p className="text-lg font-bold text-green-600">{assignedEmployees.length}</p>
              <p className="text-xs text-muted-foreground">Working</p>
            </div>
            <div className="p-2 rounded bg-blue-500/20">
              <p className="text-lg font-bold text-blue-600">{onLeaveEmployees.length}</p>
              <p className="text-xs text-muted-foreground">On Leave</p>
            </div>
          </div>

          {/* Pours happening that day */}
          {poursForDate.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Site visits on this day: {poursForDate.length}
              </p>
            </div>
          )}

          {/* Unassigned List */}
          {unassignedEmployees.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Click to assign:
              </p>
              {unassignedEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleEmployeeClick(emp)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-primary/10 transition-colors cursor-pointer text-left"
                >
                  <div>
                    <p className="font-medium text-sm">{emp.full_name}</p>
                    {emp.position && (
                      <p className="text-xs text-muted-foreground">{emp.position}</p>
                    )}
                  </div>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {unassignedEmployees.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              All employees are assigned or on leave for this date.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assign to existing pour dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selectedEmployee?.full_name}</DialogTitle>
            <DialogDescription>
              Select a site visit happening on {format(selectedDate, "EEE, d MMM")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Site Visit</Label>
              <Select value={selectedPourId} onValueChange={setSelectedPourId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site visit" />
                </SelectTrigger>
                <SelectContent>
                  {poursForDate.map((pour) => (
                    <SelectItem key={pour.id} value={pour.id}>
                      {pour.pour_name} - {pour.jobs?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAssignDialogOpen(false);
                  setQuickAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Site Visit
              </Button>
              <Button
                className="flex-1"
                onClick={handleAssign}
                disabled={!selectedPourId || assignMutation.isPending}
              >
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick add pour dialog */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Site Visit</DialogTitle>
            <DialogDescription>
              Create a new site visit for {format(selectedDate, "EEE, d MMM")} and assign {selectedEmployee?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Job</Label>
              <Select value={quickAddJobId} onValueChange={setQuickAddJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name} - {job.site_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site Visit Name</Label>
              <Input
                placeholder="e.g., Slab Pour, Footings, Strip Formwork"
                value={quickAddPourName}
                onChange={(e) => setQuickAddPourName(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleQuickAdd}
              disabled={!quickAddJobId || !quickAddPourName || quickAddMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create & Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
