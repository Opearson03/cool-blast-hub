import { BeamConfig, HorizontalBarConfig, VerticalBarConfig, PriceMap } from "@/lib/estimate-components/types";
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
import { ChevronDown, ChevronRight, Settings2, Ruler, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

const TM_OPTIONS = [
  { value: 'none', label: 'None', width: '-' },
  { value: 'L8TM3', label: 'L8TM3', width: '300mm' },
  { value: 'L8TM4', label: 'L8TM4', width: '400mm' },
  { value: 'L11TM3', label: 'L11TM3', width: '300mm' },
  { value: 'L11TM4', label: 'L11TM4', width: '400mm' },
  { value: 'L12TM3', label: 'L12TM3', width: '300mm' },
  { value: 'L12TM4', label: 'L12TM4', width: '400mm' },
  { value: 'L12TM5', label: 'L12TM5', width: '500mm' },
  { value: 'L16TM3', label: 'L16TM3', width: '300mm' },
];

const TM_LAYERS_OPTIONS = [
  { value: 1, label: '1 Layer' },
  { value: 2, label: '2 Layers' },
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

// Get TM price from price map
function getTmPrice(tmType: string, priceMap?: PriceMap): number | undefined {
  if (!priceMap || tmType === 'none') return undefined;
  return priceMap['trench_mesh']?.[tmType];
}

interface BeamReinforcementInputProps {
  beams: BeamConfig[];
  onChange: (beams: BeamConfig[]) => void;
  defaultTmType: string;
  defaultAddLigs: boolean;
  defaultLigSize: string;
  defaultLigCentres: number;
  label: string;
  priceMap?: PriceMap;
}

/** Beam type group with aggregated data and shared reinforcement */
interface BeamTypeGroup {
  typeName: string;
  width: number;
  depth: number;
  segments: BeamConfig[];
  totalLength: number;
  groupKey: string;
  
  // Derived reinforcement from first segment (all segments in group share same reo)
  tm_type?: string;
  tm_layers?: number;
  tm_type_top?: string;  // Top layer TM type when tm_layers > 1
  tm_price?: number;     // Price per sheet for bottom/single layer
  tm_price_top?: number; // Price per sheet for top layer
  add_ligs?: boolean;
  lig_size?: string;
  lig_centres?: number;
  horizontal_bars?: HorizontalBarConfig[];
  vertical_bars?: VerticalBarConfig[];
}

function parseBeamTypeName(name: string): string {
  // Extract base type name: "EB1-2" -> "EB1", "IB1-3" -> "IB1"
  const match = name.match(/^([A-Z]+\d+)/i);
  if (match) return match[1].toUpperCase();
  
  // For legacy names like "Edge Beam 1", use the full name as type
  return name.split('-')[0].trim();
}

function groupBeamsByType(beams: BeamConfig[]): BeamTypeGroup[] {
  const groupMap = new Map<string, BeamTypeGroup>();
  
  beams.forEach(beam => {
    const typeName = parseBeamTypeName(beam.name);
    // Group by typeName + dimensions
    const key = `${typeName}-${beam.width}-${beam.depth}`;
    
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        typeName,
        width: beam.width || 0,
        depth: beam.depth || 0,
        segments: [beam],
        totalLength: beam.length || 0,
        groupKey: key,
        // Use first segment's reinforcement as group settings
        tm_type: beam.tm_type,
        tm_layers: beam.tm_layers,
        tm_type_top: beam.tm_type_top,
        tm_price: beam.tm_price,
        tm_price_top: beam.tm_price_top,
        add_ligs: beam.add_ligs,
        lig_size: beam.lig_size,
        lig_centres: beam.lig_centres,
        horizontal_bars: beam.horizontal_bars,
        vertical_bars: beam.vertical_bars,
      });
    } else {
      const group = groupMap.get(key)!;
      group.segments.push(beam);
      group.totalLength += beam.length || 0;
    }
  });
  
  // Sort groups by type name
  return Array.from(groupMap.values()).sort((a, b) => 
    a.typeName.localeCompare(b.typeName, undefined, { numeric: true })
  );
}

