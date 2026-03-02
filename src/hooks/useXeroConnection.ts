import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useXeroConnection() {
  const { businessId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectionQuery = useQuery({
    queryKey: ["xero-connection", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase
        .from("xero_connections" as any)
        .select("id, xero_org_name, xero_tenant_id, created_at, updated_at")
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as {
        id: string;
        xero_org_name: string | null;
        xero_tenant_id: string | null;
        created_at: string;
        updated_at: string;
      } | null;
    },
    enabled: !!businessId,
  });

  const connectMutation = useMutation({
    mutationFn: async (scopeTier?: string) => {
      const { data, error } = await supabase.functions.invoke("xero-auth", {
        method: "POST",
        body: { scope_tier: scopeTier || "full" },
      });
      if (error) throw error;
      if (data?.url) {
        // Store debug info for display
        if (data?._debug) {
          sessionStorage.setItem("xero_debug", JSON.stringify(data._debug));
        }
        window.location.href = data.url;
      } else {
        throw new Error("No authorization URL returned");
      }
    },
    onError: (err: any) => {
      toast({
        title: "Failed to connect to Xero",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("xero-api", {
        method: "POST",
        body: { action: "disconnect" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xero-connection"] });
      toast({ title: "Xero disconnected" });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to disconnect",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (scopeTier?: string) => {
      // Step 1: Reset all local state
      const { data, error } = await supabase.functions.invoke("xero-api", {
        method: "POST",
        body: { action: "reset_connection" },
      });
      if (error) throw error;
      return { resetResult: data, scopeTier };
    },
    onSuccess: async ({ resetResult, scopeTier }) => {
      queryClient.invalidateQueries({ queryKey: ["xero-connection"] });
      toast({
        title: "Xero reset complete",
        description: `Connection cleared${resetResult.clearedSyncLog > 0 ? ` (${resetResult.clearedSyncLog} sync logs removed)` : ""}. Redirecting to Xero...`,
      });
      // Step 2: Immediately start fresh connect
      setTimeout(() => connectMutation.mutate(scopeTier), 500);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to reset Xero",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return {
    connection: connectionQuery.data,
    isLoading: connectionQuery.isLoading,
    isConnected: !!connectionQuery.data,
    connect: connectMutation.mutate,
    isConnecting: connectMutation.isPending,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    reset: resetMutation.mutate,
    isResetting: resetMutation.isPending,
  };
}

export function useXeroSyncLog(sourceType: string, sourceId: string) {
  const { businessId } = useAuth();

  return useQuery({
    queryKey: ["xero-sync-log", sourceType, sourceId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase
        .from("xero_sync_log" as any)
        .select("*")
        .eq("business_id", businessId)
        .eq("source_type", sourceType)
        .eq("source_id", sourceId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as {
        id: string;
        xero_invoice_id: string | null;
        xero_invoice_number: string | null;
        xero_status: string | null;
        last_synced_at: string;
      } | null;
    },
    enabled: !!businessId && !!sourceId,
  });
}

export function useSendToXero() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sourceType: "estimate" | "variation";
      sourceId: string;
      clientName: string;
      clientEmail?: string | null;
      clientPhone?: string | null;
      lineItems: Array<{
        description: string;
        quantity: number;
        unit_price: number;
      }>;
      reference?: string;
    }) => {
      // Step 1: Create/find contact
      const { data: contactData, error: contactErr } = await supabase.functions.invoke("xero-api", {
        method: "POST",
        body: {
          action: "create_contact",
          name: params.clientName,
          email: params.clientEmail,
          phone: params.clientPhone,
          source_id: params.sourceId,
        },
      });
      if (contactErr) throw contactErr;

      // Step 2: Create invoice
      const { data: invoiceData, error: invoiceErr } = await supabase.functions.invoke("xero-api", {
        method: "POST",
        body: {
          action: "create_invoice",
          contact_id: contactData.contact_id,
          line_items: params.lineItems,
          reference: params.reference,
          source_type: params.sourceType,
          source_id: params.sourceId,
        },
      });
      if (invoiceErr) throw invoiceErr;

      return invoiceData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["xero-sync-log"] });
      toast({
        title: "Sent to Xero",
        description: `Invoice ${data.invoice_number} created as draft`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to send to Xero",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
