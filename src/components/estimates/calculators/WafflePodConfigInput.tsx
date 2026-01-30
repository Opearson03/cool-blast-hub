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
import { Grid3X3, AlertTriangle, Ruler, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface WafflePodConfigInputProps {
  scopeData: Record<string, any>;
  onScopeDataChange: (key: string, value: any) => void;
}

const POD_SIZE_OPTIONS = [
  { value: '1050', label: '1050mm' },
  { value: '1090', label: '1090mm' },
  { value: '1110', label: '1110mm' },
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
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract values from scopeData
  const podSize = String(scopeData?.pod_size || '1090');
  const podThickness = String(scopeData?.pod_thickness || '225');
  const topSlabThickness = Number(scopeData?.top_slab_thickness) || 85;
  const ribWidth = Number(scopeData?.rib_width) || 110;
  const podsX = Number(scopeData?.pods_x) || 0;
  const podsY = Number(scopeData?.pods_y) || 0;
  const nxNyOverride = scopeData?.nx_ny_override || false;
  const podCount = Number(scopeData?.pod_count) || 0;
  const fromTakeoff = scopeData?._fromTakeoff;

  // Calculate derived values
  const totalHeight = (Number(podThickness) || 225) + (topSlabThickness || 85);
  const calculatedPodCount = podsX * podsY;
  const hasGridDimensions = podsX > 0 && podsY > 0;
  const displayPodCount = hasGridDimensions ? calculatedPodCount : podCount;

  const handleChange = (field: string, value: any) => {
    onScopeDataChange(field, value);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-lg border bg-card">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Pod Specifications</span>
              {fromTakeoff && (
                <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                  <Ruler className="h-3 w-3" />
                  Plans
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {displayPodCount} pods • {totalHeight}mm
              </Badge>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-3 space-y-4">
            {/* Pod Specifications Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Pod Size</Label>
                <Select value={podSize} onValueChange={(v) => handleChange('pod_size', v)}>
                  <SelectTrigger className="h-8 text-sm">
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

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Pod Depth</Label>
                <Select value={podThickness} onValueChange={(v) => handleChange('pod_thickness', v)}>
                  <SelectTrigger className="h-8 text-sm">
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

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Topping</Label>
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
                  className="h-8 text-sm"
                  min={50}
                  placeholder="85mm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Rib Width</Label>
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
                  className="h-8 text-sm"
                  min={100}
                  placeholder="110mm"
                />
              </div>
            </div>

            {/* Pod Grid Section */}
            <div className="rounded-md bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Pod Grid
                </span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="nx-ny-override" className="text-[10px] text-muted-foreground cursor-pointer">
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
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Pods X</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={podsX === 0 ? '' : podsX}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('pods_x', val === '' ? 0 : Number(val));
                    }}
                    className="h-8 text-sm"
                    min={0}
                    placeholder="0"
                    disabled={!nxNyOverride}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Pods Y</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={podsY === 0 ? '' : podsY}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('pods_y', val === '' ? 0 : Number(val));
                    }}
                    className="h-8 text-sm"
                    min={0}
                    placeholder="0"
                    disabled={!nxNyOverride}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Total Pods</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={podCount === 0 ? '' : podCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('pod_count', val === '' ? 0 : Number(val));
                    }}
                    className="h-8 text-sm font-mono"
                    min={0}
                    placeholder="0"
                  />
                </div>
              </div>
              
              {!hasGridDimensions && podCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] gap-1 text-warning border-warning/30">
                    <AlertTriangle className="h-3 w-3" />
                    Grid estimated from area
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
