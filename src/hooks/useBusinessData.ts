import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessData {
  businessId: string | null;
  todayPoursCount: number;
  weekPoursCount: number;
  activeCrewsCount: number;
  pendingLeaveCount: number;
  alertsCount: number;
  isLoading: boolean;
}

export function useBusinessData() {
  const [data, setData] = useState<BusinessData>({
    businessId: null,
    todayPoursCount: 0,
    weekPoursCount: 0,
    activeCrewsCount: 0,
    pendingLeaveCount: 0,
    alertsCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.business_id) return;

        const businessId = profile.business_id;
        const today = new Date().toISOString().split("T")[0];
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekEndStr = weekEnd.toISOString().split("T")[0];

        // Fetch today's pours
        const { count: todayCount } = await supabase
          .from("job_pours")
          .select("id, jobs!inner(business_id)", { count: "exact", head: true })
          .eq("jobs.business_id", businessId)
          .eq("pour_date", today);

        // Fetch this week's pours
        const { count: weekCount } = await supabase
          .from("job_pours")
          .select("id, jobs!inner(business_id)", { count: "exact", head: true })
          .eq("jobs.business_id", businessId)
          .gte("pour_date", today)
          .lte("pour_date", weekEndStr);

        // Fetch active crews
        const { count: crewsCount } = await supabase
          .from("crews")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId);

        // Fetch pending leave requests
        const { count: leaveCount } = await supabase
          .from("leave_requests")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("status", "pending");

        // Count alerts (pending ITPs, unsigned SWMS, etc.)
        const { count: pendingItpCount } = await supabase
          .from("job_itps")
          .select("id, jobs!inner(business_id)", { count: "exact", head: true })
          .eq("jobs.business_id", businessId)
          .eq("status", "pending");

        setData({
          businessId,
          todayPoursCount: todayCount || 0,
          weekPoursCount: weekCount || 0,
          activeCrewsCount: crewsCount || 0,
          pendingLeaveCount: leaveCount || 0,
          alertsCount: (pendingItpCount || 0) + (leaveCount || 0),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching business data:", error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, []);

  return data;
}
