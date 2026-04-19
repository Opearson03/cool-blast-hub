import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PricingIntegration } from "@/hooks/useEnterpriseQuotePricing";
import type { SelectedIntegration } from "@/hooks/useEnterpriseQuoteCalculation";

interface IntegrationSelectorProps {
  integrations: PricingIntegration[];
  selected: SelectedIntegration[];
  onToggle: (key: string) => void;
  onComplexityChange: (key: string, complexity: "simple" | "moderate" | "advanced") => void;
}

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
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(integ.key)}
            />
            <Label className="flex-1 cursor-pointer font-medium text-foreground">
              {integ.name}
            </Label>
            {isSelected && (
              <Select
                value={complexity}
                onValueChange={(v) =>
                  onComplexityChange(integ.key, v as "simple" | "moderate" | "advanced")
                }
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">
                    Simple (${integ.price_simple.toLocaleString()})
                  </SelectItem>
                  <SelectItem value="moderate">
                    Moderate (${integ.price_moderate.toLocaleString()})
                  </SelectItem>
                  <SelectItem value="advanced">
                    Advanced (${integ.price_advanced.toLocaleString()})
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            <span className="text-xs font-semibold text-primary whitespace-nowrap w-20 text-right">
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
