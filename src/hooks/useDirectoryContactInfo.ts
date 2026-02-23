import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDirectoryContactInfo(id: string | undefined) {
  return useQuery({
    queryKey: ["directory-contact-info", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("subcontractor_directory_profiles" as any)
        .select("email, phone")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as { email: string | null; phone: string | null } | null;
    },
    enabled: !!id,
  });
}
