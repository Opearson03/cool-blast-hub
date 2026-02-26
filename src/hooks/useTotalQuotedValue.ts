import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTotalQuotedValue() {
  return useQuery({
    queryKey: ["total-quoted-value"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_total_quoted_value");

      if (error) {
        console.error("Error fetching total quoted value:", error);
        return 0;
      }

      return (data as number) ?? 0;
    },
    staleTime: 300000, // Cache for 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}
