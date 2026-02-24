import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicUnavailableDates(
  profileId: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["public-unavailable-dates", profileId],
    queryFn: async (): Promise<string[]> => {
      if (!profileId) return [];
      const { data, error } = await supabase.rpc("get_public_unavailable_dates", {
        _id: profileId,
      });
      if (error) throw error;
      return (data as { date: string }[])?.map((d) => d.date) ?? [];
    },
    enabled: !!profileId && enabled,
    staleTime: 1000 * 60 * 5,
  });
}
