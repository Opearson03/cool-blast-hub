import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PourAssignment {
  pour_id: string;
  employee_id: string;
  pour_name: string;
  pour_date: string;
  job_name: string;
}

export function useEmployeeConflicts(pourDate: string | null | undefined) {
  return useQuery({
    queryKey: ["employee-pour-assignments", pourDate],
    enabled: !!pourDate,
    queryFn: async () => {
      if (!pourDate) return [];
      
      const { data, error } = await supabase
        .from("pour_employees")
        .select(`
          pour_id,
          employee_id,
          job_pours!inner(
            pour_name,
            pour_date,
            jobs!inner(name)
          )
        `)
        .eq("job_pours.pour_date", pourDate);

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        pour_id: item.pour_id,
        employee_id: item.employee_id,
        pour_name: item.job_pours.pour_name,
        pour_date: item.job_pours.pour_date,
        job_name: item.job_pours.jobs.name,
      })) as PourAssignment[];
    },
  });
}

export function getEmployeeConflict(
  employeeId: string,
  assignments: PourAssignment[],
  currentPourId?: string
): PourAssignment | null {
  const conflict = assignments.find(
    (a) => a.employee_id === employeeId && a.pour_id !== currentPourId
  );
  return conflict || null;
}

export function hasEmployeeConflict(
  employeeId: string,
  assignments: PourAssignment[],
  currentPourId?: string
): boolean {
  return getEmployeeConflict(employeeId, assignments, currentPourId) !== null;
}
