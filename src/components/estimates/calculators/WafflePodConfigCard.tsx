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
import { Grid3X3, Ruler } from "lucide-react";

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
  onChange,
}: WafflePodConfigCardProps) {
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
              value={topSlabThickness || ''}
              onChange={(e) => onChange('top_slab_thickness', Number(e.target.value) || 85)}
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
              value={ribWidth || ''}
              onChange={(e) => onChange('rib_width', Number(e.target.value) || 110)}
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
                value={podCount || ''}
                onChange={(e) => onChange('pod_count', Number(e.target.value) || 0)}
                className="h-9"
                min={0}
              />
            </div>

            {/* 4-Way Spacers */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">4-Way Spacers</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={spacer4WayCount || ''}
                onChange={(e) => onChange('spacer_4way_count', Number(e.target.value) || 0)}
                className="h-9"
                min={0}
              />
            </div>

            {/* 2-Way Spacers */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">2-Way Spacers</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={spacer2WayCount || ''}
                onChange={(e) => onChange('spacer_2way_count', Number(e.target.value) || 0)}
                className="h-9"
                min={0}
              />
            </div>

            {/* TM Chairs */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">TM Chairs</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={tmChairsCount || ''}
                onChange={(e) => onChange('tm_chairs_count', Number(e.target.value) || 0)}
                className="h-9"
                min={0}
              />
            </div>

            {/* Bar Chairs */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bar Chairs</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={barChairsCount || ''}
                onChange={(e) => onChange('bar_chairs_count', Number(e.target.value) || 0)}
                className="h-9"
                min={0}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
