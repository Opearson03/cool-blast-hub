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
import { Grid3X3, AlertTriangle, Ruler } from "lucide-react";

interface WafflePodConfigInputProps {
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

export function WafflePodConfigInput({
  scopeData,
  onScopeDataChange,
}: WafflePodConfigInputProps) {
  // Extract values from scopeData
  const podSize = String(scopeData?.pod_size || '1090');
  const podThickness = String(scopeData?.pod_thickness || '225');
  const topSlabThickness = Number(scopeData?.top_slab_thickness) || 85;
  const ribWidth = Number(scopeData?.rib_width) || 110;
  const podsX = Number(scopeData?.pods_x) || 0;
  const podsY = Number(scopeData?.pods_y) || 0;
  const nxNyOverride = scopeData?.nx_ny_override || false;
  const podCount = Number(scopeData?.pod_count) || 0;
  const tmChairsCount = Number(scopeData?.tm_chairs_count) || 0;
  const barChairsCount = Number(scopeData?.bar_chairs_count) || 0;
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
          <Badge variant="secondary" className="gap-1 bg-accent text-accent-foreground border-border">
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
            <Badge variant="outline" className="text-xs gap-1 text-warning border-warning/30">
              <AlertTriangle className="h-3 w-3" />
              Grid estimated from area
            </Badge>
          </div>
        )}
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
        
        <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 border border-warning/20">
          <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            These are allowances for quoting. Adjust based on actual site conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
