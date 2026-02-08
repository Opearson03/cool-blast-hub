import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Grid3X3, Ruler, ChevronDown, AlertTriangle, Calculator, Layers } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Volume breakdown from geometric calculation.
 * Each value is in cubic meters (m³) except podFieldArea_m2 which is in m².
 */
export interface VolumeBreakdown {
  topping_m3: number;
  podFieldNet_m3: number;
  voidVolume_m3: number;
  edgeBeams_m3: number;
  internalBeams_m3: number;
  podFieldArea_m2: number;
  total_m3: number;
}

/**
 * Reinforcement breakdown from geometric rib bar calculation.
 */
export interface ReinforcementBreakdown {
  xRibCount: number;
  yRibCount: number;
  xSpanM: number;
  ySpanM: number;
  totalRibLengthM: number;
  bottomBarsTotal: { lengthM: number; weightKg: number; stockQty: number };
  topBarsTotal: { lengthM: number; weightKg: number; stockQty: number };
  meshSheets: number;
  meshAreaM2: number;
  isEstimated: boolean;
}

interface WafflePodConfigCardProps {
  /** Pod size in mm (1050, 1090, 1110) */
  podSize: string;
  /** Pod thickness in mm (225, 275, 325, 375) */
  podThickness: string;
  /** Top slab thickness in mm */
  topSlabThickness: number;
  /** Rib width in mm */
  ribWidth: number;
  /** Number of pods */
  podCount: number;
  /** 4-way spacer count */
  spacer4WayCount: number;
  /** 2-way spacer count */
  spacer2WayCount: number;
  /** TM chairs count */
  tmChairsCount: number;
  /** Whether measurements came from takeoff */
  fromTakeoff?: boolean;
  /** Whether pod count is estimated (not manually entered) */
  podCountEstimated?: boolean;
  /** Volume breakdown from geometric calculation */
  volumeBreakdown?: VolumeBreakdown;
  /** Pod grid dimensions */
  podsX: number;
  podsY: number;
  /** Grid dimensions override toggle */
  nxNyOverride: boolean;
  /** Rib reinforcement config */
  ribBottomBars: number;
  ribBottomBarSize: string;
  ribTopBars: number;
  ribTopBarSize: string;
  stockLength: string;
  /** Topping mesh config */
  toppingMeshType: string;
  toppingMeshLayers: number;
  toppingMeshAreaMode: string;
  toppingMeshCustomArea: number;
  toppingMeshLapPercent: number;
  /** Reinforcement breakdown (calculated) */
  reinforcementBreakdown?: ReinforcementBreakdown;
  /** Total slab area */
  totalArea: number;
  /** Change handler */
  onChange: (field: string, value: any) => void;
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

export function WafflePodConfigCard({
  podSize,
  podThickness,
  topSlabThickness,
  ribWidth,
  podCount,
  spacer4WayCount,
  spacer2WayCount,
  tmChairsCount,
  fromTakeoff = false,
  podCountEstimated = false,
  volumeBreakdown,
  podsX,
  podsY,
  nxNyOverride,
  ribBottomBars,
  ribBottomBarSize,
  ribTopBars,
  ribTopBarSize,
  stockLength,
  toppingMeshType,
  toppingMeshLayers,
  toppingMeshAreaMode,
  toppingMeshCustomArea,
  toppingMeshLapPercent,
  reinforcementBreakdown,
  totalArea,
  onChange,
}: WafflePodConfigCardProps) {
  const [volumeBreakdownOpen, setVolumeBreakdownOpen] = useState(false);
  const [reoBreakdownOpen, setReoBreakdownOpen] = useState(false);
  
  // Calculate total slab height for display
  const totalHeight = (Number(podThickness) || 225) + (topSlabThickness || 85);
  
  // Calculate grid dimensions for display
  const calculatedPodCount = podsX * podsY;
  const hasGridDimensions = podsX > 0 && podsY > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-primary" />
            Waffle Pod Configuration
          </CardTitle>
          {fromTakeoff && (
            <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
              <Ruler className="h-3 w-3" />
              From plans
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pod Specifications */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Pod Size */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Pod Size</Label>
            <Select value={podSize} onValueChange={(v) => onChange('pod_size', v)}>
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
            <Select value={podThickness} onValueChange={(v) => onChange('pod_thickness', v)}>
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
                onChange('top_slab_thickness', val === '' ? 0 : Number(val));
              }}
              onBlur={(e) => {
                if (!e.target.value || Number(e.target.value) < 50) {
                  onChange('top_slab_thickness', 85);
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
                onChange('rib_width', val === '' ? 0 : Number(val));
              }}
              onBlur={(e) => {
                if (!e.target.value || Number(e.target.value) < 100) {
                  onChange('rib_width', 110);
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
                onCheckedChange={(v) => onChange('nx_ny_override', v)}
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
                  onChange('pods_x', val === '' ? 0 : Number(val));
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
                  onChange('pods_y', val === '' ? 0 : Number(val));
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
              <Select value={String(ribBottomBars)} onValueChange={(v) => onChange('rib_bottom_bars', Number(v))}>
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
              <Select value={ribBottomBarSize} onValueChange={(v) => onChange('rib_bottom_bar_size', v)}>
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
              <Select value={String(ribTopBars)} onValueChange={(v) => onChange('rib_top_bars', Number(v))}>
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
              <Select value={ribTopBarSize} onValueChange={(v) => onChange('rib_top_bar_size', v)}>
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
              onValueChange={(v) => onChange('stock_length', v)}
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
              <Select value={toppingMeshType} onValueChange={(v) => onChange('topping_mesh_type', v)}>
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
              <Select value={String(toppingMeshLayers)} onValueChange={(v) => onChange('topping_mesh_layers', Number(v))}>
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
                onChange={(e) => onChange('topping_mesh_lap_percent', Number(e.target.value))}
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
              onValueChange={(v) => onChange('topping_mesh_area_mode', v)}
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
                  onChange={(e) => onChange('topping_mesh_custom_area', Number(e.target.value) || 0)}
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
                  onChange('pod_count', val === '' ? 0 : Number(val));
                }}
                className="h-9"
                min={0}
                placeholder="0"
              />
            </div>

            {/* 4-Way Spacers */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">4-Way Spacers</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={spacer4WayCount === 0 ? '' : spacer4WayCount}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange('spacer_4way_count', val === '' ? 0 : Number(val));
                }}
                className="h-9"
                min={0}
                placeholder="0"
              />
            </div>

            {/* 2-Way Spacers */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">2-Way Spacers</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={spacer2WayCount === 0 ? '' : spacer2WayCount}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange('spacer_2way_count', val === '' ? 0 : Number(val));
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
                  onChange('tm_chairs_count', val === '' ? 0 : Number(val));
                }}
                className="h-9"
                min={0}
                placeholder="0"
              />
              <p className="text-[10px] text-muted-foreground">perimeter ÷ 1.2</p>
            </div>

          </div>
          
          <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              These are allowances for quoting. Adjust based on actual site conditions.
            </p>
          </div>
        </div>

        {/* Reinforcement Breakdown Section */}
        {reinforcementBreakdown && hasGridDimensions && (
          <>
            <Separator />
            <Collapsible open={reoBreakdownOpen} onOpenChange={setReoBreakdownOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-muted/50 rounded-md px-1 -mx-1">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Reinforcement Breakdown
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  reoBreakdownOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <span className="text-muted-foreground">X-direction ribs:</span>
                    <span className="text-right font-mono">{reinforcementBreakdown.xRibCount} × {reinforcementBreakdown.xSpanM.toFixed(2)}m</span>
                    
                    <span className="text-muted-foreground">Y-direction ribs:</span>
                    <span className="text-right font-mono">{reinforcementBreakdown.yRibCount} × {reinforcementBreakdown.ySpanM.toFixed(2)}m</span>
                    
                    <span className="text-muted-foreground">Total rib length:</span>
                    <span className="text-right font-mono">{reinforcementBreakdown.totalRibLengthM.toFixed(1)}m</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <span className="text-muted-foreground">Bottom bars ({ribBottomBarSize} × {ribBottomBars}):</span>
                    <span className="text-right font-mono">
                      {reinforcementBreakdown.bottomBarsTotal.stockQty} × {stockLength}m ({Math.round(reinforcementBreakdown.bottomBarsTotal.weightKg)}kg)
                    </span>
                    
                    {ribTopBars > 0 && (
                      <>
                        <span className="text-muted-foreground">Top bars ({ribTopBarSize} × {ribTopBars}):</span>
                        <span className="text-right font-mono">
                          {reinforcementBreakdown.topBarsTotal.stockQty} × {stockLength}m ({Math.round(reinforcementBreakdown.topBarsTotal.weightKg)}kg)
                        </span>
                      </>
                    )}
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <span className="text-muted-foreground">Topping mesh ({toppingMeshType}):</span>
                    <span className="text-right font-mono">
                      {reinforcementBreakdown.meshSheets} sheets ({reinforcementBreakdown.meshAreaM2.toFixed(1)}m²)
                    </span>
                  </div>
                </div>
                
                {reinforcementBreakdown.isEstimated && (
                  <div className="flex items-start gap-2 mt-3 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Grid dimensions are estimated. Enable override to set exact values.
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Volume Breakdown Section */}
        {volumeBreakdown && (
          <>
            <Separator />
            <Collapsible open={volumeBreakdownOpen} onOpenChange={setVolumeBreakdownOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-muted/50 rounded-md px-1 -mx-1">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Volume Breakdown
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  volumeBreakdownOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <span className="text-muted-foreground">Topping slab:</span>
                    <span className="text-right font-mono">{volumeBreakdown.topping_m3.toFixed(2)} m³</span>
                    
                    <span className="text-muted-foreground">Pod field (net of voids):</span>
                    <span className="text-right font-mono">{volumeBreakdown.podFieldNet_m3.toFixed(2)} m³</span>
                    
                    <span className="text-muted-foreground text-xs pl-3">└ Void deduction:</span>
                    <span className="text-right font-mono text-xs text-muted-foreground">-{volumeBreakdown.voidVolume_m3.toFixed(2)} m³</span>
                    
                    <span className="text-muted-foreground">Edge beams:</span>
                    <span className="text-right font-mono">{volumeBreakdown.edgeBeams_m3.toFixed(2)} m³</span>
                    
                    <span className="text-muted-foreground">Internal beams:</span>
                    <span className="text-right font-mono">{volumeBreakdown.internalBeams_m3.toFixed(2)} m³</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between items-center font-medium">
                    <span>Total (pre-wastage):</span>
                    <span className="font-mono text-base">{volumeBreakdown.total_m3.toFixed(2)} m³</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Pod field area:</span>
                    <span className="font-mono">{volumeBreakdown.podFieldArea_m2.toFixed(1)} m²</span>
                  </div>
                </div>
                
                {/* Warning note */}
                <div className="flex items-start gap-2 mt-3 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Estimator only. Actual volumes may vary based on site conditions and engineering specifications.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Pod count estimation badge - only show if no grid dimensions */}
        {podCountEstimated && podCount > 0 && !hasGridDimensions && (
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-xs gap-1 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
              <AlertTriangle className="h-3 w-3" />
              Pod count is estimated
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
