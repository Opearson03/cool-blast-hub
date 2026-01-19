import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { businessId } = useAuth();
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
      if (!businessId) {
        setData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Use single RPC call for all dashboard stats
        const { data: stats, error } = await supabase.rpc("get_dashboard_stats", {
          p_business_id: businessId,
        });

        if (error) throw error;

        const parsedStats = stats as {
          today_pours: number;
          week_pours: number;
          active_crews: number;
          pending_leave: number;
          pending_itps: number;
        };

        setData({
          businessId,
          todayPoursCount: parsedStats.today_pours || 0,
          weekPoursCount: parsedStats.week_pours || 0,
          activeCrewsCount: parsedStats.active_crews || 0,
          pendingLeaveCount: parsedStats.pending_leave || 0,
          alertsCount: (parsedStats.pending_itps || 0) + (parsedStats.pending_leave || 0),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching business data:", error);
        setData(prev => ({ ...prev, businessId, isLoading: false }));
      }
    };

    fetchData();
  }, [businessId]);

  return data;
}
