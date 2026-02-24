import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubcontractorProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  abn: string | null;
  legal_name: string | null;
  gst_registered: boolean;
  entity_type: string | null;
  abn_verified: boolean;
  trade_types: string[] | null;
  years_experience: number | null;
  service_radius_km: number | null;
  base_postcode: string | null;
  insurance_certificate_url: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  availability_status: string;
  has_white_card: boolean;
  white_card_number: string | null;
  white_card_document_url: string | null;
  show_availability_in_directory: boolean;
  created_at: string;
  updated_at: string;
}

export function useSubcontractorProfile() {
  return useQuery({
    queryKey: ["subcontractor-profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from("subcontractor_directory_profiles" as any)
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as SubcontractorProfile | null;
    },
  });
}

export function useUpdateSubcontractorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<SubcontractorProfile>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("subcontractor_directory_profiles" as any)
        .update(updates)
        .eq("user_id", session.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SubcontractorProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractor-profile"] });
    },
  });
}

export function useCreateSubcontractorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<SubcontractorProfile>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("subcontractor_directory_profiles" as any)
        .insert({ ...profile, user_id: session.user.id })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SubcontractorProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractor-profile"] });
    },
  });
}

export function calculateProfileCompletion(profile: SubcontractorProfile | null): number {
  if (!profile) return 0;
  const checks = [
    !!(profile.first_name && profile.last_name),
    !!profile.phone,
    !!profile.email,
    profile.abn_verified,
    !!(profile.trade_types && profile.trade_types.length > 0),
    !!profile.years_experience,
    !!(profile.service_radius_km && profile.base_postcode),
    !!profile.insurance_certificate_url,
    !!profile.profile_photo_url,
    !!profile.bio,
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}
