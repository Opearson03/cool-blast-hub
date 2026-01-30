import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Grid3X3, Ruler, ChevronDown, AlertTriangle, Calculator } from "lucide-react";
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
  /** Bar chairs count */
  barChairsCount: number;
  /** Whether measurements came from takeoff */
  fromTakeoff?: boolean;
  /** Whether pod count is estimated (not manually entered) */
  podCountEstimated?: boolean;
  /** Volume breakdown from geometric calculation */
  volumeBreakdown?: VolumeBreakdown;
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

export function WafflePodConfigCard({
  podSize,
  podThickness,
  topSlabThickness,
  ribWidth,
  podCount,
  spacer4WayCount,
  spacer2WayCount,
  tmChairsCount,
  barChairsCount,
  fromTakeoff = false,
  podCountEstimated = false,
  volumeBreakdown,
  onChange,
}: WafflePodConfigCardProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  
  // Calculate total slab height for display
  const totalHeight = (Number(podThickness) || 225) + (topSlabThickness || 85);

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

        {/* Accessories Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Accessories (auto-calculated)
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
            </div>

            {/* Pod Rails */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pod Rails</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={barChairsCount === 0 ? '' : barChairsCount}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange('bar_chairs_count', val === '' ? 0 : Number(val));
                }}
                className="h-9"
                min={0}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Volume Breakdown Section */}
        {volumeBreakdown && (
          <>
            <Separator />
            <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-muted/50 rounded-md px-1 -mx-1">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Volume Breakdown
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  breakdownOpen && "rotate-180"
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

        {/* Pod count estimation badge */}
        {podCountEstimated && podCount > 0 && (
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
