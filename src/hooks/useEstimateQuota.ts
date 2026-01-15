import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EstimateQuota {
  canCreate: boolean;
  used: number;
  limit: number | null;
  resetsAt: string | null;
  isLoading: boolean;
  tier: string | null;
  error: boolean; // Track if there was an error checking quota
}

const QUOTA_CACHE_KEY = "pourhub_estimate_quota";
const CACHE_TTL_MS = 60 * 1000; // 1 minute
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Helper to delay with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useEstimateQuota() {
  const [quota, setQuota] = useState<EstimateQuota>({
    canCreate: false, // Default to false for security - don't allow until confirmed
    used: 0,
    limit: null,
    resetsAt: null,
    isLoading: true,
    tier: null,
    error: false,
  });
  
  const retryCountRef = useRef(0);

  const checkQuota = useCallback(async (retry = 0): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setQuota(prev => ({ ...prev, isLoading: false, canCreate: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-estimate-quota", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const newQuota: EstimateQuota = {
        canCreate: data.can_create,
        used: data.used || 0,
        limit: data.limit,
        resetsAt: data.resets_at,
        isLoading: false,
        tier: data.tier,
        error: false,
      };

      setQuota(newQuota);
      retryCountRef.current = 0; // Reset retry count on success

      // Cache the result
      try {
        localStorage.setItem(QUOTA_CACHE_KEY, JSON.stringify({
          ...newQuota,
          cachedAt: Date.now(),
        }));
      } catch {
        // Ignore storage errors
      }
    } catch (error) {
      console.error("Error checking estimate quota:", error);
      
      // Retry with exponential backoff
      if (retry < MAX_RETRIES) {
        const backoffMs = RETRY_DELAY_MS * Math.pow(2, retry);
        console.log(`Retrying quota check in ${backoffMs}ms (attempt ${retry + 1}/${MAX_RETRIES})`);
        await delay(backoffMs);
        return checkQuota(retry + 1);
      }
      
      // All retries exhausted - set error state and deny creation for security
      console.error("All quota check retries exhausted, denying creation for security");
      setQuota(prev => ({ 
        ...prev, 
        isLoading: false, 
        canCreate: false, // SECURITY: Don't allow creation if we can't verify quota
        error: true,
      }));
    }
  }, []);

  useEffect(() => {
    // Try to load from cache first
    try {
      const cached = localStorage.getItem(QUOTA_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.cachedAt < CACHE_TTL_MS) {
          setQuota({
            canCreate: data.canCreate,
            used: data.used,
            limit: data.limit,
            resetsAt: data.resetsAt,
            isLoading: false,
            tier: data.tier,
            error: false,
          });
          // Still refresh in background but don't wait for it
          checkQuota();
          return;
        }
      }
    } catch {
      // Ignore cache errors
    }

    checkQuota();
  }, [checkQuota]);

  return {
    ...quota,
    refresh: checkQuota,
  };
}
