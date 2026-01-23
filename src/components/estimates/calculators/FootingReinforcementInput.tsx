import { FootingConfig, LinearSection } from "@/lib/estimate-components/types";
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
import { ChevronDown, ChevronRight, Settings2, Ruler, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const TM_OPTIONS = [
  { value: 'L8TM3', label: 'L8TM3 (300mm)' },
  { value: 'L8TM4', label: 'L8TM4 (400mm)' },
  { value: 'L11TM3', label: 'L11TM3 (300mm)' },
  { value: 'L11TM4', label: 'L11TM4 (400mm)' },
  { value: 'L12TM3', label: 'L12TM3 (300mm)' },
  { value: 'L12TM4', label: 'L12TM4 (400mm)' },
  { value: 'L12TM5', label: 'L12TM5 (500mm)' },
  { value: 'L16TM3', label: 'L16TM3 (300mm)' },
];

const LIG_SIZE_OPTIONS = [
  { value: 'R10', label: 'R10' },
  { value: 'R12', label: 'R12' },
];

const BAR_SIZE_OPTIONS = [
  { value: 'N12', label: 'N12' },
  { value: 'N16', label: 'N16' },
  { value: 'N20', label: 'N20' },
  { value: 'N24', label: 'N24' },
];

const REO_TYPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'trench_mesh', label: 'Trench Mesh' },
  { value: 'bar', label: 'Bar Reo' },
  { value: 'both', label: 'TM + Bars' },
];

type FootingOrSection = FootingConfig | LinearSection;

interface FootingReinforcementInputProps {
  footings: FootingOrSection[];
  onChange: (footings: FootingOrSection[]) => void;
  defaultReoType: string;
  defaultTmType: string;
  defaultAddLigs: boolean;
  defaultLigSize: string;
  defaultLigCentres: number;
  defaultAddVerticalBars: boolean;
  defaultVerticalBarSize: string;
  defaultVerticalBarCentres: number;
  label: string;
  /** Format function for displaying footing dimensions */
  formatDimensions?: (footing: FootingOrSection) => string;
}

