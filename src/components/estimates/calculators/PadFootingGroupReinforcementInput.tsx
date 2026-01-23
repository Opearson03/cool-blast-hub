import { PadFootingGroup } from "@/lib/estimate-components/types";
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
import { ChevronDown, ChevronRight, Settings2, Square, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const BAR_SIZE_OPTIONS = [
  { value: 'N12', label: 'N12' },
  { value: 'N16', label: 'N16' },
  { value: 'N20', label: 'N20' },
  { value: 'N24', label: 'N24' },
  { value: 'N28', label: 'N28' },
  { value: 'N32', label: 'N32' },
];

interface PadFootingGroupReinforcementInputProps {
  padGroups: PadFootingGroup[];
  onChange: (padGroups: PadFootingGroup[]) => void;
  defaultHasBottomReo: boolean;
  defaultBottomASize: string;
  defaultBottomACentres: number;
  defaultBottomBSize: string;
  defaultBottomBCentres: number;
  defaultHasTopReo: boolean;
  defaultTopASize: string;
  defaultTopACentres: number;
  defaultTopBSize: string;
  defaultTopBCentres: number;
  label: string;
}

export function PadFootingGroupReinforcementInput({
  padGroups,
  onChange,
  defaultHasBottomReo,
  defaultBottomASize,
  defaultBottomACentres,
  defaultBottomBSize,
  defaultBottomBCentres,
  defaultHasTopReo,
  defaultTopASize,
  defaultTopACentres,
  defaultTopBSize,
  defaultTopBCentres,
  label,
}: PadFootingGroupReinforcementInputProps) {
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
    const allOpen = padGroups.every(g => openGroups.has(g.id));
    if (allOpen) {
      setOpenGroups(new Set());
    } else {
      setOpenGroups(new Set(padGroups.map(g => g.id)));
    }
  };

  const updateGroup = (groupIndex: number, updates: Partial<PadFootingGroup>) => {
    const newGroups = [...padGroups];
    newGroups[groupIndex] = { ...newGroups[groupIndex], ...updates };
    onChange(newGroups);
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalPads = 0;
    let withBottomReoCount = 0;
    let withTopReoCount = 0;
    let customCount = 0;

    padGroups.forEach(group => {
      const padCount = group.quantity || 1;
      totalPads += padCount;
      
      const hasBottomReo = group.has_bottom_reo ?? defaultHasBottomReo;
      const hasTopReo = group.has_top_reo ?? defaultHasTopReo;
      
      if (hasBottomReo) withBottomReoCount += padCount;
      if (hasTopReo) withTopReoCount += padCount;
      
      if (group.has_bottom_reo !== undefined || group.bottom_a_size !== undefined ||
          group.has_top_reo !== undefined || group.top_a_size !== undefined) {
        customCount++;
      }
    });

    return { totalPads, withBottomReoCount, withTopReoCount, customCount, totalGroups: padGroups.length };
  }, [padGroups, defaultHasBottomReo, defaultHasTopReo]);

  if (padGroups.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
        <Square className="h-5 w-5 opacity-50" />
        <span>No {label.toLowerCase()} defined. Add pad groups in the scope configuration above.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Square className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.totalPads}</span>
            <span>pad{summary.totalPads !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalGroups} group{summary.totalGroups !== 1 ? 's' : ''})</span>
          </div>
          {summary.withBottomReoCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withBottomReoCount} with bottom</span>
            </>
          )}
          {summary.withTopReoCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withTopReoCount} with top</span>
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
          {padGroups.every(g => openGroups.has(g.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Pad Group Cards */}
      <div className="space-y-2">
        {padGroups.map((group, groupIndex) => {
          const isOpen = openGroups.has(group.id);
          const padCount = group.quantity || 1;
          
          // Get effective values (group override or defaults)
          const hasBottomReo = group.has_bottom_reo ?? defaultHasBottomReo;
          const bottomASize = group.bottom_a_size || defaultBottomASize;
          const bottomACentres = group.bottom_a_centres ?? defaultBottomACentres;
          const bottomBSize = group.bottom_b_size || defaultBottomBSize;
          const bottomBCentres = group.bottom_b_centres ?? defaultBottomBCentres;
          const hasTopReo = group.has_top_reo ?? defaultHasTopReo;
          const topASize = group.top_a_size || defaultTopASize;
          const topACentres = group.top_a_centres ?? defaultTopACentres;
          const topBSize = group.top_b_size || defaultTopBSize;
          const topBCentres = group.top_b_centres ?? defaultTopBCentres;
          
          const hasCustomSettings = 
            group.has_bottom_reo !== undefined || 
            group.bottom_a_size !== undefined ||
            group.bottom_a_centres !== undefined ||
            group.has_top_reo !== undefined ||
            group.top_a_size !== undefined;

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
                          {padCount} pad{padCount !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {group.length}×{group.width}×{group.depth}mm
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasBottomReo && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                          Bottom
                        </span>
                      )}
                      {hasTopReo && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-accent text-accent-foreground">
                          Top
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
                    {/* Bottom Reinforcement Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Bottom Reinforcement</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={hasBottomReo}
                            onCheckedChange={(val) => updateGroup(groupIndex, { has_bottom_reo: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            hasBottomReo ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {hasBottomReo ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      
                      {hasBottomReo && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Bar A Size</Label>
                            <Select
                              value={bottomASize}
                              onValueChange={(val) => updateGroup(groupIndex, { bottom_a_size: val })}
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
                            <Label className="text-[10px] text-muted-foreground">Bar A Centres</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={bottomACentres}
                                onChange={(e) => updateGroup(groupIndex, { bottom_a_centres: Number(e.target.value) })}
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
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Bar B Size</Label>
                            <Select
                              value={bottomBSize}
                              onValueChange={(val) => updateGroup(groupIndex, { bottom_b_size: val })}
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
                            <Label className="text-[10px] text-muted-foreground">Bar B Centres</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={bottomBCentres}
                                onChange={(e) => updateGroup(groupIndex, { bottom_b_centres: Number(e.target.value) })}
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

                    {/* Top Reinforcement Section */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Top Reinforcement</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={hasTopReo}
                            onCheckedChange={(val) => updateGroup(groupIndex, { has_top_reo: val })}
                          />
                          <span className={cn(
                            "text-sm min-w-[3ch]",
                            hasTopReo ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {hasTopReo ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      
                      {hasTopReo && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Bar A Size</Label>
                            <Select
                              value={topASize}
                              onValueChange={(val) => updateGroup(groupIndex, { top_a_size: val })}
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
                            <Label className="text-[10px] text-muted-foreground">Bar A Centres</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={topACentres}
                                onChange={(e) => updateGroup(groupIndex, { top_a_centres: Number(e.target.value) })}
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
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Bar B Size</Label>
                            <Select
                              value={topBSize}
                              onValueChange={(val) => updateGroup(groupIndex, { top_b_size: val })}
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
                            <Label className="text-[10px] text-muted-foreground">Bar B Centres</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={topBCentres}
                                onChange={(e) => updateGroup(groupIndex, { top_b_centres: Number(e.target.value) })}
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
                        Settings apply to all {padCount} pad{padCount !== 1 ? 's' : ''} in this group
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
