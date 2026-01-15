import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EstimateQuota {
  canCreate: boolean;
  used: number;
  limit: number | null;
  resetsAt: string | null;
  isLoading: boolean;
  tier: string | null;
}

const QUOTA_CACHE_KEY = "pourhub_estimate_quota";
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export function useEstimateQuota() {
  const [quota, setQuota] = useState<EstimateQuota>({
    canCreate: true,
    used: 0,
    limit: null,
    resetsAt: null,
    isLoading: true,
    tier: null,
  });

  const checkQuota = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setQuota(prev => ({ ...prev, isLoading: false }));
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
      };

      setQuota(newQuota);

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
      setQuota(prev => ({ ...prev, isLoading: false }));
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
          });
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
