import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubTradeInvite {
  id: string;
  business_id: string;
  job_id: string;
  job_pour_id: string;
  invite_type: string;
  role: string;
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  notes: string | null;
  status: "drafted" | "sent" | "viewed" | "accepted" | "declined" | "revoked" | "expired";
  token_expires_at: string;
  sent_via: "sms" | "email" | "both" | null;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  created_at: string;
}

export function useSubTradeInvites(jobPourId: string | undefined) {
  return useQuery({
    queryKey: ["sub-trade-invites", jobPourId],
    enabled: !!jobPourId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select("*")
        .eq("job_pour_id", jobPourId!)
        .eq("invite_type", "sub_trade")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SubTradeInvite[];
    },
  });
}

export function useSubTradeInvitesForJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["sub-trade-invites-job", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select("*")
        .eq("job_id", jobId!)
        .eq("invite_type", "sub_trade")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SubTradeInvite[];
    },
  });
}

export function useSendSubTradeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      job_pour_id: string;
      recipient_name: string;
      role: string;
      recipient_phone?: string;
      recipient_email?: string;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("send-subtrade-invite", {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sub-trade-invites", variables.job_pour_id] });
      queryClient.invalidateQueries({ queryKey: ["sub-trade-invites-job"] });
    },
  });
}

export function useRevokeSubTradeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteId, jobPourId }: { inviteId: string; jobPourId: string }) => {
      const { error } = await supabase
        .from("external_invites")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("id", inviteId);

      if (error) throw error;
      return { jobPourId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sub-trade-invites", result.jobPourId] });
      queryClient.invalidateQueries({ queryKey: ["sub-trade-invites-job"] });
    },
  });
}

// Aggregated invite stats for a pour
export function useSubTradeStats(invites: SubTradeInvite[] | undefined) {
  if (!invites || invites.length === 0) {
    return { total: 0, confirmed: 0, pending: 0, declined: 0 };
  }

  const confirmed = invites.filter((i) => i.status === "accepted").length;
  const declined = invites.filter((i) => i.status === "declined").length;
  const pending = invites.filter((i) => ["sent", "viewed"].includes(i.status)).length;

  return {
    total: invites.length,
    confirmed,
    pending,
    declined,
  };
}
