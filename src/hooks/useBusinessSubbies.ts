import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PastSubbie {
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  role: string;
  lastUsed: string;
}

/**
 * Fetches all unique subbies this business has ever invited,
 * deduplicated by name + role, sorted by most recently used.
 */
export function useBusinessSubbies() {
  return useQuery({
    queryKey: ["business-subbies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select("recipient_name, recipient_phone, recipient_email, role, created_at")
        .eq("invite_type", "sub_trade")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Deduplicate by name + role, keeping most recent contact info
      const subbieMap = new Map<string, PastSubbie>();
      
      for (const invite of data || []) {
        const key = `${invite.recipient_name.toLowerCase().trim()}-${invite.role.toLowerCase().trim()}`;
        if (!subbieMap.has(key)) {
          subbieMap.set(key, {
            recipient_name: invite.recipient_name,
            recipient_phone: invite.recipient_phone,
            recipient_email: invite.recipient_email,
            role: invite.role,
            lastUsed: invite.created_at,
          });
        }
      }

      return Array.from(subbieMap.values());
    },
  });
}

