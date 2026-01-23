import { MeasurementArea } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { ChevronDown, ChevronRight, Grid3X3, Settings2, Layers, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const REO_TYPE_OPTIONS = [
  { value: 'mesh', label: 'Steel Mesh', icon: '◼' },
  { value: 'bar', label: 'Bar Reo', icon: '▬' },
  { value: 'fiber', label: 'Fiber Only', icon: '∿' },
  { value: 'none', label: 'None', icon: '○' },
];

const MESH_OPTIONS = [
  { value: 'SL62', label: 'SL62' },
  { value: 'SL72', label: 'SL72' },
  { value: 'SL82', label: 'SL82' },
  { value: 'SL92', label: 'SL92' },
  { value: 'SL102', label: 'SL102' },
  { value: 'RL718', label: 'RL718' },
  { value: 'RL818', label: 'RL818' },
  { value: 'RL918', label: 'RL918' },
  { value: 'RL1018', label: 'RL1018' },
];

const BAR_SIZE_OPTIONS = [
  { value: 'N10', label: 'N10' },
  { value: 'N12', label: 'N12' },
  { value: 'N16', label: 'N16' },
  { value: 'N20', label: 'N20' },
];

const BAR_SPACING_OPTIONS = [
  { value: '100', label: '100mm' },
  { value: '150', label: '150mm' },
  { value: '200', label: '200mm' },
  { value: '250', label: '250mm' },
];

const BAR_LAYERS_OPTIONS = [
  { value: '1', label: 'Single (bottom)' },
  { value: '2', label: 'Double (T&B)' },
];

interface AreaReinforcementInputProps {
  areas: MeasurementArea[];
  onChange: (areas: MeasurementArea[]) => void;
  defaultReoType: string;
  defaultMeshType: string;
  defaultBarSize: string;
  defaultBarSpacing: string;
  defaultBarLayers: string;
  label: string;
}

export function AreaReinforcementInput({
  areas,
  onChange,
  defaultReoType,
  defaultMeshType,
  defaultBarSize,
  defaultBarSpacing,
  defaultBarLayers,
  label,
}: AreaReinforcementInputProps) {
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});

  const updateArea = (index: number, updates: Partial<MeasurementArea>) => {
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], ...updates };
    onChange(newAreas);
  };

  const toggleArea = (areaId: string) => {
    setOpenAreas(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  const toggleAll = () => {
    const allOpen = areas.every(a => openAreas[a.id]);
    const newState: Record<string, boolean> = {};
    areas.forEach(a => { newState[a.id] = !allOpen; });
    setOpenAreas(newState);
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalArea = 0;
    let meshCount = 0;
    let barCount = 0;
    let customCount = 0;

    areas.forEach(area => {
      const areaValue = area._actualArea || (area.length * area.width);
      totalArea += areaValue;
      
      const reoType = area.reo_type || defaultReoType;
      if (reoType === 'mesh') meshCount++;
      else if (reoType === 'bar') barCount++;
      
      if (area.reo_type || area.mesh_type || area.bar_size) customCount++;
    });

    return { totalArea, meshCount, barCount, customCount, total: areas.length };
  }, [areas, defaultReoType]);

  if (areas.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground italic py-4 px-3 border border-dashed rounded-lg">
        <Grid3X3 className="h-5 w-5 opacity-50" />
        <span>No {label.toLowerCase()} defined. Add areas in the scope configuration above.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>area{summary.total !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-border">•</span>
          <span>{summary.totalArea.toFixed(1)}m² total</span>
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
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {areas.every(a => openAreas[a.id]) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Area Cards */}
      <div className="space-y-2">
        {areas.map((area, index) => {
          const isOpen = openAreas[area.id] || false;
          const reoType = area.reo_type || defaultReoType;
          const meshType = area.mesh_type || defaultMeshType;
          const barSize = area.bar_size || defaultBarSize;
          const barSpacing = area.bar_spacing || defaultBarSpacing;
          const barLayers = area.bar_layers || defaultBarLayers;
          const areaValue = area._actualArea || (area.length * area.width);
          const hasCustomSettings = area.reo_type || area.mesh_type || area.bar_size;

          const reoOption = REO_TYPE_OPTIONS.find(o => o.value === reoType);
          const reoLabel = reoOption?.label || 'Mesh';

          return (
            <Collapsible key={area.id} open={isOpen} onOpenChange={() => toggleArea(area.id)}>
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                hasCustomSettings ? "border-primary/30 bg-primary/[0.02]" : "bg-card"
              )}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{area.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {areaValue.toFixed(1)}m²
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full font-medium",
                        reoType === 'mesh' && "bg-primary/10 text-primary",
                        reoType === 'bar' && "bg-accent text-accent-foreground",
                        reoType === 'fiber' && "bg-secondary text-secondary-foreground",
                        reoType === 'none' && "bg-muted text-muted-foreground"
                      )}>
                        {reoLabel}
                      </span>
                      {hasCustomSettings && (
                        <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">
                          Custom
                        </span>
                      )}
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Reo Type */}
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-medium">Reinforcement Type</Label>
                        <Select
                          value={reoType}
                          onValueChange={(val) => updateArea(index, { reo_type: val as any })}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[150]">
                            {REO_TYPE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <span className="opacity-50">{opt.icon}</span>
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mesh options */}
                      {reoType === 'mesh' && (
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-xs">Mesh Type</Label>
                          <Select
                            value={meshType}
                            onValueChange={(val) => updateArea(index, { mesh_type: val })}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[150]">
                              {MESH_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Bar options */}
                      {reoType === 'bar' && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Bar Size</Label>
                            <Select
                              value={barSize}
                              onValueChange={(val) => updateArea(index, { bar_size: val })}
                            >
                              <SelectTrigger className="h-9 text-sm">
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

                          <div className="space-y-1.5">
                            <Label className="text-xs">Spacing</Label>
                            <Select
                              value={barSpacing}
                              onValueChange={(val) => updateArea(index, { bar_spacing: val })}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
                                {BAR_SPACING_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs">Layers</Label>
                            <Select
                              value={barLayers}
                              onValueChange={(val) => updateArea(index, { bar_layers: val })}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[150]">
                                {BAR_LAYERS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
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
