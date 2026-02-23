import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubcontractorProfile } from "./useSubcontractorProfile";

export interface SubcontractorInvite {
  id: string;
  status: string;
  role: string;
  start_time: string | null;
  notes: string | null;
  recipient_name: string;
  created_at: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  job_name: string;
  site_address: string;
  business_name: string;
}

export function useSubcontractorInvites() {
  const { data: profile } = useSubcontractorProfile();

  return useQuery({
    queryKey: ["subcontractor-invites", profile?.email, profile?.phone, !!profile],
    enabled: !!profile,
    queryFn: async () => {
      // We need to use the edge function to fetch invites since RLS on external_invites
      // is scoped to business users. We'll use a new edge function for this.
      const { data, error } = await supabase.functions.invoke("subcontractor-get-invites", {
        body: {
          email: profile?.email,
          phone: profile?.phone,
        },
      });

      if (error) throw error;
      return (data?.invites || []) as SubcontractorInvite[];
    },
  });
}
