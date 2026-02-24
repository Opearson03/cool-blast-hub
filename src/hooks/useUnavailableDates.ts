import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnavailableDate {
  id: string;
  user_id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

export function useUnavailableDates() {
  return useQuery({
    queryKey: ["unavailable-dates"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from("subcontractor_unavailable_dates" as any)
        .select("*")
        .eq("user_id", session.user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      return (data as unknown as UnavailableDate[]) ?? [];
    },
  });
}

export function useToggleUnavailableDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, reason }: { date: string; reason?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Check if date already exists
      const { data: existing } = await supabase
        .from("subcontractor_unavailable_dates" as any)
        .select("id")
        .eq("user_id", session.user.id)
        .eq("date", date)
        .maybeSingle();

      if (existing) {
        // Remove - mark as available again
        const { error } = await supabase
          .from("subcontractor_unavailable_dates" as any)
          .delete()
          .eq("id", (existing as any).id);
        if (error) throw error;
        return { action: "removed" as const };
      } else {
        // Add - mark as unavailable
        const { error } = await supabase
          .from("subcontractor_unavailable_dates" as any)
          .insert({ user_id: session.user.id, date, reason: reason || null });
        if (error) throw error;
        return { action: "added" as const };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unavailable-dates"] });
    },
  });
}
