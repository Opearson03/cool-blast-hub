import { MeasurementArea } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { ChevronDown, ChevronRight, Grid3X3, Layers, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

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

const MESH_LAYERS_OPTIONS = [
  { value: 1, label: '1 Layer' },
  { value: 2, label: '2 Layers' },
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
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set());

  const updateArea = (index: number, updates: Partial<MeasurementArea>) => {
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], ...updates };
    onChange(newAreas);
  };

  const toggleArea = (areaId: string) => {
    setOpenAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allOpen = areas.every(a => openAreas.has(a.id));
    if (allOpen) {
      setOpenAreas(new Set());
    } else {
      setOpenAreas(new Set(areas.map(a => a.id)));
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    let totalArea = 0;
    let meshCount = 0;
    let barCount = 0;
    let fiberCount = 0;
    let noneCount = 0;
    let customCount = 0;

    areas.forEach(area => {
      const areaValue = area._actualArea || (area.length * area.width);
      totalArea += areaValue;
      
      const reoType = area.reo_type || defaultReoType;
      if (reoType === 'mesh') meshCount++;
      else if (reoType === 'bar') barCount++;
      else if (reoType === 'fiber') fiberCount++;
      else if (reoType === 'none') noneCount++;
      
      if (area.reo_type || area.mesh_type || area.bar_size) customCount++;
    });

    return { totalArea, meshCount, barCount, fiberCount, noneCount, customCount, total: areas.length };
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
      {/* Summary Header - matching pier style */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>area{summary.total !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground/60">({summary.totalArea.toFixed(1)} m²)</span>
          </div>
          {summary.meshCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.meshCount} with mesh</span>
            </>
          )}
          {summary.barCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{summary.barCount} with bar</span>
            </>
          )}
          {summary.customCount > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="text-primary">{summary.customCount} custom</span>
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
          {areas.every(a => openAreas.has(a.id)) ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Area Cards */}
      <div className="space-y-2">
        {areas.map((area, index) => {
          const isOpen = openAreas.has(area.id);
          const reoType = area.reo_type || defaultReoType;
          const meshType = area.mesh_type || defaultMeshType;
          const barSize = area.bar_size || defaultBarSize;
          const barSpacing = area.bar_spacing || defaultBarSpacing;
          const barLayers = area.bar_layers || defaultBarLayers;
          const meshLayers = area.mesh_layers || 1;
          const areaValue = area._actualArea || (area.length * area.width);
          const hasCustomSettings = area.reo_type || area.mesh_type || area.bar_size || (area.mesh_layers && area.mesh_layers > 1);
          const hasReinforcement = reoType === 'mesh' || reoType === 'bar';

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
                      <span className="font-medium text-sm">{area.name}</span>
                      <Badge variant="outline" className="text-xs font-normal h-5">
                        {areaValue.toFixed(1)} m²
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[11px] h-5",
                          reoType === 'mesh' && "bg-primary/10 text-primary border-primary/20",
                          reoType === 'bar' && "bg-accent text-accent-foreground",
                          reoType === 'fiber' && "bg-secondary text-secondary-foreground",
                          reoType === 'none' && "bg-muted text-muted-foreground"
                        )}
                      >
                        {reoType === 'mesh' ? 'Mesh' : reoType === 'bar' ? 'Bar' : reoType === 'fiber' ? 'Fiber' : 'None'}
                      </Badge>
                      {hasCustomSettings && (
                        <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">
                          Custom
                        </Badge>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-2 border-t bg-muted/30 space-y-3">
                    {/* Surface Reinforcement Toggle */}
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Surface Reinforcement
                      </Label>
                      <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
                        <Switch
                          checked={hasReinforcement}
                          onCheckedChange={(checked) => {
                            updateArea(index, { 
                              reo_type: checked ? 'mesh' : 'none' 
                            });
                          }}
                        />
                        <span className={cn(
                          "text-sm min-w-[3ch]",
                          hasReinforcement ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {hasReinforcement ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {/* Reinforcement Settings - only show if reinforcement enabled */}
                    {hasReinforcement && (
                      <>
                        <div className="pt-3 border-t space-y-3">
                          {/* Type Selection */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Type</Label>
                              <Select
                                value={reoType}
                                onValueChange={(val) => updateArea(index, { reo_type: val as any })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                  <SelectItem value="mesh">Steel Mesh</SelectItem>
                                  <SelectItem value="bar">Bar Reo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Mesh Type (becomes Bottom Layer when 2 layers) */}
                            {reoType === 'mesh' && (
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">
                                  {meshLayers > 1 ? 'Bottom Layer' : 'Mesh Type'}
                                </Label>
                                <Select
                                  value={meshType}
                                  onValueChange={(val) => updateArea(index, { mesh_type: val })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
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
                          </div>

                          {/* Mesh Layers & Top Layer Type */}
                          {reoType === 'mesh' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Number of Layers</Label>
                                <Select
                                  value={String(meshLayers)}
                                  onValueChange={(val) => updateArea(index, { mesh_layers: Number(val) })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[150]">
                                    {MESH_LAYERS_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Top Layer Mesh Type - only when 2 layers */}
                              {meshLayers > 1 && (
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground">Top Layer</Label>
                                  <Select
                                    value={area.mesh_type_top || meshType}
                                    onValueChange={(val) => updateArea(index, { mesh_type_top: val })}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
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
                            </div>
                          )}

                          {/* Bar options */}
                          {reoType === 'bar' && (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                                <Select
                                  value={barSize}
                                  onValueChange={(val) => updateArea(index, { bar_size: val })}
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
                                <Label className="text-[10px] text-muted-foreground">Spacing</Label>
                                <Select
                                  value={barSpacing}
                                  onValueChange={(val) => updateArea(index, { bar_spacing: val })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
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

                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Layers</Label>
                                <Select
                                  value={barLayers}
                                  onValueChange={(val) => updateArea(index, { bar_layers: val })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
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
                            </div>
                          )}
                        </div>

                        {/* Summary Footer */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            {reoType === 'mesh' && (
                              meshLayers > 1 
                                ? `${meshType} (bottom) + ${area.mesh_type_top || meshType} (top) • ${areaValue.toFixed(1)} m²`
                                : `${meshType} mesh • ${areaValue.toFixed(1)} m²`
                            )}
                            {reoType === 'bar' && `${barSize} @ ${barSpacing}mm ${barLayers === '2' ? '(T&B)' : '(bottom)'} • ${areaValue.toFixed(1)} m²`}
                          </p>
                        </div>
                      </>
                    )}
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
