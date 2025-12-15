import { useState, useEffect } from "react";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { supabase } from "@/integrations/supabase/client";
import { LeaveRequestFormDialog } from "@/components/leave/LeaveRequestFormDialog";
import { LeaveRequestsList } from "@/components/leave/LeaveRequestsList";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  created_at: string;
}

export default function EmployeeLeave() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as LeaveRequest[]);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <LeaveRequestFormDialog onSuccess={fetchRequests} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <LeaveRequestsList requests={requests} isAdmin={false} onUpdate={fetchRequests} />
        )}
      </div>
    </EmployeeLayout>
  );
}
