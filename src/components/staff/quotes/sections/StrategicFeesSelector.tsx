import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { StrategicFee } from "@/hooks/useEnterpriseQuotePricing";
import type { SelectedStrategicFee } from "@/hooks/useEnterpriseQuoteCalculation";

interface StrategicFeesSelectorProps {
  fees: StrategicFee[];
  selected: SelectedStrategicFee[];
  onToggle: (fee: StrategicFee) => void;
}

export function StrategicFeesSelector({
  fees,
  selected,
  onToggle,
}: StrategicFeesSelectorProps) {
  return (
    <div className="space-y-2">
      {fees.map((fee) => {
        const isSelected = selected.some((s) => s.key === fee.key);
        return (
          <label
            key={fee.key}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <Checkbox checked={isSelected} onCheckedChange={() => onToggle(fee)} />
            <Label className="flex-1 cursor-pointer font-medium text-foreground">
              {fee.name}
            </Label>
            <span className="text-xs font-semibold text-primary">
              ${fee.price.toLocaleString()}
              {fee.price_high ? `–$${fee.price_high.toLocaleString()}` : ""}
            </span>
          </label>
        );
      })}
    </div>
  );
}
