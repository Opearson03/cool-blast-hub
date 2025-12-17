import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserX, Calendar } from "lucide-react";
import { format, addDays, isWeekend, isSameDay } from "date-fns";

interface FloatingEmployeesWidgetProps {
  businessId: string;
}

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
}

export function FloatingEmployeesWidget({ businessId }: FloatingEmployeesWidgetProps) {
  // Get next 5 weekdays
  const getNext5Weekdays = () => {
    const weekdays: Date[] = [];
    let current = new Date();
    while (weekdays.length < 5) {
      if (!isWeekend(current)) {
        weekdays.push(current);
      }
      current = addDays(current, 1);
    }
    return weekdays;
  };

  const weekdays = getNext5Weekdays();
  const startDate = weekdays[0];
  const endDate = weekdays[weekdays.length - 1];

  // Fetch all employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["team-employees", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_profiles");
      if (error) throw error;
      return (data || []) as Employee[];
    },
    enabled: !!businessId,
  });

  // Fetch pour assignments for the period
  const { data: pourAssignments = [] } = useQuery({
    queryKey: ["pour-assignments", businessId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pour_employees")
        .select(`
          employee_id,
          job_pours!inner(pour_date)
        `)
        .gte("job_pours.pour_date", format(startDate, "yyyy-MM-dd"))
        .lte("job_pours.pour_date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId,
  });

  // Fetch approved leave for the period
  const { data: leaveRecords = [] } = useQuery({
    queryKey: ["leave-period", businessId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("employee_id, start_date, end_date")
        .eq("business_id", businessId)
        .eq("status", "approved")
        .or(`start_date.lte.${format(endDate, "yyyy-MM-dd")},end_date.gte.${format(startDate, "yyyy-MM-dd")}`);

      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId,
  });

  // Find employees who are not assigned to any pour and not on leave for any of the 5 weekdays
  const floatingEmployees = employees.filter((emp) => {
    // Check if employee has any pour assignment in the period
    const hasAssignment = pourAssignments.some(
      (pa: any) => pa.employee_id === emp.id
    );

    // Check if employee is on approved leave for any of the weekdays
    const isOnLeave = leaveRecords.some((lr: any) => {
      if (lr.employee_id !== emp.id) return false;
      const leaveStart = new Date(lr.start_date);
      const leaveEnd = new Date(lr.end_date);
      return weekdays.some((day) => day >= leaveStart && day <= leaveEnd);
    });

    return !hasAssignment && !isOnLeave;
  });

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

  if (floatingEmployees.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserX className="h-4 w-4 text-amber-600" />
          Unassigned Employees
          <Badge variant="outline" className="ml-auto bg-amber-500/20 text-amber-600 border-amber-500/30">
            {floatingEmployees.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Next 5 weekdays: {format(startDate, "d MMM")} - {format(endDate, "d MMM")}
        </p>
        <div className="space-y-2">
          {floatingEmployees.map((emp) => (
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
      </CardContent>
    </Card>
  );
}