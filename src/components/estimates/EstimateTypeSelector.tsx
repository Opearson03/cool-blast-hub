import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Home, Building2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type EstimateType = "driveway" | "house_slab" | "commercial_slab";

interface EstimateTypeSelectorProps {
  selectedType: EstimateType | null;
  onSelect: (type: EstimateType) => void;
  onContinue: () => void;
  onBack?: () => void;
}

const ESTIMATE_TYPES = [
  {
    id: "driveway" as EstimateType,
    title: "Driveway",
    description: "Residential driveways, paths, and small pads",
    features: [
      "Single rectangular or circular area",
      "Standard mesh reinforcement",
      "Common finishes (exposed, broom, burnished)",
      "Basic treatments (sealing, curing)",
    ],
    icon: Car,
    color: "from-blue-500/20 to-blue-600/20",
    borderColor: "border-blue-500",
    iconColor: "text-blue-500",
  },
  {
    id: "house_slab" as EstimateType,
    title: "House Slab",
    description: "Residential foundations with multiple sections",
    features: [
      "Multiple slab sections with different dimensions",
      "Edge beams and rebates",
      "Vapour barrier calculations",
      "Boxing and formwork (linear meters)",
      "Concrete pump options",
    ],
    icon: Home,
    color: "from-green-500/20 to-green-600/20",
    borderColor: "border-green-500",
    iconColor: "text-green-500",
    badge: "Coming Soon",
  },
  {
    id: "commercial_slab" as EstimateType,
    title: "Commercial Slab",
    description: "Industrial and commercial foundations",
    features: [
      "Complex slab sections with varying thicknesses",
      "Strip footings and pier holes",
      "Ground beams and thickenings",
      "Detailed rebar schedule (N12, N16, N20, etc.)",
      "Cast-in items and expansion joints",
    ],
    icon: Building2,
    color: "from-orange-500/20 to-orange-600/20",
    borderColor: "border-orange-500",
    iconColor: "text-orange-500",
    badge: "Coming Soon",
  },
];

export function EstimateTypeSelector({
  selectedType,
  onSelect,
  onContinue,
  onBack,
}: EstimateTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">What type of estimate?</h3>
        <p className="text-sm text-muted-foreground">
          Select the type of concrete work to get the right calculator
        </p>
      </div>

      <div className="grid gap-4">
        {ESTIMATE_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const isDisabled = !!type.badge;

          return (
            <Card
              key={type.id}
              className={cn(
                "relative cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected && `border-2 ${type.borderColor} bg-gradient-to-r ${type.color}`,
                !isSelected && "hover:border-muted-foreground/30",
                isDisabled && "opacity-60 cursor-not-allowed"
              )}
              onClick={() => !isDisabled && onSelect(type.id)}
            >
              {type.badge && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                    {type.badge}
                  </span>
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                      isSelected
                        ? `bg-gradient-to-br ${type.color}`
                        : "bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-6 h-6",
                        isSelected ? type.iconColor : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{type.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {type.description}
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {type.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          {feature}
                        </li>
                      ))}
                      {type.features.length > 3 && (
                        <li className="text-muted-foreground/70">
                          +{type.features.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        ) : (
          <div />
        )}
        <Button
          type="button"
          onClick={onContinue}
          disabled={!selectedType}
          className="gap-2"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
