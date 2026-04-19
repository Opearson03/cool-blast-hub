import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PricingIntegration } from "@/hooks/useEnterpriseQuotePricing";
import type { SelectedIntegration } from "@/hooks/useEnterpriseQuoteCalculation";

interface IntegrationSelectorProps {
  integrations: PricingIntegration[];
  selected: SelectedIntegration[];
  onToggle: (key: string) => void;
  onComplexityChange: (key: string, complexity: "simple" | "moderate" | "advanced") => void;
}

const COMPLEXITY_OPTIONS: Array<{ value: "simple" | "moderate" | "advanced"; label: string }> = [
  { value: "simple", label: "Simple" },
  { value: "moderate", label: "Moderate" },
  { value: "advanced", label: "Advanced" },
];

export function IntegrationSelector({
  integrations,
  selected,
  onToggle,
  onComplexityChange,
}: IntegrationSelectorProps) {
  const getSelected = (key: string) => selected.find((s) => s.key === key);
  const getPrice = (integ: PricingIntegration, complexity: string) => {
    const k = `price_${complexity}` as keyof PricingIntegration;
    return Number(integ[k]) || 0;
  };

  return (
    <div className="space-y-2">
      {integrations.map((integ) => {
        const sel = getSelected(integ.key);
        const isSelected = !!sel;
        const complexity = sel?.complexity || "simple";

        return (
          <div
            key={integ.key}
            className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(integ.key)}
            />
            <Label
              className="flex-1 min-w-[140px] cursor-pointer font-medium text-foreground"
              onClick={() => onToggle(integ.key)}
            >
              {integ.name}
            </Label>
            {isSelected && (
              <div className="flex gap-1 order-3 sm:order-2 w-full sm:w-auto">
                {COMPLEXITY_OPTIONS.map((opt) => {
                  const isActive = complexity === opt.value;
                  const price = getPrice(integ, opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onComplexityChange(integ.key, opt.value)}
                      className={cn(
                        "h-9 px-3 text-xs font-medium rounded-md border transition-colors flex-1 sm:flex-none whitespace-nowrap",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-foreground hover:bg-muted",
                      )}
                      title={`$${price.toLocaleString()}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
            <span className="text-xs font-semibold text-primary whitespace-nowrap w-20 text-right order-2 sm:order-3 ml-auto">
              {isSelected
                ? `$${getPrice(integ, complexity).toLocaleString()}`
                : `from $${integ.price_simple.toLocaleString()}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
