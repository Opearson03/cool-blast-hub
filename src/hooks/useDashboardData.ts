import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

interface DashboardData {
  todayTasksCount: number;
  pendingInvitesCount: number;
  actionsRequiredCount: number;
  isLoading: boolean;
}

export function useDashboardData(businessId: string | null) {
  const [data, setData] = useState<DashboardData>({
    todayTasksCount: 0,
    pendingInvitesCount: 0,
    actionsRequiredCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId) {
        setData((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const weekAhead = format(addDays(new Date(), 7), "yyyy-MM-dd");

        // Fetch today's tasks count
        const { count: todayTasks } = await supabase
          .from("job_pours")
          .select("id, job:jobs!inner(business_id)", { count: "exact", head: true })
          .eq("pour_date", today)
          .eq("job.business_id", businessId);

        // Fetch pending subbie invites for next 7 days
        const { count: pendingInvites } = await supabase
          .from("external_invites")
          .select("id, job_pour:job_pours!inner(pour_date)", { count: "exact", head: true })
          .eq("business_id", businessId)
          .in("status", ["sent", "viewed", "drafted"])
          .gte("job_pour.pour_date", today)
          .lte("job_pour.pour_date", weekAhead);

        // Fetch actions required (pending leave + unsigned quotes)
        const { count: pendingLeave } = await supabase
          .from("leave_requests")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("status", "pending");

        const { count: unsignedQuotes } = await supabase
          .from("estimates")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("status", "sent")
          .is("signed_at", null);

        setData({
          todayTasksCount: todayTasks || 0,
          pendingInvitesCount: pendingInvites || 0,
          actionsRequiredCount: (pendingLeave || 0) + (unsignedQuotes || 0),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setData((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, [businessId]);

  return data;
}
