import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ComplexityControlsProps {
  complexityLevel: string;
  urgencyLevel: string;
  onComplexityChange: (v: string) => void;
  onUrgencyChange: (v: string) => void;
}

interface PillOption {
  value: string;
  label: string;
}

interface PillGroupProps {
  options: PillOption[];
  value: string;
  onChange: (v: string) => void;
}

function PillGroup({ options, value, onChange }: PillGroupProps) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-1">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-9 px-3 text-xs font-medium rounded-md border transition-colors",
              selected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ComplexityControls({
  complexityLevel,
  urgencyLevel,
  onComplexityChange,
  onUrgencyChange,
}: ComplexityControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Complexity</Label>
        <PillGroup
          value={complexityLevel}
          onChange={onComplexityChange}
          options={[
            { value: "low", label: "Low ×1.0" },
            { value: "medium", label: "Medium ×1.25" },
            { value: "high", label: "High ×1.5" },
          ]}
        />
      </div>
      <div>
        <Label>Urgency</Label>
        <PillGroup
          value={urgencyLevel}
          onChange={onUrgencyChange}
          options={[
            { value: "standard", label: "Standard ×1.0" },
            { value: "fast_track", label: "Fast-track ×1.2" },
            { value: "rush", label: "Rush ×1.4" },
          ]}
        />
      </div>
    </div>
  );
}
