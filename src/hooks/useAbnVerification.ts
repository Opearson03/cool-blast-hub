import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AbnVerificationResult {
  valid: boolean;
  legal_name?: string;
  gst_registered?: boolean;
  entity_type?: string;
  abn_status?: string;
  error_message?: string;
}

export function useAbnVerification() {
  return useMutation({
    mutationFn: async (abn: string): Promise<AbnVerificationResult> => {
      const { data, error } = await supabase.functions.invoke("verify-abn", {
        body: { abn },
      });

      if (error) throw new Error(error.message || "Failed to verify ABN");
      return data as AbnVerificationResult;
    },
  });
}
