import { PierConfig } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Settings2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const BAR_SIZE_OPTIONS = [
  { value: 'N12', label: 'N12' },
  { value: 'N16', label: 'N16' },
  { value: 'N20', label: 'N20' },
  { value: 'N24', label: 'N24' },
  { value: 'N28', label: 'N28' },
];

const LIG_SIZE_OPTIONS = [
  { value: 'R10', label: 'R10' },
  { value: 'R12', label: 'R12' },
];

interface PierReinforcementInputProps {
  piers: PierConfig[];
  onChange: (piers: PierConfig[]) => void;
  defaultHasStarters: boolean;
  defaultStarterCount: number;
  defaultStarterSize: string;
  defaultStarterLength: number;
  defaultIsReinforced: boolean;
  defaultVerticalBarsCount: number;
  defaultVerticalBarSize: string;
  defaultLigSize: string;
  defaultLigCentres: number;
  label: string;
}

export function PierReinforcementInput({
  piers,
  onChange,
  defaultHasStarters,
  defaultStarterCount,
  defaultStarterSize,
  defaultStarterLength,
  defaultIsReinforced,
  defaultVerticalBarsCount,
  defaultVerticalBarSize,
  defaultLigSize,
  defaultLigCentres,
  label,
}: PierReinforcementInputProps) {
  const [openPiers, setOpenPiers] = useState<Record<string, boolean>>({});

  const updatePier = (index: number, updates: Partial<PierConfig>) => {
    const newPiers = [...piers];
    newPiers[index] = { ...newPiers[index], ...updates };
    onChange(newPiers);
  };

  const togglePier = (pierId: string) => {
    setOpenPiers(prev => ({ ...prev, [pierId]: !prev[pierId] }));
  };

  if (piers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic py-2">
        No {label.toLowerCase()} defined. Add piers in the scope configuration above.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {piers.map((pier, index) => {
        const isOpen = openPiers[pier.id] || false;
        const hasStarters = pier.has_starters ?? defaultHasStarters;
        const starterCount = pier.starter_count ?? defaultStarterCount;
        const starterSize = pier.starter_size || defaultStarterSize;
        const starterLength = pier.starter_length ?? defaultStarterLength;
        const isReinforced = pier.is_reinforced ?? defaultIsReinforced;
        const verticalBarsCount = pier.vertical_bars_count ?? defaultVerticalBarsCount;
        const verticalBarSize = pier.vertical_bar_size || defaultVerticalBarSize;
        const ligSize = pier.lig_size || defaultLigSize;
        const ligCentres = pier.lig_centres ?? defaultLigCentres;
        
        const hasCustomSettings = 
          pier.has_starters !== undefined || 
          pier.starter_count !== undefined ||
          pier.starter_size !== undefined ||
          pier.is_reinforced !== undefined ||
          pier.vertical_bars_count !== undefined ||
          pier.lig_size !== undefined;

        return (
          <Collapsible key={pier.id} open={isOpen} onOpenChange={() => togglePier(pier.id)}>
            <div className="border rounded-lg overflow-hidden bg-card">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{pier.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {pier.quantity}× ⌀{pier.diameter}mm × {pier.depth}mm
                    </span>
                    {hasCustomSettings && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )} />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-3 pb-3 pt-1 border-t bg-muted/30 space-y-4">
                  {/* Starter Bars Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Starter Bars</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={hasStarters}
                          onCheckedChange={(val) => updatePier(index, { has_starters: val })}
                        />
                        <span className="text-xs text-muted-foreground w-6">
                          {hasStarters ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    {hasStarters && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Count</Label>
                          <Input
                            type="number"
                            value={starterCount}
                            onChange={(e) => updatePier(index, { starter_count: Number(e.target.value) })}
                            className="h-8 text-sm"
                            min={1}
                            max={20}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Size</Label>
                          <Select
                            value={starterSize}
                            onValueChange={(val) => updatePier(index, { starter_size: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BAR_SIZE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Length</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={starterLength}
                              onChange={(e) => updatePier(index, { starter_length: Number(e.target.value) })}
                              className="h-8 text-sm pr-8"
                              min={300}
                              max={3000}
                              step={100}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cage Reinforcement Section */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Cage Reinforcement</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isReinforced}
                          onCheckedChange={(val) => updatePier(index, { is_reinforced: val })}
                        />
                        <span className="text-xs text-muted-foreground w-6">
                          {isReinforced ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    {isReinforced && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Vertical Bars</Label>
                          <Input
                            type="number"
                            value={verticalBarsCount}
                            onChange={(e) => updatePier(index, { vertical_bars_count: Number(e.target.value) })}
                            className="h-8 text-sm"
                            min={3}
                            max={20}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                          <Select
                            value={verticalBarSize}
                            onValueChange={(val) => updatePier(index, { vertical_bar_size: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BAR_SIZE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Lig Size</Label>
                          <Select
                            value={ligSize}
                            onValueChange={(val) => updatePier(index, { lig_size: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LIG_SIZE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Lig Centres</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={ligCentres}
                              onChange={(e) => updatePier(index, { lig_centres: Number(e.target.value) })}
                              className="h-8 text-sm pr-8"
                              min={100}
                              max={600}
                              step={50}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                              mm
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
