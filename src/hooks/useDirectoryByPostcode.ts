import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DirectoryProfile } from "./usePublicDirectory";

export interface DirectoryProfileWithDistance extends DirectoryProfile {
  distance_km: number;
}

export function useDirectoryByPostcode(postcode: string) {
  const trimmed = postcode.trim();
  const isValid = /^\d{4}$/.test(trimmed);

  return useQuery({
    queryKey: ["directory-by-postcode", trimmed],
    queryFn: async (): Promise<DirectoryProfileWithDistance[]> => {
      const { data, error } = await supabase.rpc(
        "get_directory_profiles_near_postcode" as any,
        { _postcode: trimmed }
      );
      if (error) throw error;
      return (data as DirectoryProfileWithDistance[]) ?? [];
    },
    enabled: isValid,
    staleTime: 1000 * 60 * 5,
  });
}
