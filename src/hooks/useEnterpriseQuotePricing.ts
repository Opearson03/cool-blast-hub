import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PricingTier {
  key: string;
  name: string;
  price_low: number;
  price_high: number;
  description?: string;
}

export interface PricingModule {
  key: string;
  name: string;
  price: number;
  description?: string;
}

export interface PricingIntegration {
  key: string;
  name: string;
  price_simple: number;
  price_moderate: number;
  price_advanced: number;
}

export interface SupportPlan {
  key: string;
  name: string;
  price: number;
  description?: string;
}

export interface StrategicFee {
  key: string;
  name: string;
  price: number;
  price_high?: number;
}

export interface EnterprisePricingConfig {
  id: string;
  tiers: PricingTier[];
  modules: PricingModule[];
  integrations: PricingIntegration[];
  support_plans: SupportPlan[];
  strategic_fees: StrategicFee[];
  complexity_multipliers: Record<string, number>;
  urgency_multipliers: Record<string, number>;
  default_assumptions: string;
}

export function useEnterpriseQuotePricing() {
  return useQuery({
    queryKey: ["enterprise-quote-pricing-config"],
    queryFn: async (): Promise<EnterprisePricingConfig> => {
      const { data, error } = await supabase
        .from("enterprise_quote_pricing_config")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        tiers: (data.tiers as unknown as PricingTier[]) ?? [],
        modules: (data.modules as unknown as PricingModule[]) ?? [],
        integrations: (data.integrations as unknown as PricingIntegration[]) ?? [],
        support_plans: (data.support_plans as unknown as SupportPlan[]) ?? [],
        strategic_fees: (data.strategic_fees as unknown as StrategicFee[]) ?? [],
        complexity_multipliers:
          (data.complexity_multipliers as unknown as Record<string, number>) ?? {},
        urgency_multipliers:
          (data.urgency_multipliers as unknown as Record<string, number>) ?? {},
        default_assumptions: data.default_assumptions || "",
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
