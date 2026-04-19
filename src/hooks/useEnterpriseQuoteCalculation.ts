import { useMemo } from "react";
import type { PricingTier, PricingIntegration } from "./useEnterpriseQuotePricing";

export interface SelectedIntegration {
  key: string;
  complexity: "simple" | "moderate" | "advanced";
}

export interface SelectedStrategicFee {
  key: string;
  price: number;
}

export interface EnterpriseQuoteSelections {
  selectedTier: PricingTier | null;
  selectedModuleKeys: string[];
  selectedIntegrations: SelectedIntegration[];
  complexityLevel: string;
  urgencyLevel: string;
  selectedStrategicFees: SelectedStrategicFee[];
  selectedSupportKey: string | null;
}

export interface EnterpriseQuoteCalculation {
  baseSubtotalLow: number;
  baseSubtotalHigh: number;
  modulesTotal: number;
  integrationsTotal: number;
  strategicFeesTotal: number;
  complexityMultiplier: number;
  urgencyMultiplier: number;
  buildSubtotalLow: number;
  buildSubtotalHigh: number;
  estimateLow: number;
  estimateHigh: number;
  recommendedQuote: number;
  monthlySupport: number;
}

export function useEnterpriseQuoteCalculation(
  selections: EnterpriseQuoteSelections,
  modules: { key: string; price: number }[],
  integrations: PricingIntegration[],
  supportPlans: { key: string; price: number }[],
  complexityMultipliers: Record<string, number>,
  urgencyMultipliers: Record<string, number>,
): EnterpriseQuoteCalculation {
  return useMemo(() => {
    const baseSubtotalLow = selections.selectedTier?.price_low ?? 0;
    const baseSubtotalHigh = selections.selectedTier?.price_high ?? 0;

    const modulesTotal = selections.selectedModuleKeys.reduce((sum, key) => {
      const mod = modules.find((m) => m.key === key);
      return sum + (mod?.price ?? 0);
    }, 0);

    const integrationsTotal = selections.selectedIntegrations.reduce((sum, sel) => {
      const integ = integrations.find((i) => i.key === sel.key);
      if (!integ) return sum;
      const priceKey = `price_${sel.complexity}` as keyof PricingIntegration;
      return sum + (Number(integ[priceKey]) || 0);
    }, 0);

    const strategicFeesTotal = selections.selectedStrategicFees.reduce(
      (sum, f) => sum + (f.price ?? 0),
      0,
    );

    const complexityMultiplier = complexityMultipliers[selections.complexityLevel] ?? 1.0;
    const urgencyMultiplier = urgencyMultipliers[selections.urgencyLevel] ?? 1.0;
    const multiplied = complexityMultiplier * urgencyMultiplier;

    const buildSubtotalLow = (baseSubtotalLow + modulesTotal + integrationsTotal) * multiplied;
    const buildSubtotalHigh = (baseSubtotalHigh + modulesTotal + integrationsTotal) * multiplied;

    const estimateLow = Math.round(buildSubtotalLow * 0.9);
    const estimateHigh = Math.round(buildSubtotalHigh * 1.15);
    const recommendedQuote = Math.round(
      (buildSubtotalLow + buildSubtotalHigh) / 2 + strategicFeesTotal,
    );

    const supportPlan = supportPlans.find((s) => s.key === selections.selectedSupportKey);
    const monthlySupport = supportPlan?.price ?? 0;

    return {
      baseSubtotalLow,
      baseSubtotalHigh,
      modulesTotal,
      integrationsTotal,
      strategicFeesTotal,
      complexityMultiplier,
      urgencyMultiplier,
      buildSubtotalLow,
      buildSubtotalHigh,
      estimateLow,
      estimateHigh,
      recommendedQuote,
      monthlySupport,
    };
  }, [selections, modules, integrations, supportPlans, complexityMultipliers, urgencyMultipliers]);
}
