import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/subscription-tiers";

const SUBSCRIPTION_CACHE_KEY = "pourhub_subscription_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedSubscription {
  subscribed: boolean;
  tier: SubscriptionTier | null;
  subscriptionEnd: string | null;
  employeeLimit: number;
  isExempt: boolean;
  cachedAt: number;
}

interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  tier: SubscriptionTier | null;
  subscriptionEnd: string | null;
  employeeLimit: number;
  error: string | null;
  isExempt: boolean;
}

function getCachedSubscription(): CachedSubscription | null {
  try {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!cached) return null;
    
    const data = JSON.parse(cached) as CachedSubscription;
    const now = Date.now();
    
    // Return cached data if within TTL
    if (now - data.cachedAt < CACHE_TTL_MS) {
      return data;
    }
    
    // Cache expired, but still return it for optimistic rendering
    return data;
  } catch {
    return null;
  }
}

function setCachedSubscription(data: Omit<CachedSubscription, "cachedAt">) {
  try {
    localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify({
      ...data,
      cachedAt: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}

export function useSubscription() {
  // Initialize from cache for instant loading
  const cachedData = getCachedSubscription();
  
  const [state, setState] = useState<SubscriptionState>({
    // If we have cached data, don't show loading state
    isLoading: !cachedData,
    isSubscribed: cachedData?.subscribed ?? false,
    tier: cachedData?.tier ?? null,
    subscriptionEnd: cachedData?.subscriptionEnd ?? null,
    employeeLimit: cachedData?.employeeLimit ?? 5,
    error: null,
    isExempt: cachedData?.isExempt ?? false,
  });

  const checkSubscription = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const emptyState = {
          isLoading: false,
          isSubscribed: false,
          tier: null,
          subscriptionEnd: null,
          employeeLimit: 5,
          error: null,
          isExempt: false,
        };
        setState(emptyState);
        localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // If there was a token error, keep using cached data and don't update state
      if (data.token_error) {
        console.log("Token error from subscription check, using cached data");
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const newState = {
        isLoading: false,
        isSubscribed: data.subscribed,
        tier: data.tier as SubscriptionTier | null,
        subscriptionEnd: data.subscription_end,
        employeeLimit: data.employee_limit || 5,
        error: null,
        isExempt: data.is_exempt || false,
      };
      
      setState(newState);
      
      // Cache the result
      setCachedSubscription({
        subscribed: data.subscribed,
        tier: data.tier,
        subscriptionEnd: data.subscription_end,
        employeeLimit: data.employee_limit || 5,
        isExempt: data.is_exempt || false,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      // Don't clear access on error if we have cached data
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to check subscription",
      }));
    }
  }, []);

  useEffect(() => {
    // Check subscription in background (don't block UI if we have cache)
    checkSubscription(false);

    // Refresh subscription status every 60 seconds
    const interval = setInterval(() => checkSubscription(false), 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const checkEmployeeLimit = useCallback(async (): Promise<{
    canAdd: boolean;
    currentCount: number;
    limit: number;
    isExempt: boolean;
  }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { canAdd: false, currentCount: 0, limit: 5, isExempt: false };
      }

      const { data, error } = await supabase.functions.invoke("check-employee-limit", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      return {
        canAdd: data.can_add,
        currentCount: data.current_count,
        limit: data.limit,
        isExempt: data.is_exempt,
      };
    } catch (error) {
      console.error("Error checking employee limit:", error);
      return { canAdd: false, currentCount: 0, limit: 5, isExempt: false };
    }
  }, []);

  const canAddEmployee = useCallback(
    (currentCount: number) => currentCount < state.employeeLimit,
    [state.employeeLimit]
  );

  const isFeatureEnabled = useCallback(
    (feature: string) => {
      // Exempt users have all features
      if (state.isExempt) return true;
      if (!state.tier) return false;
      const tierConfig = SUBSCRIPTION_TIERS[state.tier];
      return tierConfig.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
    },
    [state.tier, state.isExempt]
  );

  // Check if user has ANY access (subscribed or exempt)
  const hasAccess = state.isSubscribed || state.isExempt;

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
    hasAccess,
    checkSubscription,
    checkEmployeeLimit,
    canAddEmployee,
    isFeatureEnabled,
    openCustomerPortal,
    tierConfig: state.tier ? SUBSCRIPTION_TIERS[state.tier] : null,
  };
}
