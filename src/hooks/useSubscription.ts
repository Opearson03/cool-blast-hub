import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/subscription-tiers";

const SUBSCRIPTION_CACHE_KEY = "pourhub_subscription_cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes (increased from 5 minutes)
const POLLING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (reduced from 60 seconds)

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
  const hasInitiallyChecked = useRef(false);
  
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

  // Direct database query for subscription status (cheap, fast)
  const checkSubscriptionFromDB = useCallback(async (showLoading = false) => {
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

      // Get user's profile to find business_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", session.user.id)
        .single();

      if (!profile?.business_id) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if business is exempt
      const { data: business } = await supabase
        .from("businesses")
        .select("subscription_exempt")
        .eq("id", profile.business_id)
        .single();

      const isExempt = business?.subscription_exempt ?? false;

      if (isExempt) {
        const exemptState = {
          isLoading: false,
          isSubscribed: true,
          tier: "standard" as SubscriptionTier,
          subscriptionEnd: null,
          employeeLimit: 999,
          error: null,
          isExempt: true,
        };
        setState(exemptState);
        setCachedSubscription({
          subscribed: true,
          tier: "standard",
          subscriptionEnd: null,
          employeeLimit: 999,
          isExempt: true,
        });
        return;
      }

      // Query subscription directly from database (webhook keeps this updated)
      const { data: subscription } = await supabase
        .from("business_subscriptions")
        .select("status, plan_tier, current_period_end, employee_limit")
        .eq("business_id", profile.business_id)
        .single();

      const isActive = subscription?.status === "active" || subscription?.status === "trialing";
      const tier = (subscription?.plan_tier as SubscriptionTier) || "free";
      
      const newState = {
        isLoading: false,
        isSubscribed: isActive,
        tier: isActive ? tier : "free",
        subscriptionEnd: subscription?.current_period_end || null,
        employeeLimit: subscription?.employee_limit || (isActive ? 999 : 5),
        error: null,
        isExempt: false,
      };
      
      setState(newState);
      
      // Cache the result
      setCachedSubscription({
        subscribed: isActive,
        tier: isActive ? tier : "free",
        subscriptionEnd: subscription?.current_period_end || null,
        employeeLimit: subscription?.employee_limit || (isActive ? 999 : 5),
        isExempt: false,
      });
    } catch (error) {
      console.error("Error checking subscription from DB:", error);
      // Don't clear access on error if we have cached data
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to check subscription",
      }));
    }
  }, []);

  // Edge function call - only used on login/initial load for full Stripe sync
  const syncSubscriptionWithStripe = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error syncing with Stripe:", error);
        return;
      }

      // If there was a token error, ignore
      if (data.token_error) {
        console.log("Token error from subscription sync, using cached data");
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
      console.error("Error syncing subscription with Stripe:", error);
    }
  }, []);

  // Legacy checkSubscription function for backwards compatibility
  const checkSubscription = useCallback(async (showLoading = false) => {
    await checkSubscriptionFromDB(showLoading);
  }, [checkSubscriptionFromDB]);

  useEffect(() => {
    // On initial load: check DB first (fast), then sync with Stripe once
    const initialize = async () => {
      await checkSubscriptionFromDB(false);
      
      // Only sync with Stripe once on initial load (not on every poll)
      if (!hasInitiallyChecked.current) {
        hasInitiallyChecked.current = true;
        // Delay Stripe sync slightly to not block initial render
        setTimeout(() => syncSubscriptionWithStripe(), 1000);
      }
    };
    
    initialize();

    // Handle visibility change - only check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSubscriptionFromDB(false);
      }
    };

    // Poll every 10 minutes (reduced from 60 seconds) - only when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkSubscriptionFromDB(false);
      }
    }, POLLING_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSubscriptionFromDB, syncSubscriptionWithStripe]);

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

  // Check if user has access - now includes free tier (all authenticated users have access)
  // Free tier users have tier = "free", subscribed = false
  // Standard tier users have tier = "standard", subscribed = true
  // Exempt users have isExempt = true
  const hasAccess = state.isSubscribed || state.isExempt || state.tier === "free";

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
