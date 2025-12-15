import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeOnLeave {
  employee_id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
}

export function useEmployeesOnLeave(businessId: string | null) {
  return useQuery({
    queryKey: ["employees-on-leave", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return [];

      const { data, error } = await supabase
        .from("leave_requests")
        .select("employee_id, leave_type, start_date, end_date, profiles!leave_requests_employee_id_fkey(full_name)")
        .eq("business_id", businessId)
        .eq("status", "approved");

      if (error) throw error;

      return (data || []).map((item: any) => ({
        employee_id: item.employee_id,
        employee_name: item.profiles?.full_name || "Unknown",
        leave_type: item.leave_type,
        start_date: item.start_date,
        end_date: item.end_date,
      })) as EmployeeOnLeave[];
    },
  });
}

export function isEmployeeOnLeave(
  employeeId: string,
  date: string,
  leaveData: EmployeeOnLeave[]
): boolean {
  return leaveData.some((leave) => {
    if (leave.employee_id !== employeeId) return false;
    const checkDate = new Date(date);
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);
    return checkDate >= startDate && checkDate <= endDate;
  });
}

export function getEmployeesOnLeaveForDate(
  date: string,
  leaveData: EmployeeOnLeave[]
): EmployeeOnLeave[] {
  const checkDate = new Date(date);
  return leaveData.filter((leave) => {
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);
    return checkDate >= startDate && checkDate <= endDate;
  });
}
