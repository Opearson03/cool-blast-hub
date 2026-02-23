import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DirectoryProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  trade_types: string[];
  years_experience: number | null;
  service_radius_km: number | null;
  base_postcode: string | null;
  bio: string | null;
  availability_status: string | null;
  abn_verified: boolean;
  gst_registered: boolean;
  has_white_card: boolean;
  legal_name: string | null;
  avg_rating: number;
  review_count: number;
}

export function usePublicDirectoryProfiles() {
  return useQuery({
    queryKey: ["public-directory-profiles"],
    queryFn: async (): Promise<DirectoryProfile[]> => {
      const { data, error } = await supabase.rpc("get_public_directory_profiles");
      if (error) throw error;
      return (data as DirectoryProfile[]) ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicDirectoryProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["public-directory-profile", id],
    queryFn: async (): Promise<DirectoryProfile | null> => {
      if (!id) return null;
      const { data, error } = await supabase.rpc("get_public_directory_profile", { _id: id });
      if (error) throw error;
      const rows = data as DirectoryProfile[];
      return rows?.[0] ?? null;
    },
    enabled: !!id,
  });
}
