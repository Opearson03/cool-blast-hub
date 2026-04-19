import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { PricingModule } from "@/hooks/useEnterpriseQuotePricing";

interface ModuleSelectorProps {
  modules: PricingModule[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
}

export function ModuleSelector({ modules, selectedKeys, onToggle }: ModuleSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {modules.map((mod) => {
        const isSelected = selectedKeys.includes(mod.key);
        return (
          <label
            key={mod.key}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(mod.key)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <Label className="cursor-pointer font-medium text-foreground">
                  {mod.name}
                </Label>
                <span className="text-xs font-semibold text-primary whitespace-nowrap">
                  +${mod.price.toLocaleString()}
                </span>
              </div>
              {mod.description && (
                <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
