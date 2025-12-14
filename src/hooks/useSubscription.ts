import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/subscription-tiers";

interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  tier: SubscriptionTier | null;
  subscriptionEnd: string | null;
  employeeLimit: number;
  error: string | null;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    tier: null,
    subscriptionEnd: null,
    employeeLimit: 5,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({
          isLoading: false,
          isSubscribed: false,
          tier: null,
          subscriptionEnd: null,
          employeeLimit: 5,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setState({
        isLoading: false,
        isSubscribed: data.subscribed,
        tier: data.tier as SubscriptionTier | null,
        subscriptionEnd: data.subscription_end,
        employeeLimit: data.employee_limit || 5,
        error: null,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to check subscription",
      }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // Refresh subscription status every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const canAddEmployee = useCallback(
    (currentCount: number) => currentCount < state.employeeLimit,
    [state.employeeLimit]
  );

  const isFeatureEnabled = useCallback(
    (feature: string) => {
      if (!state.tier) return false;
      const tierConfig = SUBSCRIPTION_TIERS[state.tier];
      return tierConfig.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
    },
    [state.tier]
  );

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      throw error;
    }
  }, []);

  return {
    ...state,
    checkSubscription,
    canAddEmployee,
    isFeatureEnabled,
    openCustomerPortal,
    tierConfig: state.tier ? SUBSCRIPTION_TIERS[state.tier] : null,
  };
}
