import { PierGroup } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ChevronDown, ChevronRight, Settings2, Circle, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
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
  pierGroups: PierGroup[];
  onChange: (pierGroups: PierGroup[]) => void;
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
  pierGroups,
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = pierGroups.every(g => openGroups.has(g.id));
    if (allOpen) {
      setOpenGroups(new Set());
    } else {
      setOpenGroups(new Set(pierGroups.map(g => g.id)));
    }
  };

  const updateGroup = (groupIndex: number, updates: Partial<PierGroup>) => {
    const newGroups = [...pierGroups];
    newGroups[groupIndex] = { ...newGroups[groupIndex], ...updates };
    onChange(newGroups);
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalPiers = 0;
    let withStartersCount = 0;
    let withCagesCount = 0;
    let customCount = 0;

    pierGroups.forEach(group => {
      const pierCount = group.quantity || 1;
      totalPiers += pierCount;
      
      const hasStarters = group.has_starters ?? defaultHasStarters;
      const isReinforced = group.is_reinforced ?? defaultIsReinforced;
      
      if (hasStarters) withStartersCount += pierCount;
      if (isReinforced) withCagesCount += pierCount;
      
      if (group.has_starters !== undefined || group.is_reinforced !== undefined || 
          group.starter_count !== undefined || group.vertical_bars_count !== undefined) {
        customCount++;
      }
    });

    return { totalPiers, withStartersCount, withCagesCount, customCount, totalGroups: pierGroups.length };
  }, [pierGroups, defaultHasStarters, defaultIsReinforced]);

  if (pierGroups.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
        <Circle className="h-5 w-5 opacity-50" />
        <span>No {label.toLowerCase()} defined. Add pier groups in the scope configuration above.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Circle className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.totalPiers}</span>
            <span>pier{summary.totalPiers !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalGroups} group{summary.totalGroups !== 1 ? 's' : ''})</span>
          </div>
          {summary.withStartersCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withStartersCount} with starters</span>
            </>
          )}
          {summary.withCagesCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withCagesCount} with cages</span>
            </>
          )}
          {summary.customCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="text-primary">{summary.customCount} customized</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {pierGroups.every(g => openGroups.has(g.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Pier Group Cards */}
      <div className="space-y-2">
        {pierGroups.map((group, groupIndex) => {
          const isOpen = openGroups.has(group.id);
          const pierCount = group.quantity || 1;
          
          // Get effective values (group override or defaults)
          const hasStarters = group.has_starters ?? defaultHasStarters;
          const starterCount = group.starter_count ?? defaultStarterCount;
          const starterSize = group.starter_size || defaultStarterSize;
          const starterLength = group.starter_length ?? defaultStarterLength;
          const isReinforced = group.is_reinforced ?? defaultIsReinforced;
          const verticalBarsCount = group.vertical_bars_count ?? defaultVerticalBarsCount;
          const verticalBarSize = group.vertical_bar_size || defaultVerticalBarSize;
          const ligSize = group.lig_size || defaultLigSize;
          const ligCentres = group.lig_centres ?? defaultLigCentres;
          
          const hasCustomSettings = 
            group.has_starters !== undefined || 
            group.starter_count !== undefined ||
            group.starter_size !== undefined ||
            group.is_reinforced !== undefined ||
            group.vertical_bars_count !== undefined ||
            group.lig_size !== undefined;

          return (
            <Collapsible key={group.id} open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                hasCustomSettings ? "border-primary/30 bg-primary/[0.02]" : "bg-card"
              )}>
                {/* Group Header */}
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{group.name}</span>
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {pierCount} pier{pierCount !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ⌀{group.diameter}mm × {group.depth}mm
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasStarters && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                          Starters
                        </span>
                      )}
                      {isReinforced && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-accent text-accent-foreground">
                          Cage
                        </span>
                      )}
                      {hasCustomSettings && (
                        <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
                          Custom
                        </span>
                      )}
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Group Content */}
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-4">
                    {/* Starter Bars Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Starter Bars</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={hasStarters}
                            onCheckedChange={(val) => updateGroup(groupIndex, { has_starters: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            hasStarters ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {hasStarters ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      
                      {hasStarters && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Per Pier</Label>
                            <Input
                              type="number"
                              value={starterCount}
                              onChange={(e) => updateGroup(groupIndex, { starter_count: Number(e.target.value) })}
                              className="h-8 text-sm"
                              min={1}
                              max={20}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Size</Label>
                            <Select
                              value={starterSize}
                              onValueChange={(val) => updateGroup(groupIndex, { starter_size: val })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
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
                                onChange={(e) => updateGroup(groupIndex, { starter_length: Number(e.target.value) })}
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
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Cage Reinforcement</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={isReinforced}
                            onCheckedChange={(val) => updateGroup(groupIndex, { is_reinforced: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            isReinforced ? "text-foreground" : "text-muted-foreground"
                          )}>
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
                              onChange={(e) => updateGroup(groupIndex, { vertical_bars_count: Number(e.target.value) })}
                              className="h-8 text-sm"
                              min={3}
                              max={20}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                            <Select
                              value={verticalBarSize}
                              onValueChange={(val) => updateGroup(groupIndex, { vertical_bar_size: val })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
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
                              onValueChange={(val) => updateGroup(groupIndex, { lig_size: val })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
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
                                onChange={(e) => updateGroup(groupIndex, { lig_centres: Number(e.target.value) })}
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
                    
                    {/* Summary for this group */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Settings apply to all {pierCount} pier{pierCount !== 1 ? 's' : ''} in this group
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