export function FootingReinforcementInput({
  footings,
  onChange,
  defaultReoType,
  defaultTmType,
  defaultAddLigs,
  defaultLigSize,
  defaultLigCentres,
  defaultAddVerticalBars,
  defaultVerticalBarSize,
  defaultVerticalBarCentres,
  label,
  formatDimensions,
}: FootingReinforcementInputProps) {
  const [openFootings, setOpenFootings] = useState<Set<string>>(new Set());

  const toggleFooting = (footingId: string) => {
    setOpenFootings(prev => {
      const next = new Set(prev);
      if (next.has(footingId)) {
        next.delete(footingId);
      } else {
        next.add(footingId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = footings.every(f => openFootings.has(f.id));
    if (allOpen) {
      setOpenFootings(new Set());
    } else {
      setOpenFootings(new Set(footings.map(f => f.id)));
    }
  };

  const updateFooting = (index: number, updates: Partial<FootingOrSection>) => {
    const newFootings = [...footings];
    newFootings[index] = { ...newFootings[index], ...updates } as FootingOrSection;
    onChange(newFootings);
  };

  const getDimensions = (footing: FootingOrSection): string => {
    if (formatDimensions) {
      return formatDimensions(footing);
    }
    // Default format for FootingConfig
    if ('width' in footing) {
      return `${footing.length.toFixed(1)}m × ${footing.width}w × ${footing.depth}d`;
    }
    // LinearSection format
    return `${footing.length.toFixed(1)}m × ${footing.dimension1}mm × ${footing.dimension2}mm`;
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalLength = 0;
    let withTmCount = 0;
    let withLigsCount = 0;
    let customCount = 0;

    footings.forEach(footing => {
      totalLength += footing.length || 0;
      
      const reoType = footing.reo_type || defaultReoType;
      const addLigs = footing.add_ligs ?? defaultAddLigs;
      
      if (reoType === 'trench_mesh' || reoType === 'both') withTmCount++;
      if (addLigs) withLigsCount++;
      
      if (footing.reo_type !== undefined || footing.tm_type !== undefined ||
          footing.add_ligs !== undefined || footing.add_vertical_bars !== undefined) {
        customCount++;
      }
    });

    return { totalLength, withTmCount, withLigsCount, customCount, total: footings.length };
  }, [footings, defaultReoType, defaultAddLigs]);

  if (footings.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
        <Ruler className="h-5 w-5 opacity-50" />
        <span>No {label.toLowerCase()} defined. Add footings in the scope configuration above.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>footing{summary.total !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalLength.toFixed(1)}m)</span>
          </div>
          {summary.withTmCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withTmCount} with TM</span>
            </>
          )}
          {summary.withLigsCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.withLigsCount} with ligs</span>
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
          {footings.every(f => openFootings.has(f.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Footing Cards */}
      <div className="space-y-2">
        {footings.map((footing, index) => {
          const isOpen = openFootings.has(footing.id);
          const reoType = footing.reo_type || defaultReoType;
          const tmType = footing.tm_type || defaultTmType;
          const addLigs = footing.add_ligs ?? defaultAddLigs;
          const ligSize = footing.lig_size || defaultLigSize;
          const ligCentres = footing.lig_centres ?? defaultLigCentres;
          const addVerticalBars = footing.add_vertical_bars ?? defaultAddVerticalBars;
          const verticalBarSize = footing.vertical_bar_size || defaultVerticalBarSize;
          const verticalBarCentres = footing.vertical_bar_centres ?? defaultVerticalBarCentres;
          
          const hasCustomSettings = 
            footing.reo_type !== undefined || 
            footing.tm_type !== undefined ||
            footing.add_ligs !== undefined ||
            footing.add_vertical_bars !== undefined;

          const showTmOptions = reoType === 'trench_mesh' || reoType === 'both';
          const showBarOptions = reoType === 'bar' || reoType === 'both';

          return (
            <Collapsible key={footing.id} open={isOpen} onOpenChange={() => toggleFooting(footing.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                hasCustomSettings ? "border-primary/30 bg-primary/[0.02]" : "bg-card"
              )}>
                {/* Header */}
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{footing.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {getDimensions(footing)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {showTmOptions && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                          {tmType}
                        </span>
                      )}
                      {addLigs && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-accent text-accent-foreground">
                          +Ligs
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
                
                {/* Content */}
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-4">
                    {/* Reo Type */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Reinforcement Type</Label>
                      <Select
                        value={reoType}
                        onValueChange={(val) => updateFooting(index, { reo_type: val as any })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[150]">
                          {REO_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Trench Mesh Options */}
                    {showTmOptions && (
                      <div className="space-y-3 pt-3 border-t">
                        <Label className="text-xs font-medium">Trench Mesh</Label>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Type</Label>
                          <Select
                            value={tmType}
                            onValueChange={(val) => updateFooting(index, { tm_type: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[150]">
                              {TM_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Ligatures */}
                    {(showTmOptions || showBarOptions) && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Ligatures</Label>
                          <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                            <Switch
                              checked={addLigs}
                              onCheckedChange={(val) => updateFooting(index, { add_ligs: val })}
                            />
                            <span className={cn(
                              "text-sm min-w-[3ch]",
                              addLigs ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {addLigs ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                        
                        {addLigs && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Size</Label>
                              <Select
                                value={ligSize}
                                onValueChange={(val) => updateFooting(index, { lig_size: val })}
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
                              <Label className="text-[10px] text-muted-foreground">Centres</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={ligCentres}
                                  onChange={(e) => updateFooting(index, { lig_centres: Number(e.target.value) })}
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
                    )}

                    {/* Vertical Starter Bars */}
                    {reoType !== 'none' && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Vertical Starters</Label>
                          <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                            <Switch
                              checked={addVerticalBars}
                              onCheckedChange={(val) => updateFooting(index, { add_vertical_bars: val })}
                            />
                            <span className={cn(
                              "text-sm min-w-[3ch]",
                              addVerticalBars ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {addVerticalBars ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                        
                        {addVerticalBars && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                              <Select
                                value={verticalBarSize}
                                onValueChange={(val) => updateFooting(index, { vertical_bar_size: val })}
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
                              <Label className="text-[10px] text-muted-foreground">Centres</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={verticalBarCentres}
                                  onChange={(e) => updateFooting(index, { vertical_bar_centres: Number(e.target.value) })}
                                  className="h-8 text-sm pr-8"
                                  min={100}
                                  max={1200}
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
                    )}

                    {/* Summary Footer */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {reoType === 'none' ? 'No reinforcement' : 
                          `${reoType === 'trench_mesh' ? tmType : reoType === 'both' ? `${tmType} + bars` : 'Bar reo'}${addLigs ? ` + ${ligSize} ligs @ ${ligCentres}` : ''}`
                        } • {footing.length.toFixed(1)}m
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
