import type { SupportPlan } from "@/hooks/useEnterpriseQuotePricing";
import { cn } from "@/lib/utils";

interface SupportPlanSelectorProps {
  plans: SupportPlan[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

export function SupportPlanSelector({
  plans,
  selectedKey,
  onSelect,
}: SupportPlanSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {plans.map((plan) => {
        const isSelected = selectedKey === plan.key;
        return (
          <button
            type="button"
            key={plan.key}
            onClick={() => onSelect(isSelected ? null : plan.key)}
            className={cn(
              "p-4 rounded-lg border text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <p className="font-semibold text-foreground">{plan.name}</p>
            <p className="text-sm text-primary font-bold mt-1">
              ${plan.price.toLocaleString()}/mo
            </p>
            {plan.description && (
              <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
