import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid3X3, ChevronDown, Plus, Copy, Trash2, Ruler } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { WafflePodZone } from "@/lib/estimate-components/types";

interface MultiWafflePodZoneInputProps {
  zones: WafflePodZone[];
  onZonesChange: (zones: WafflePodZone[]) => void;
  onAggregatesChange?: (aggregates: { 
    totalArea: number; 
    totalPodCount: number; 
    totalPerimeter: number;
  }) => void;
}

const POD_SIZE_OPTIONS = [
  { value: '1050', label: '1050mm' },
  { value: '1090', label: '1090mm' },
  { value: '1110', label: '1110mm' },
];

const POD_THICKNESS_OPTIONS = [
  { value: '225', label: '225mm' },
  { value: '275', label: '275mm' },
  { value: '325', label: '325mm' },
  { value: '375', label: '375mm' },
];

const DEFAULT_ZONE: Omit<WafflePodZone, 'id' | 'name'> = {
  area: 0,
  perimeter: 0,
  pod_size: '1090',
  pod_thickness: '225',
  top_slab_thickness: 85,
  rib_width: 110,
  pod_count: 0,
  rib_bottom_bars: 2,
  rib_bottom_bar_size: 'N12',
  rib_top_bars: 1,
  rib_top_bar_size: 'N12',
  rib_lap_percent: 12.5,
};