export function BeamReinforcementInput({
  beams,
  onChange,
  defaultTmType,
  defaultAddLigs,
  defaultLigSize,
  defaultLigCentres,
  label,
  priceMap,
}: BeamReinforcementInputProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const groups = useMemo(() => groupBeamsByType(beams), [beams]);

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = groups.every(g => openGroups.has(g.groupKey));
    if (allOpen) {
      setOpenGroups(new Set());
    } else {
      setOpenGroups(new Set(groups.map(g => g.groupKey)));
    }
  };

  // Update all segments in a group with reinforcement changes
  const updateGroupReinforcement = useCallback((group: BeamTypeGroup, updates: Partial<BeamConfig>) => {
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        return { ...beam, ...updates };
      }
      return beam;
    });
    onChange(updatedBeams);
  }, [beams, onChange]);

  // Add horizontal bar to all segments in group
  const addHorizontalBarToGroup = useCallback((group: BeamTypeGroup) => {
    const newBar: HorizontalBarConfig = {
      id: `hbar_${Date.now()}`,
      bar_size: 'N16',
      quantity: 2,
      position: 'bottom',
    };
    
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        const currentBars = beam.horizontal_bars || [];
        return { ...beam, horizontal_bars: [...currentBars, newBar] };
      }
      return beam;
    });
    onChange(updatedBeams);
  }, [beams, onChange]);

  // Update horizontal bar on all segments in group
  const updateHorizontalBarForGroup = useCallback((group: BeamTypeGroup, barIndex: number, updates: Partial<HorizontalBarConfig>) => {
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        const currentBars = [...(beam.horizontal_bars || [])];
        if (currentBars[barIndex]) {
          currentBars[barIndex] = { ...currentBars[barIndex], ...updates };
        }
        return { ...beam, horizontal_bars: currentBars };
      }
      return beam;
    });
    onChange(updatedBeams);
  }, [beams, onChange]);

  // Remove horizontal bar from all segments in group
  const removeHorizontalBarFromGroup = useCallback((group: BeamTypeGroup, barIndex: number) => {
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        const currentBars = [...(beam.horizontal_bars || [])];
        currentBars.splice(barIndex, 1);
        return { ...beam, horizontal_bars: currentBars };
      }
      return beam;
    });
    onChange(updatedBeams);
  }, [beams, onChange]);

  // Add vertical bar to all segments in group
  const addVerticalBarToGroup = useCallback((group: BeamTypeGroup) => {
    const newBar: VerticalBarConfig = {
      id: `vbar_${Date.now()}`,
      bar_size: 'N16',
      centres: 400,
      length: 1200,
    };
    
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        const currentBars = beam.vertical_bars || [];
        return { ...beam, vertical_bars: [...currentBars, newBar] };
      }
      return beam;
    });
    onChange(updatedBeams);
  }, [beams, onChange]);

  // Update vertical bar on all segments in group
  const updateVerticalBarForGroup = useCallback((group: BeamTypeGroup, barIndex: number, updates: Partial<VerticalBarConfig>) => {
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        const currentBars = [...(beam.vertical_bars || [])];
        if (currentBars[barIndex]) {
          currentBars[barIndex] = { ...currentBars[barIndex], ...updates };
        }
        return { ...beam, vertical_bars: currentBars };
      }
      return beam;
    });
    onChange(updatedBeams);
  }, [beams, onChange]);

  // Remove vertical bar from all segments in group
  const removeVerticalBarFromGroup = useCallback((group: BeamTypeGroup, barIndex: number) => {
    const updatedBeams = beams.map(beam => {
      const beamType = parseBeamTypeName(beam.name);
      if (beamType === group.typeName && beam.width === group.width && beam.depth === group.depth) {
        const currentBars = [...(beam.vertical_bars || [])];
        currentBars.splice(barIndex, 1);
        return { ...beam, vertical_bars: currentBars };
      }
      return beam;
    });
    onChange(updatedBeams);
  }, [beams, onChange]);

  // Summary calculations
  const summary = useMemo(() => {
    let totalLength = 0;
    let withLigsCount = 0;
    let customCount = 0;
    let withHorizontalCount = 0;
    let withVerticalCount = 0;

    groups.forEach(group => {
      totalLength += group.totalLength || 0;
      const addLigs = group.add_ligs ?? defaultAddLigs;
      if (addLigs) withLigsCount++;
      if (group.horizontal_bars && group.horizontal_bars.length > 0) withHorizontalCount++;
      if (group.vertical_bars && group.vertical_bars.length > 0) withVerticalCount++;
      if (group.tm_type || group.add_ligs !== undefined || group.lig_size || group.lig_centres || 
          (group.horizontal_bars && group.horizontal_bars.length > 0) ||
          (group.vertical_bars && group.vertical_bars.length > 0)) {
        customCount++;
      }
    });

    return { 
      totalLength, 
      withLigsCount, 
      customCount, 
      totalGroups: groups.length,
      totalSegments: beams.length,
      withHorizontalCount, 
      withVerticalCount 
    };
  }, [groups, beams.length, defaultAddLigs]);

  if (beams.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
        <Ruler className="h-5 w-5 opacity-50" />
        <span>No {label.toLowerCase()} defined. Add beams in the scope configuration above.</span>
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
            <span className="font-medium text-foreground">{summary.totalGroups}</span>
            <span>type{summary.totalGroups !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">
              ({summary.totalSegments} segment{summary.totalSegments !== 1 ? 's' : ''} • {summary.totalLength.toFixed(1)}m)
            </span>
          </div>
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
          {groups.every(g => openGroups.has(g.groupKey)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Beam Type Group Cards */}
      <div className="space-y-2">
        {groups.map((group) => {
          const isOpen = openGroups.has(group.groupKey);
          const tmType = group.tm_type || defaultTmType;
          const tmLayers = group.tm_layers || 1;
          const addLigs = group.add_ligs ?? defaultAddLigs;
          const ligSize = group.lig_size || defaultLigSize;
          const ligCentres = group.lig_centres ?? defaultLigCentres;
          const horizontalBars = group.horizontal_bars || [];
          const verticalBars = group.vertical_bars || [];
          const hasCustomSettings = group.tm_type || (group.tm_layers && group.tm_layers > 1) || group.add_ligs !== undefined || group.lig_size || group.lig_centres ||
            horizontalBars.length > 0 || verticalBars.length > 0;

          const tmOption = TM_OPTIONS.find(o => o.value === tmType);

          return (
            <Collapsible key={group.groupKey} open={isOpen} onOpenChange={() => toggleGroup(group.groupKey)}>
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
                        <span className="font-medium text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {group.typeName}
                        </span>
                        <Badge variant="outline" className="text-xs font-normal h-5">
                          {group.totalLength.toFixed(1)}m
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {group.segments.length} segment{group.segments.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground/70 tabular-nums">
                          {group.width}w × {group.depth}d
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tmType === 'none' ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                          No TM
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                          {tmLayers > 1 
                            ? `${tmOption?.label || tmType} + ${group.tm_type_top || tmType}`
                            : (tmOption?.label || tmType)
                          }
                        </span>
                      )}
                      {addLigs && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-accent text-accent-foreground">
                          +Ligs
                        </span>
                      )}
                      {horizontalBars.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground">
                          +H-Bars
                        </span>
                      )}
                      {verticalBars.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                          +V-Bars
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
                    {/* Segments List (collapsed preview) */}
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Segments: </span>
                      {group.segments.map((s, i) => (
                        <span key={s.id}>
                          {s.name} ({s.length.toFixed(1)}m){i < group.segments.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>

                    {/* Trench Mesh */}
                    <div className="space-y-3">
                      <div className={cn("grid gap-3", tmType !== 'none' ? "grid-cols-2" : "grid-cols-1")}>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">
                            {tmType !== 'none' && tmLayers > 1 ? 'Bottom Layer TM' : 'Trench Mesh'}
                          </Label>
                          <Select
                            value={tmType}
                            onValueChange={(val) => {
                              // When TM type changes, update type and reset price to catalog price
                              const catalogPrice = getTmPrice(val, priceMap);
                              updateGroupReinforcement(group, { 
                                tm_type: val,
                                tm_price: catalogPrice
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[150]">
                              {TM_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    {opt.label}
                                    {opt.width !== '-' && (
                                      <span className="text-muted-foreground text-xs">({opt.width})</span>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {tmType !== 'none' && (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Layers</Label>
                            <Select
                              value={String(tmLayers)}
                              onValueChange={(val) => updateGroupReinforcement(group, { tm_layers: Number(val) })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
                                {TM_LAYERS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={String(opt.value)}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      
                      {/* Price inputs for TM */}
                      {tmType !== 'none' && (
                        <div className={cn("grid gap-3", tmLayers > 1 ? "grid-cols-2" : "grid-cols-1")}>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">
                              {tmLayers > 1 ? 'Bottom $/sheet' : '$/sheet'}
                            </Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={group.tm_price !== undefined ? group.tm_price : (getTmPrice(tmType, priceMap) ?? '')}
                                onChange={(e) => updateGroupReinforcement(group, { 
                                  tm_price: e.target.value ? Number(e.target.value) : undefined 
                                })}
                                className="h-8 text-sm pl-6"
                              />
                            </div>
                          </div>
                          {tmLayers > 1 && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Top $/sheet</Label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={group.tm_price_top !== undefined ? group.tm_price_top : (getTmPrice(group.tm_type_top || tmType, priceMap) ?? '')}
                                  onChange={(e) => updateGroupReinforcement(group, { 
                                    tm_price_top: e.target.value ? Number(e.target.value) : undefined 
                                  })}
                                  className="h-8 text-sm pl-6"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Top Layer TM - only when 2 layers and not "none" */}
                      {tmType !== 'none' && tmLayers > 1 && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Top Layer TM</Label>
                          <Select
                            value={group.tm_type_top || tmType}
                            onValueChange={(val) => {
                              const catalogPrice = getTmPrice(val, priceMap);
                              updateGroupReinforcement(group, { 
                                tm_type_top: val,
                                tm_price_top: catalogPrice
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[150]">
                              {TM_OPTIONS.filter(opt => opt.value !== 'none').map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    {opt.label}
                                    <span className="text-muted-foreground text-xs">({opt.width})</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Ligatures */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Ligatures</Label>
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                          <Switch
                            checked={addLigs}
                            onCheckedChange={(val) => updateGroupReinforcement(group, { add_ligs: val })}
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
                            <Label className="text-[10px] text-muted-foreground">Lig Size</Label>
                            <Select
                              value={ligSize}
                              onValueChange={(val) => updateGroupReinforcement(group, { lig_size: val })}
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
                                onChange={(e) => updateGroupReinforcement(group, { lig_centres: Number(e.target.value) })}
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

                    {/* Horizontal Reinforcement */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Horizontal Reinforcement</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addHorizontalBarToGroup(group);
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Horizontal
                        </Button>
                      </div>

                      {horizontalBars.length > 0 && (
                        <div className="space-y-2">
                          {horizontalBars.map((bar, barIndex) => (
                            <div key={bar.id} className="flex items-center gap-2 p-2 rounded-md bg-background border">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                                  <Select
                                    value={bar.bar_size}
                                    onValueChange={(val) => updateHorizontalBarForGroup(group, barIndex, { bar_size: val })}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
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
                                  <Label className="text-[10px] text-muted-foreground">Qty</Label>
                                  <Input
                                    type="number"
                                    value={bar.quantity}
                                    onChange={(e) => updateHorizontalBarForGroup(group, barIndex, { quantity: Number(e.target.value) })}
                                    className="h-7 text-xs"
                                    min={1}
                                    max={10}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground">Position</Label>
                                  <Select
                                    value={bar.position}
                                    onValueChange={(val) => updateHorizontalBarForGroup(group, barIndex, { position: val as 'top' | 'bottom' })}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-[150]">
                                      <SelectItem value="top">Top</SelectItem>
                                      <SelectItem value="bottom">Bottom</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeHorizontalBarFromGroup(group, barIndex);
                                }}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vertical Reinforcement */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Vertical Reinforcement</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addVerticalBarToGroup(group);
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Vertical
                        </Button>
                      </div>

                      {verticalBars.length > 0 && (
                        <div className="space-y-2">
                          {verticalBars.map((bar, barIndex) => (
                            <div key={bar.id} className="flex items-center gap-2 p-2 rounded-md bg-background border">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                                  <Select
                                    value={bar.bar_size}
                                    onValueChange={(val) => updateVerticalBarForGroup(group, barIndex, { bar_size: val })}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
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
                                      value={bar.centres}
                                      onChange={(e) => updateVerticalBarForGroup(group, barIndex, { centres: Number(e.target.value) })}
                                      className="h-7 text-xs pr-6"
                                      min={100}
                                      max={1200}
                                      step={50}
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
                                      mm
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground">Length</Label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={bar.length}
                                      onChange={(e) => updateVerticalBarForGroup(group, barIndex, { length: Number(e.target.value) })}
                                      className="h-7 text-xs pr-6"
                                      min={300}
                                      max={3000}
                                      step={100}
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
                                      mm
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVerticalBarFromGroup(group, barIndex);
                                }}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary Footer */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {tmOption?.label || tmType}{tmLayers > 1 ? ` (${tmLayers} layers)` : ''}
                        {addLigs ? ` + ${ligSize} ligs @ ${ligCentres}mm` : ''}
                        {horizontalBars.length > 0 ? ` + ${horizontalBars.length} H-bar${horizontalBars.length > 1 ? 's' : ''}` : ''}
                        {verticalBars.length > 0 ? ` + ${verticalBars.length} V-bar${verticalBars.length > 1 ? 's' : ''}` : ''}
                        {' '}• {group.totalLength.toFixed(1)}m total ({group.segments.length} segments)
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
