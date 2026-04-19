import type { PricingTier } from "@/hooks/useEnterpriseQuotePricing";
import { cn } from "@/lib/utils";

interface TierSelectorProps {
  tiers: PricingTier[];
  selectedTier: PricingTier | null;
  onSelect: (tier: PricingTier) => void;
}

export function TierSelector({ tiers, selectedTier, onSelect }: TierSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {tiers.map((tier) => {
        const isSelected = selectedTier?.key === tier.key;
        return (
          <button
            type="button"
            key={tier.key}
            onClick={() => onSelect(tier)}
            className={cn(
              "p-4 rounded-lg border text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <p className="font-semibold text-foreground">{tier.name}</p>
            <p className="text-sm text-primary font-bold mt-1">
              ${tier.price_low.toLocaleString()} – ${tier.price_high.toLocaleString()}
            </p>
            {tier.description && (
              <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
