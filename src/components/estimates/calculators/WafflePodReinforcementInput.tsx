import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Grid3X3, AlertTriangle, Ruler } from "lucide-react";

interface WafflePodReinforcementInputProps {
  scopeData: Record<string, any>;
  onScopeDataChange: (key: string, value: any) => void;
}

const POD_SIZE_OPTIONS = [
  { value: '1050', label: '1050 × 1050 mm' },
  { value: '1090', label: '1090 × 1090 mm' },
  { value: '1110', label: '1110 × 1110 mm' },
];

const POD_THICKNESS_OPTIONS = [
  { value: '225', label: '225mm' },
  { value: '275', label: '275mm' },
  { value: '325', label: '325mm' },
  { value: '375', label: '375mm' },
];

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
  const podSize = String(scopeData?.pod_size || '1090');
  const podThickness = String(scopeData?.pod_thickness || '225');
  const topSlabThickness = Number(scopeData?.top_slab_thickness) || 85;
  const ribWidth = Number(scopeData?.rib_width) || 110;
  const podsX = Number(scopeData?.pods_x) || 0;
  const podsY = Number(scopeData?.pods_y) || 0;
  const nxNyOverride = scopeData?.nx_ny_override || false;
  const podCount = Number(scopeData?.pod_count) || 0;
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
  const tmChairsCount = Number(scopeData?.tm_chairs_count) || 0;
  const barChairsCount = Number(scopeData?.bar_chairs_count) || 0;
  const totalArea = Number(scopeData?.area) || 0;
  const volumeBreakdown = scopeData?.volumeBreakdown;
  const fromTakeoff = scopeData?._fromTakeoff;

  // Calculate derived values
  const totalHeight = (Number(podThickness) || 225) + (topSlabThickness || 85);
  const calculatedPodCount = podsX * podsY;
  const hasGridDimensions = podsX > 0 && podsY > 0;

  const handleChange = (field: string, value: any) => {
    onScopeDataChange(field, value);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Waffle Pod Configuration</span>
        </div>
        {fromTakeoff && (
          <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
            <Ruler className="h-3 w-3" />
            From plans
          </Badge>
        )}
      </div>

      {/* Pod Specifications */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pod Size */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Pod Size</Label>
          <Select value={podSize} onValueChange={(v) => handleChange('pod_size', v)}>
            <SelectTrigger className="h-9">
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

        {/* Pod Thickness */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Pod Thickness</Label>
          <Select value={podThickness} onValueChange={(v) => handleChange('pod_thickness', v)}>
            <SelectTrigger className="h-9">
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

        {/* Top Slab Thickness */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Top Slab (mm)</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={topSlabThickness === 0 ? '' : topSlabThickness}
            onChange={(e) => {
              const val = e.target.value;
              handleChange('top_slab_thickness', val === '' ? 0 : Number(val));
            }}
            onBlur={(e) => {
              if (!e.target.value || Number(e.target.value) < 50) {
                handleChange('top_slab_thickness', 85);
              }
            }}
            className="h-9"
            min={50}
            placeholder="85"
          />
        </div>

        {/* Rib Width */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Rib Width (mm)</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={ribWidth === 0 ? '' : ribWidth}
            onChange={(e) => {
              const val = e.target.value;
              handleChange('rib_width', val === '' ? 0 : Number(val));
            }}
            onBlur={(e) => {
              if (!e.target.value || Number(e.target.value) < 100) {
                handleChange('rib_width', 110);
              }
            }}
            className="h-9"
            min={100}
            placeholder="110"
          />
        </div>
      </div>

      {/* Total Height Badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Total Height:</span>
        <Badge variant="outline" className="font-medium">
          {totalHeight}mm
        </Badge>
      </div>

      <Separator />

      {/* Pod Grid Dimensions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pod Grid
          </h4>
          <div className="flex items-center gap-2">
            <Label htmlFor="nx-ny-override" className="text-xs text-muted-foreground cursor-pointer">
              Override
            </Label>
            <Switch
              id="nx-ny-override"
              checked={nxNyOverride}
              onCheckedChange={(v) => handleChange('nx_ny_override', v)}
              className="scale-75"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Pods X</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={podsX === 0 ? '' : podsX}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('pods_x', val === '' ? 0 : Number(val));
              }}
              className="h-9"
              min={0}
              placeholder="0"
              disabled={!nxNyOverride}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Pods Y</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={podsY === 0 ? '' : podsY}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('pods_y', val === '' ? 0 : Number(val));
              }}
              className="h-9"
              min={0}
              placeholder="0"
              disabled={!nxNyOverride}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">= Pods</Label>
            <div className="h-9 flex items-center px-3 bg-muted/30 rounded-md border text-sm font-mono">
              {hasGridDimensions ? calculatedPodCount : podCount || '—'}
            </div>
          </div>
        </div>
        
        {!hasGridDimensions && podCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
              <AlertTriangle className="h-3 w-3" />
              Grid estimated from area
            </Badge>
          </div>
        )}
      </div>

      <Separator />

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

      <Separator />

      {/* Accessories Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Accessories
          </h4>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
            Allowances
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Pod Count */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Pods</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={podCount === 0 ? '' : podCount}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('pod_count', val === '' ? 0 : Number(val));
              }}
              className="h-9"
              min={0}
              placeholder="0"
            />
          </div>

          {/* TM Chairs */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">TM Chairs</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={tmChairsCount === 0 ? '' : tmChairsCount}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('tm_chairs_count', val === '' ? 0 : Number(val));
              }}
              className="h-9"
              min={0}
              placeholder="0"
            />
            <p className="text-[10px] text-muted-foreground">perimeter ÷ 1.2</p>
          </div>

          {/* Bar Chairs / Pod Rails */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Bar Chairs</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={barChairsCount === 0 ? '' : barChairsCount}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('bar_chairs_count', val === '' ? 0 : Number(val));
              }}
              className="h-9"
              min={0}
              placeholder="0"
            />
            <p className="text-[10px] text-muted-foreground">pods × 3</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            These are allowances for quoting. Adjust based on actual site conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