export function MultiWafflePodZoneInput({
  zones,
  onZonesChange,
  onAggregatesChange,
}: MultiWafflePodZoneInputProps) {
  const [expandedZones, setExpandedZones] = useState<Set<string>>(() => 
    new Set(zones.length > 0 ? [zones[0].id] : [])
  );
  const lastCalculatedRef = useRef<string>('');

  // Calculate aggregates and notify parent
  useEffect(() => {
    const totalArea = zones.reduce((sum, z) => sum + (z.area || 0), 0);
    const totalPodCount = zones.reduce((sum, z) => sum + (z.pod_count || 0), 0);
    const totalPerimeter = zones.reduce((sum, z) => sum + (z.perimeter || 0), 0);
    
    const key = `${totalArea}-${totalPodCount}-${totalPerimeter}`;
    if (key !== lastCalculatedRef.current) {
      lastCalculatedRef.current = key;
      onAggregatesChange?.({ totalArea, totalPodCount, totalPerimeter });
    }
  }, [zones, onAggregatesChange]);

  // Auto-derive pod count and accessories when area/dimensions change
  const deriveZoneValues = useCallback((zone: WafflePodZone): WafflePodZone => {
    const podSizeM = (Number(zone.pod_size) || 1090) / 1000;
    const ribWidthM = (zone.rib_width || 110) / 1000;
    const moduleM = podSizeM + ribWidthM;
    
    // Estimate pod count from area (approximate)
    const podsPerM2 = 1 / (moduleM * moduleM);
    const estimatedPodCount = Math.round(zone.area * podsPerM2);
    
    // Auto-calculate accessories using boss's formulas
    const spacer4Way = estimatedPodCount; // 1 per pod
    const insidePerimeter = Math.max(0, zone.perimeter - 1.6); // Approximate
    const spacer2Way = Math.ceil(insidePerimeter / 1.2);
    const podRailPacks = Math.ceil((estimatedPodCount * 2) / 20);
    const podRailsRequired = (zone.top_slab_thickness || 85) >= 100;

    return {
      ...zone,
      pod_count: zone.pod_count || estimatedPodCount,
      spacer_4way_count: spacer4Way,
      spacer_2way_count: spacer2Way,
      pod_rail_packs: podRailPacks,
      pod_rails_required: podRailsRequired,
    };
  }, []);

  const handleZoneChange = useCallback((zoneId: string, field: keyof WafflePodZone, value: any) => {
    onZonesChange(zones.map(z => {
      if (z.id !== zoneId) return z;
      
      const updated = { ...z, [field]: value };
      
      // If area or perimeter changed, recalculate derived values
      if (field === 'area' || field === 'perimeter' || field === 'pod_size' || field === 'rib_width') {
        return deriveZoneValues(updated);
      }
      
      // If pod_count changed manually, recalculate accessories
      if (field === 'pod_count') {
        const podCount = Number(value) || 0;
        const insidePerimeter = Math.max(0, updated.perimeter - 1.6);
        return {
          ...updated,
          spacer_4way_count: podCount,
          spacer_2way_count: Math.ceil(insidePerimeter / 1.2),
          pod_rail_packs: Math.ceil((podCount * 2) / 20),
          pod_rails_required: (updated.top_slab_thickness || 85) >= 100,
        };
      }
      
      return updated;
    }));
  }, [zones, onZonesChange, deriveZoneValues]);

  const addZone = useCallback(() => {
    const newId = `zone-${Date.now()}`;
    const newZone: WafflePodZone = {
      ...DEFAULT_ZONE,
      id: newId,
      name: `Zone ${zones.length + 1}`,
    };
    onZonesChange([...zones, newZone]);
    setExpandedZones(prev => new Set([...prev, newId]));
  }, [zones, onZonesChange]);

  const duplicateZone = useCallback((zone: WafflePodZone) => {
    const newId = `zone-${Date.now()}`;
    const duplicated: WafflePodZone = {
      ...zone,
      id: newId,
      name: `${zone.name} (Copy)`,
      _fromTakeoff: false,
    };
    onZonesChange([...zones, duplicated]);
    setExpandedZones(prev => new Set([...prev, newId]));
  }, [zones, onZonesChange]);

  const removeZone = useCallback((zoneId: string) => {
    if (zones.length <= 1) return;
    onZonesChange(zones.filter(z => z.id !== zoneId));
    setExpandedZones(prev => {
      const next = new Set(prev);
      next.delete(zoneId);
      return next;
    });
  }, [zones, onZonesChange]);

  const toggleZone = useCallback((zoneId: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) {
        next.delete(zoneId);
      } else {
        next.add(zoneId);
      }
      return next;
    });
  }, []);

  // Summary stats
  const totalArea = zones.reduce((sum, z) => sum + (z.area || 0), 0);
  const totalPods = zones.reduce((sum, z) => sum + (z.pod_count || 0), 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Waffle Pod Zones</span>
          <Badge variant="secondary" className="text-xs">
            {zones.length} zone{zones.length !== 1 ? 's' : ''} • {totalArea.toFixed(0)}m² • {totalPods} pods
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={addZone} className="h-7 px-2 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add Zone
        </Button>
      </div>

      {/* Zone list */}
      <div className="space-y-2">
        {zones.map((zone, index) => {
          const isExpanded = expandedZones.has(zone.id);
          const totalHeight = (Number(zone.pod_thickness) || 225) + (zone.top_slab_thickness || 85);

          return (
            <Collapsible key={zone.id} open={isExpanded} onOpenChange={() => toggleZone(zone.id)}>
              <div className="rounded-lg border bg-card">
                {/* Zone Header */}
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{zone.name}</span>
                      {zone._fromTakeoff && (
                        <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                          <Ruler className="h-3 w-3" />
                          Plans
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {zone.area || 0}m² • {zone.pod_thickness}mm • {zone.pod_count || 0} pods
                      </Badge>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-3 space-y-4">
                    {/* Zone Name */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Zone Name</Label>
                      <Input
                        value={zone.name}
                        onChange={(e) => handleZoneChange(zone.id, 'name', e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Zone name..."
                      />
                    </div>

                    {/* Area & Perimeter Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Area (m²)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={zone.area ?? ""}
                          onChange={(e) => handleZoneChange(zone.id, 'area', e.target.value === "" ? 0 : Number(e.target.value))}
                          className="h-8 text-sm font-mono"
                          min={0}
                          step={0.1}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Perimeter (m)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={zone.perimeter ?? ""}
                          onChange={(e) => handleZoneChange(zone.id, 'perimeter', e.target.value === "" ? 0 : Number(e.target.value))}
                          className="h-8 text-sm font-mono"
                          min={0}
                          step={0.1}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Pod Specifications Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Pod Size</Label>
                        <Select 
                          value={zone.pod_size} 
                          onValueChange={(v) => handleZoneChange(zone.id, 'pod_size', v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POD_SIZE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Pod Depth</Label>
                        <Select 
                          value={zone.pod_thickness} 
                          onValueChange={(v) => handleZoneChange(zone.id, 'pod_thickness', v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POD_THICKNESS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Topping</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={zone.top_slab_thickness ?? ""}
                          onChange={(e) => handleZoneChange(zone.id, 'top_slab_thickness', e.target.value === "" ? 0 : Number(e.target.value))}
                          onBlur={(e) => {
                            if (!e.target.value || Number(e.target.value) < 50) {
                              handleZoneChange(zone.id, 'top_slab_thickness', 85);
                            }
                          }}
                          className="h-8 text-sm"
                          min={50}
                          placeholder="85mm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Rib Width</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={zone.rib_width ?? ""}
                          onChange={(e) => handleZoneChange(zone.id, 'rib_width', e.target.value === "" ? 0 : Number(e.target.value))}
                          onBlur={(e) => {
                            if (!e.target.value || Number(e.target.value) < 100) {
                              handleZoneChange(zone.id, 'rib_width', 110);
                            }
                          }}
                          className="h-8 text-sm"
                          min={100}
                          placeholder="110mm"
                        />
                      </div>
                    </div>

                    {/* Pod Count & Summary */}
                    <div className="rounded-md bg-muted/30 p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Pod Count</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={zone.pod_count ?? ""}
                            onChange={(e) => handleZoneChange(zone.id, 'pod_count', e.target.value === "" ? 0 : Number(e.target.value))}
                            className="h-8 text-sm font-mono"
                            min={0}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Height</Label>
                          <div className="h-8 flex items-center text-sm font-mono text-muted-foreground">
                            {totalHeight}mm
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Zone Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateZone(zone)}
                        className="h-7 px-2 text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Duplicate
                      </Button>
                      {zones.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeZone(zone.id)}
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      )}
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
