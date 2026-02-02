import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Subcontractor {
  id: string;
  business_id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  trade: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubcontractors() {
  return useQuery({
    queryKey: ["subcontractors"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data, error } = await supabase
        .from("subcontractors")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("name");

      if (error) throw error;
      return (data as Subcontractor[]) || [];
    },
  });
}

export function useCreateSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Subcontractor, "id" | "business_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      const { data: subcontractor, error } = await supabase
        .from("subcontractors")
        .insert({
          business_id: profile.business_id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return subcontractor as Subcontractor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] });
      toast.success("Subcontractor added");
    },
    onError: (error) => {
      toast.error("Failed to add subcontractor: " + error.message);
    },
  });
}

export function useUpdateSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Subcontractor> & { id: string }) => {
      const { data: subcontractor, error } = await supabase
        .from("subcontractors")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return subcontractor as Subcontractor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] });
      toast.success("Subcontractor updated");
    },
    onError: (error) => {
      toast.error("Failed to update subcontractor: " + error.message);
    },
  });
}

export function useDeleteSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subcontractors")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] });
      toast.success("Subcontractor deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete subcontractor: " + error.message);
    },
  });
}
