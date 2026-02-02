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
import { Grid3X3, Ruler, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { cn, numericWithDefault } from "@/lib/utils";

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

  // Extract values from scopeData - using numericWithDefault to preserve 0
  const podSize = String(scopeData?.pod_size || '1090');
  const podThickness = String(scopeData?.pod_thickness || '225');
  const topSlabThickness = numericWithDefault(scopeData?.top_slab_thickness, 85);
  const ribWidth = numericWithDefault(scopeData?.rib_width, 110);
  const podCount = numericWithDefault(scopeData?.pod_count, 0);
  // Prefer takeoff-measured perimeter when available so spacer formulas work on plan-based takeoffs.
  const perimeter = numericWithDefault(scopeData?._actualPerimeter ?? scopeData?.perimeter, 0);
  const fromTakeoff = scopeData?._fromTakeoff;

  // Calculate derived values
  const totalHeight = (Number(podThickness) || 225) + (topSlabThickness || 85);

  // Auto-derive accessory quantities when podCount or perimeter changes
  // Using boss's formulas:
  // - 4-Way Spacers: pods × 1
  // - 2-Way Spacers: inside perimeter / 1.2
  // - Pod Rails: pods × 2 (then divide by 20 for packs)
  useEffect(() => {
    if (podCount > 0) {
      // 4-Way Spacers: pods × 1
      const spacer4Way = podCount;
      
      // 2-Way Spacers: inside perimeter / 1.2
      // Inside perimeter is approximately perimeter minus edge beam corners
      const edgeBeamWidth = Number(scopeData?.edgeBeams?.[0]?.width) || 450;
      const insidePerimeter = Math.max(0, perimeter - (8 * edgeBeamWidth / 1000));
      const spacer2Way = perimeter > 0 ? Math.ceil(insidePerimeter / 1.2) : 0;
      
      // Pod Rails: pods × 2, then packs of 20
      const podRailUnits = podCount * 2;
      const podRailPacks = Math.ceil(podRailUnits / 20);
      
      // Only update if values actually differ to prevent infinite loops
      if (scopeData?.spacer_4way_count !== spacer4Way) {
        onScopeDataChange('spacer_4way_count', spacer4Way);
      }
      if (scopeData?.spacer_2way_count !== spacer2Way && spacer2Way > 0) {
        onScopeDataChange('spacer_2way_count', spacer2Way);
      }
      if (scopeData?.pod_rail_packs !== podRailPacks) {
        onScopeDataChange('pod_rail_packs', podRailPacks);
        onScopeDataChange('pod_rails_required', true);
      }
    }
  }, [podCount, perimeter, scopeData?.edgeBeams, scopeData?.spacer_4way_count, scopeData?.spacer_2way_count, scopeData?.pod_rail_packs, onScopeDataChange]);

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
                {podCount} pods • {totalHeight}mm
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
                  value={topSlabThickness ?? ""}
                  onChange={(e) => {
                    handleChange('top_slab_thickness', e.target.value === '' ? 0 : Number(e.target.value));
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
                  value={ribWidth ?? ""}
                  onChange={(e) => {
                    handleChange('rib_width', e.target.value === '' ? 0 : Number(e.target.value));
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

            {/* Total Pods */}
            <div className="rounded-md bg-muted/30 p-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Pods</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={podCount ?? ""}
                  onChange={(e) => {
                    handleChange('pod_count', e.target.value === '' ? 0 : Number(e.target.value));
                  }}
                  className="h-8 text-sm font-mono max-w-32"
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
