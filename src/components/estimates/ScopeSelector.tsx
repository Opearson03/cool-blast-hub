import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstimateType } from "./EstimateTypeSelector";

export type ScopeType = 
  | "piers"
  | "retaining_wall_footings"
  | "strip_footings"
  | "standard_slab"
  | "raft_slab"
  | "waffle_pod"
  | "suspended_slab"
  | "driveway"
  | "paths_surrounds"
  | "crossovers"
  | "architectural_concrete"
  // Commercial-specific scopes
  | "pad_footings"
  | "osd_tank"
  | "kerbs_channels"
  | "concrete_stairs"
  | "retaining_walls"
  | "pit_bases"
  | "bollards";

export interface ScopeOption {
  id: ScopeType;
  label: string;
  description: string;
  availableFor: EstimateType[];
}

export const SCOPE_OPTIONS: ScopeOption[] = [
  { 
    id: "piers", 
    label: "Piers", 
    description: "Concrete piers / footings",
    availableFor: ["driveway", "house_slab", "commercial_slab"]
  },
  { 
    id: "retaining_wall_footings", 
    label: "Retaining Wall Footings", 
    description: "Strip footings for retaining walls",
    availableFor: ["house_slab", "commercial_slab"]
  },
  { 
    id: "strip_footings", 
    label: "Strip Footings", 
    description: "Continuous strip footings for load-bearing walls",
    availableFor: ["house_slab", "commercial_slab"]
  },
  { 
    id: "standard_slab", 
    label: "Standard Slab", 
    description: "Basic slab on ground (no edge beams)",
    availableFor: ["house_slab", "commercial_slab"]
  },
  { 
    id: "raft_slab", 
    label: "Raft Slab", 
    description: "Full raft slab with edge and internal beams",
    availableFor: ["house_slab", "commercial_slab"]
  },
  { 
    id: "waffle_pod", 
    label: "Waffle Pod Slab", 
    description: "Waffle pod system slab",
    availableFor: ["house_slab", "commercial_slab"]
  },
  { 
    id: "suspended_slab", 
    label: "Suspended Slab", 
    description: "Elevated slab with formwork and propping",
    availableFor: ["commercial_slab"]
  },
  { 
    id: "driveway", 
    label: "Driveway", 
    description: "Vehicle driveways",
    availableFor: ["driveway", "house_slab", "commercial_slab"]
  },
  { 
    id: "paths_surrounds", 
    label: "Paths & Surrounds", 
    description: "Pathways, patios, and surrounds",
    availableFor: ["driveway", "house_slab", "commercial_slab"]
  },
  { 
    id: "crossovers", 
    label: "Crossovers", 
    description: "Council crossover / vehicle crossing",
    availableFor: ["driveway", "house_slab", "commercial_slab"]
  },
  { 
    id: "architectural_concrete", 
    label: "Architectural Concrete", 
    description: "Bench tops, garden walls, tables, seats, planters",
    availableFor: ["house_slab"]
  },
  // Commercial-specific scopes
  { 
    id: "pad_footings", 
    label: "Pad Footings", 
    description: "Isolated pad/spread footings for columns",
    availableFor: ["commercial_slab"]
  },
  { 
    id: "osd_tank", 
    label: "OSD Tank / Stormwater", 
    description: "On-site detention tanks and stormwater pits",
    availableFor: ["commercial_slab"]
  },
  { 
    id: "kerbs_channels", 
    label: "Kerbs & Channels", 
    description: "Concrete kerbing and drainage channels",
    availableFor: ["commercial_slab"]
  },
  { 
    id: "concrete_stairs", 
    label: "Concrete Stairs", 
    description: "Cast-in-place concrete stairways",
    availableFor: ["commercial_slab"]
  },
  { 
    id: "retaining_walls", 
    label: "Retaining Walls", 
    description: "Full retaining wall construction",
    availableFor: ["commercial_slab"]
  },
  { 
    id: "pit_bases", 
    label: "Pit Bases", 
    description: "Pump pits, lift pits, sump bases",
    availableFor: ["commercial_slab"]
  },
  { 
    id: "bollards", 
    label: "Bollards", 
    description: "Concrete bollards for car parks and barriers",
    availableFor: ["commercial_slab"]
  },
];

interface ScopeSelectorProps {
  selectedScopes: Set<ScopeType>;
  onScopesChange: (scopes: Set<ScopeType>) => void;
  estimateType: EstimateType | null;
}

export function ScopeSelector({ selectedScopes, onScopesChange, estimateType }: ScopeSelectorProps) {
  const availableScopes = SCOPE_OPTIONS.filter(scope => 
    estimateType ? scope.availableFor.includes(estimateType) : true
  );

  const handleScopeToggle = (scopeId: ScopeType, checked: boolean) => {
    const newScopes = new Set(selectedScopes);
    if (checked) {
      newScopes.add(scopeId);
    } else {
      newScopes.delete(scopeId);
    }
    onScopesChange(newScopes);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Scope of Works</CardTitle>
        <p className="text-sm text-muted-foreground">Select all applicable scopes for this estimate</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableScopes.map((scope) => (
            <label
              key={scope.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedScopes.has(scope.id) 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <Checkbox
                checked={selectedScopes.has(scope.id)}
                onCheckedChange={(checked) => handleScopeToggle(scope.id, checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <span className="font-medium text-sm">{scope.label}</span>
                <p className="text-xs text-muted-foreground">{scope.description}</p>
              </div>
            </label>
          ))}
        </div>
        {selectedScopes.size > 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            {selectedScopes.size} scope{selectedScopes.size !== 1 ? "s" : ""} selected
          </p>
        )}
      </CardContent>
    </Card>
  );
}
