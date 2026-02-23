import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubcontractorReview {
  id: string;
  subcontractor_profile_id: string;
  reviewer_user_id: string;
  reviewer_name: string | null;
  reviewer_business_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function useSubcontractorReviews(profileId: string | undefined) {
  return useQuery({
    queryKey: ["subcontractor-reviews", profileId],
    queryFn: async (): Promise<SubcontractorReview[]> => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from("subcontractor_reviews" as any)
        .select("*")
        .eq("subcontractor_profile_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as SubcontractorReview[]) ?? [];
    },
    enabled: !!profileId,
  });
}

export function useMyReviewForProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ["my-review", profileId],
    queryFn: async (): Promise<SubcontractorReview | null> => {
      if (!profileId) return null;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data, error } = await supabase
        .from("subcontractor_reviews" as any)
        .select("*")
        .eq("subcontractor_profile_id", profileId)
        .eq("reviewer_user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SubcontractorReview | null;
    },
    enabled: !!profileId,
  });
}

export function useOwnReviews() {
  return useQuery({
    queryKey: ["own-subcontractor-reviews"],
    queryFn: async (): Promise<SubcontractorReview[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      // Get the subcontractor's profile id
      const { data: profile } = await supabase
        .from("subcontractor_directory_profiles" as any)
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!profile) return [];
      const { data, error } = await supabase
        .from("subcontractor_reviews" as any)
        .select("*")
        .eq("subcontractor_profile_id", (profile as any).id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as SubcontractorReview[]) ?? [];
    },
  });
}

interface SubmitReviewInput {
  subcontractor_profile_id: string;
  rating: number;
  comment?: string;
  reviewer_name?: string;
  reviewer_business_name?: string;
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("subcontractor_reviews" as any)
        .upsert(
          {
            subcontractor_profile_id: input.subcontractor_profile_id,
            reviewer_user_id: session.user.id,
            rating: input.rating,
            comment: input.comment || null,
            reviewer_name: input.reviewer_name || null,
            reviewer_business_name: input.reviewer_business_name || null,
          },
          { onConflict: "subcontractor_profile_id,reviewer_user_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subcontractor-reviews", variables.subcontractor_profile_id] });
      queryClient.invalidateQueries({ queryKey: ["my-review", variables.subcontractor_profile_id] });
      queryClient.invalidateQueries({ queryKey: ["public-directory-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["public-directory-profile", variables.subcontractor_profile_id] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, profileId }: { reviewId: string; profileId: string }) => {
      const { error } = await supabase
        .from("subcontractor_reviews" as any)
        .delete()
        .eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subcontractor-reviews", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["my-review", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["public-directory-profiles"] });
    },
  });
}
