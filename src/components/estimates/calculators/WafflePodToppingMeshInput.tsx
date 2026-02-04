import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layers } from "lucide-react";
import { numericWithDefault } from "@/lib/utils";

interface WafflePodToppingMeshInputProps {
  scopeData: Record<string, any>;
  onScopeDataChange: (key: string, value: any) => void;
}

const MESH_TYPE_OPTIONS = [
  { value: 'SL62', label: 'SL62' },
  { value: 'SL72', label: 'SL72' },
  { value: 'SL82', label: 'SL82' },
  { value: 'SL92', label: 'SL92' },
  { value: 'SL102', label: 'SL102' },
];

export function WafflePodToppingMeshInput({
  scopeData,
  onScopeDataChange,
}: WafflePodToppingMeshInputProps) {
  // Extract values from scopeData - using numericWithDefault to preserve 0
  const toppingMeshType = String(scopeData?.topping_mesh_type || 'SL82');
  const toppingMeshLayers = numericWithDefault(scopeData?.topping_mesh_layers, 1);
  const toppingMeshAreaMode = String(scopeData?.topping_mesh_area_mode || 'full_slab');
  const toppingMeshCustomArea = numericWithDefault(scopeData?.topping_mesh_custom_area, 0);
  const toppingMeshLapPercent = numericWithDefault(scopeData?.topping_mesh_lap_percent, 12.5);
  const totalArea = numericWithDefault(scopeData?.area, 0);
  const volumeBreakdown = scopeData?.volumeBreakdown;
  const podFieldArea = volumeBreakdown?.podFieldArea_m2 || totalArea * 0.85;

  const handleChange = (field: string, value: any) => {
    onScopeDataChange(field, value);
  };

  // Calculate sheets for summary
  const sheetArea = 14.4;
  const lapMultiplier = 1 + (toppingMeshLapPercent / 100);
  let coverageArea = podFieldArea;
  if (toppingMeshAreaMode === 'full_slab') coverageArea = totalArea;
  if (toppingMeshAreaMode === 'custom') coverageArea = toppingMeshCustomArea;
  const estimatedSheets = Math.ceil((coverageArea * lapMultiplier * toppingMeshLayers) / sheetArea);

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{estimatedSheets}</span>
            <span>sheets</span>
            <span className="text-muted-foreground/60">
              ({toppingMeshType} × {toppingMeshLayers}L • {coverageArea.toFixed(1)} m²)
            </span>
          </div>
        </div>
      </div>

      {/* Mesh Config Card */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="px-3 py-2.5 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Topping Slab Mesh</span>
            </div>
            <Badge variant="secondary" className="text-[11px] h-5 bg-primary/10 text-primary">
              {toppingMeshType}
            </Badge>
          </div>
        </div>
        
        <div className="px-3 pb-3 pt-3 space-y-4">
          {/* Mesh Type & Layers Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Mesh Type</Label>
              <Select 
                value={toppingMeshType} 
                onValueChange={(v) => handleChange('topping_mesh_type', v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESH_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Layers</Label>
              <Select 
                value={String(toppingMeshLayers)} 
                onValueChange={(v) => handleChange('topping_mesh_layers', Number(v))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Layer</SelectItem>
                  <SelectItem value="2">2 Layers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Lap %</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={toppingMeshLapPercent}
                onChange={(e) => handleChange('topping_mesh_lap_percent', Number(e.target.value))}
                className="h-8 text-sm"
                min={0}
                max={30}
                step={0.5}
              />
            </div>
          </div>
          
          {/* Coverage Area Mode */}
          <div className="pt-2 border-t space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Coverage Area
            </Label>
            <RadioGroup
              value={toppingMeshAreaMode}
              onValueChange={(v) => handleChange('topping_mesh_area_mode', v)}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pod_field" id="mesh-pod-field" className="h-3.5 w-3.5" />
                  <Label htmlFor="mesh-pod-field" className="text-sm cursor-pointer">Pod field only</Label>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {podFieldArea.toFixed(1)} m²
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="full_slab" id="mesh-full-slab" className="h-3.5 w-3.5" />
                  <Label htmlFor="mesh-full-slab" className="text-sm cursor-pointer">Full slab area</Label>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {totalArea.toFixed(1)} m²
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="custom" id="mesh-custom" className="h-3.5 w-3.5" />
                <Label htmlFor="mesh-custom" className="text-sm cursor-pointer">Custom:</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={toppingMeshCustomArea ?? ""}
                  onChange={(e) => handleChange('topping_mesh_custom_area', e.target.value === "" ? 0 : Number(e.target.value))}
                  className="h-7 w-20 text-xs"
                  placeholder="m²"
                  disabled={toppingMeshAreaMode !== 'custom'}
                />
                <span className="text-xs text-muted-foreground">m²</span>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
