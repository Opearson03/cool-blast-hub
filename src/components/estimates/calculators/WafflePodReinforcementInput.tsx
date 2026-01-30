import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layers } from "lucide-react";

interface WafflePodReinforcementInputProps {
  scopeData: Record<string, any>;
  onScopeDataChange: (key: string, value: any) => void;
}

const BAR_SIZE_OPTIONS = [
  { value: 'N10', label: 'N10' },
  { value: 'N12', label: 'N12' },
  { value: 'N16', label: 'N16' },
  { value: 'N20', label: 'N20' },
];

const MESH_TYPE_OPTIONS = [
  { value: 'SL62', label: 'SL62' },
  { value: 'SL72', label: 'SL72' },
  { value: 'SL82', label: 'SL82' },
  { value: 'SL92', label: 'SL92' },
  { value: 'SL102', label: 'SL102' },
];

const STOCK_LENGTH_OPTIONS = [
  { value: '6', label: '6m' },
  { value: '12', label: '12m' },
];

export function WafflePodReinforcementInput({
  scopeData,
  onScopeDataChange,
}: WafflePodReinforcementInputProps) {
  // Extract values from scopeData
  const ribBottomBars = Number(scopeData?.rib_bottom_bars) || 2;
  const ribBottomBarSize = String(scopeData?.rib_bottom_bar_size || 'N12');
  const ribTopBars = Number(scopeData?.rib_top_bars) || 1;
  const ribTopBarSize = String(scopeData?.rib_top_bar_size || 'N12');
  const stockLength = String(scopeData?.stock_length || '6');
  const toppingMeshType = String(scopeData?.topping_mesh_type || 'SL82');
  const toppingMeshLayers = Number(scopeData?.topping_mesh_layers) || 1;
  const toppingMeshAreaMode = String(scopeData?.topping_mesh_area_mode || 'pod_field');
  const toppingMeshCustomArea = Number(scopeData?.topping_mesh_custom_area) || 0;
  const toppingMeshLapPercent = Number(scopeData?.topping_mesh_lap_percent) || 12.5;
  const totalArea = Number(scopeData?.area) || 0;
  const volumeBreakdown = scopeData?.volumeBreakdown;

  const handleChange = (field: string, value: any) => {
    onScopeDataChange(field, value);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Waffle Pod Reinforcement</span>
      </div>

      {/* Rib Reinforcement Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rib Reinforcement
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Bottom Bars Count */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Bottom Bars</Label>
            <Select value={String(ribBottomBars)} onValueChange={(v) => handleChange('rib_bottom_bars', Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bottom Bar Size */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Bottom Size</Label>
            <Select value={ribBottomBarSize} onValueChange={(v) => handleChange('rib_bottom_bar_size', v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAR_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Top Bars Count */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Top Bars</Label>
            <Select value={String(ribTopBars)} onValueChange={(v) => handleChange('rib_top_bars', Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Top Bar Size */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Top Size</Label>
            <Select value={ribTopBarSize} onValueChange={(v) => handleChange('rib_top_bar_size', v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAR_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Stock Length */}
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Stock Length:</Label>
          <RadioGroup
            value={stockLength}
            onValueChange={(v) => handleChange('stock_length', v)}
            className="flex gap-4"
          >
            {STOCK_LENGTH_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-1.5">
                <RadioGroupItem value={opt.value} id={`stock-${opt.value}`} className="h-3.5 w-3.5" />
                <Label htmlFor={`stock-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <Separator />

      {/* Topping Mesh Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Topping Slab Mesh
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mesh Type</Label>
            <Select value={toppingMeshType} onValueChange={(v) => handleChange('topping_mesh_type', v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESH_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Layers</Label>
            <Select value={String(toppingMeshLayers)} onValueChange={(v) => handleChange('topping_mesh_layers', Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Lap %</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={toppingMeshLapPercent}
              onChange={(e) => handleChange('topping_mesh_lap_percent', Number(e.target.value))}
              className="h-9"
              min={0}
              max={30}
              step={0.5}
            />
          </div>
        </div>
        
        {/* Coverage Area Mode */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Coverage Area</Label>
          <RadioGroup
            value={toppingMeshAreaMode}
            onValueChange={(v) => handleChange('topping_mesh_area_mode', v)}
            className="grid grid-cols-1 gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pod_field" id="mesh-pod-field" className="h-3.5 w-3.5" />
                <Label htmlFor="mesh-pod-field" className="text-xs cursor-pointer">Pod field only</Label>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {volumeBreakdown?.podFieldArea_m2?.toFixed(1) || '—'} m²
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="full_slab" id="mesh-full-slab" className="h-3.5 w-3.5" />
                <Label htmlFor="mesh-full-slab" className="text-xs cursor-pointer">Full slab area</Label>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {totalArea?.toFixed(1) || '—'} m²
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="custom" id="mesh-custom" className="h-3.5 w-3.5" />
              <Label htmlFor="mesh-custom" className="text-xs cursor-pointer">Custom:</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={toppingMeshCustomArea === 0 ? '' : toppingMeshCustomArea}
                onChange={(e) => handleChange('topping_mesh_custom_area', Number(e.target.value) || 0)}
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
  );
}
