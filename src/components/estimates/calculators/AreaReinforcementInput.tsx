import { MeasurementArea } from "@/lib/estimate-components/types";
import { Label } from "@/components/ui/label";
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

const REO_TYPE_OPTIONS = [
  { value: 'mesh', label: 'Steel Mesh' },
  { value: 'bar', label: 'Bar Reo' },
  { value: 'fiber', label: 'Fiber Only' },
  { value: 'none', label: 'None' },
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

  if (areas.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic py-2">
        No {label.toLowerCase()} defined.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Configure reinforcement for each slab area. Expand to customize type and specs.
      </p>
      {areas.map((area, index) => {
        const isOpen = openAreas[area.id] || false;
        const reoType = area.reo_type || defaultReoType;
        const meshType = area.mesh_type || defaultMeshType;
        const barSize = area.bar_size || defaultBarSize;
        const barSpacing = area.bar_spacing || defaultBarSpacing;
        const barLayers = area.bar_layers || defaultBarLayers;
        const areaValue = area._actualArea || (area.length * area.width);
        const hasCustomSettings = area.reo_type || area.mesh_type || area.bar_size;

        return (
          <Collapsible key={area.id} open={isOpen} onOpenChange={() => toggleArea(area.id)}>
            <div className="border rounded-lg overflow-hidden bg-card">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{area.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {areaValue.toFixed(1)}m²
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
                <div className="px-3 pb-3 pt-1 border-t bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Reo Type */}
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs">Reinforcement Type</Label>
                      <Select
                        value={reoType}
                        onValueChange={(val) => updateArea(index, { reo_type: val as any })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REO_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                          <SelectContent>
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
                            <SelectContent>
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
                            <SelectContent>
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
                            <SelectContent>
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
  );
}
