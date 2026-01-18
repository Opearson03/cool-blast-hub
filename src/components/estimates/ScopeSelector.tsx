import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EstimateType } from "./EstimateTypeSelector";
import { Building, Layers, Car, Wrench, Landmark } from "lucide-react";

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
  | "pad_footings"
  | "osd_tank"
  | "kerbs_channels"
  | "concrete_stairs"
  | "retaining_walls"
  | "pit_bases"
  | "bollards";

export type ScopeCategory = 'foundations' | 'slabs' | 'external' | 'infrastructure' | 'structures';

export interface ScopeOption {
  id: ScopeType;
  label: string;
  description: string;
  availableFor: EstimateType[];
  category: ScopeCategory;
}

const CATEGORY_CONFIG: Record<ScopeCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  foundations: { label: "Foundations", icon: Building },
  slabs: { label: "Floor Slabs", icon: Layers },
  external: { label: "External Works", icon: Car },
  infrastructure: { label: "Infrastructure", icon: Wrench },
  structures: { label: "Structures", icon: Landmark },
};

export const SCOPE_OPTIONS: ScopeOption[] = [
  // Foundations
  { 
    id: "piers", 
    label: "Piers", 
    description: "Concrete piers / footings",
    availableFor: ["driveway", "house_slab", "commercial_slab"],
    category: "foundations"
  },
  { 
    id: "strip_footings", 
    label: "Strip Footings", 
    description: "Continuous strip footings for load-bearing walls",
    availableFor: ["house_slab", "commercial_slab"],
    category: "foundations"
  },
  { 
    id: "retaining_wall_footings", 
    label: "Retaining Wall Footings", 
    description: "Strip footings for retaining walls",
    availableFor: ["house_slab", "commercial_slab"],
    category: "foundations"
  },
  { 
    id: "pad_footings", 
    label: "Pad Footings", 
    description: "Isolated pad/spread footings for columns",
    availableFor: ["commercial_slab"],
    category: "foundations"
  },
  // Slabs
  { 
    id: "standard_slab", 
    label: "Standard Slab", 
    description: "Basic slab on ground (no edge beams)",
    availableFor: ["house_slab", "commercial_slab"],
    category: "slabs"
  },
  { 
    id: "raft_slab", 
    label: "Raft Slab", 
    description: "Full raft slab with edge and internal beams",
    availableFor: ["house_slab", "commercial_slab"],
    category: "slabs"
  },
  { 
    id: "waffle_pod", 
    label: "Waffle Pod Slab", 
    description: "Waffle pod system slab",
    availableFor: ["house_slab", "commercial_slab"],
    category: "slabs"
  },
  { 
    id: "suspended_slab", 
    label: "Suspended Slab", 
    description: "Elevated slab with formwork and propping",
    availableFor: ["commercial_slab"],
    category: "slabs"
  },
  // External Works
  { 
    id: "driveway", 
    label: "Small Slab", 
    description: "Driveways, sheds, patios",
    availableFor: ["driveway", "house_slab", "commercial_slab"],
    category: "external"
  },
  { 
    id: "paths_surrounds", 
    label: "Paths & Surrounds", 
    description: "Pathways, patios, and surrounds",
    availableFor: ["driveway", "house_slab", "commercial_slab"],
    category: "external"
  },
  { 
    id: "crossovers", 
    label: "Crossovers", 
    description: "Council crossover / vehicle crossing",
    availableFor: ["driveway", "house_slab", "commercial_slab"],
    category: "external"
  },
  // Infrastructure
  { 
    id: "osd_tank", 
    label: "OSD Tank / Stormwater", 
    description: "On-site detention tanks and stormwater pits",
    availableFor: ["commercial_slab"],
    category: "infrastructure"
  },
  { 
    id: "kerbs_channels", 
    label: "Kerbs & Channels", 
    description: "Concrete kerbing and drainage channels",
    availableFor: ["commercial_slab"],
    category: "infrastructure"
  },
  { 
    id: "pit_bases", 
    label: "Pit Bases", 
    description: "Pump pits, lift pits, sump bases",
    availableFor: ["commercial_slab"],
    category: "infrastructure"
  },
  { 
    id: "bollards", 
    label: "Bollards", 
    description: "Concrete bollards for car parks and barriers",
    availableFor: ["commercial_slab"],
    category: "infrastructure"
  },
  // Structures
  { 
    id: "concrete_stairs", 
    label: "Concrete Stairs", 
    description: "Cast-in-place concrete stairways",
    availableFor: ["commercial_slab"],
    category: "structures"
  },
  { 
    id: "retaining_walls", 
    label: "Retaining Walls", 
    description: "Full retaining wall construction",
    availableFor: ["commercial_slab"],
    category: "structures"
  },
  { 
    id: "architectural_concrete", 
    label: "Architectural Concrete", 
    description: "Bench tops, garden walls, tables, seats, planters",
    availableFor: ["house_slab"],
    category: "structures"
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

  // Group scopes by category
  const groupedScopes = availableScopes.reduce((acc, scope) => {
    if (!acc[scope.category]) {
      acc[scope.category] = [];
    }
    acc[scope.category].push(scope);
    return acc;
  }, {} as Record<ScopeCategory, ScopeOption[]>);

  // Get categories that have available scopes
  const availableCategories = (Object.keys(CATEGORY_CONFIG) as ScopeCategory[])
    .filter(cat => groupedScopes[cat]?.length > 0);

  const handleScopeToggle = (scopeId: ScopeType, checked: boolean) => {
    const newScopes = new Set(selectedScopes);
    if (checked) {
      newScopes.add(scopeId);
    } else {
      newScopes.delete(scopeId);
    }
    onScopesChange(newScopes);
  };

  const getSelectedCountForCategory = (category: ScopeCategory) => {
    return groupedScopes[category]?.filter(s => selectedScopes.has(s.id)).length || 0;
  };

  const handleSelectAllInCategory = (category: ScopeCategory) => {
    const newScopes = new Set(selectedScopes);
    const categoryScopes = groupedScopes[category] || [];
    const allSelected = categoryScopes.every(s => selectedScopes.has(s.id));
    
    categoryScopes.forEach(scope => {
      if (allSelected) {
        newScopes.delete(scope.id);
      } else {
        newScopes.add(scope.id);
      }
    });
    onScopesChange(newScopes);
  };

  // Determine which accordions should be open by default (those with selections)
  const defaultOpenCategories = availableCategories.filter(
    cat => getSelectedCountForCategory(cat) > 0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Scope of Works</CardTitle>
            <p className="text-sm text-muted-foreground">Select all applicable scopes</p>
          </div>
          {selectedScopes.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedScopes.size} selected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <TooltipProvider delayDuration={300}>
          <Accordion 
            type="multiple" 
            defaultValue={defaultOpenCategories.length > 0 ? defaultOpenCategories : [availableCategories[0]]}
            className="space-y-2"
          >
            {availableCategories.map((category) => {
              const config = CATEGORY_CONFIG[category];
              const Icon = config.icon;
              const scopes = groupedScopes[category];
              const selectedCount = getSelectedCountForCategory(category);
              const allSelected = scopes.every(s => selectedScopes.has(s.id));

              return (
                <AccordionItem 
                  key={category} 
                  value={category}
                  className="border rounded-lg px-3 data-[state=open]:bg-muted/30"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{config.label}</span>
                      {selectedCount > 0 && (
                        <Badge variant="default" className="ml-auto mr-2 text-xs h-5 px-1.5">
                          {selectedCount}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-1">
                      {/* Select All / Clear button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAllInCategory(category);
                        }}
                        className="text-xs text-primary hover:underline mb-2"
                      >
                        {allSelected ? "Clear all" : "Select all"}
                      </button>
                      
                      {/* Scope items as compact chips */}
                      <div className="flex flex-wrap gap-2">
                        {scopes.map((scope) => {
                          const isSelected = selectedScopes.has(scope.id);
                          return (
                            <Tooltip key={scope.id}>
                              <TooltipTrigger asChild>
                                <label
                                  className={`
                                    inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer
                                    transition-all text-sm
                                    ${isSelected 
                                      ? "border-primary bg-primary/10 text-primary font-medium" 
                                      : "border-border hover:border-muted-foreground/50 text-foreground"
                                    }
                                  `}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleScopeToggle(scope.id, checked === true)}
                                    className="h-3.5 w-3.5"
                                  />
                                  <span>{scope.label}</span>
                                </label>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[200px]">
                                <p className="text-xs">{scope.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
