import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserX, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, isWeekend, isSameDay, startOfDay, isToday, isSaturday, isSunday, nextMonday } from "date-fns";
import { cn } from "@/lib/utils";

interface UnassignedEmployeesWidgetProps {
  businessId: string;
}

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
}

export function UnassignedEmployeesWidget({ businessId }: UnassignedEmployeesWidgetProps) {
  // Default to today, or next Monday if weekend
  const getDefaultDate = () => {
    const today = new Date();
    if (isSaturday(today)) return nextMonday(today);
    if (isSunday(today)) return nextMonday(today);
    return today;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate());

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

        {/* Unassigned List */}
        {unassignedEmployees.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Unassigned Employees:</p>
            {unassignedEmployees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-2 rounded-lg bg-background/50"
              >
                <div>
                  <p className="font-medium text-sm">{emp.full_name}</p>
                  {emp.position && (
                    <p className="text-xs text-muted-foreground">{emp.position}</p>
                  )}
                </div>
              </div>
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
  );
}