import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useWaitlistCount() {
  return useQuery({
    queryKey: ["waitlist-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_waiting_list_count");
      
      if (error) {
        console.error("Error fetching waitlist count:", error);
        return 0;
      }
      
      return data as number;
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}
