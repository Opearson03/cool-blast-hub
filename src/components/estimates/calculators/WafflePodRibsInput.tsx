import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layers, Grid3X3 } from "lucide-react";

interface WafflePodRibsInputProps {
  scopeData: Record<string, any>;
  onScopeDataChange: (key: string, value: any) => void;
}

const BAR_SIZE_OPTIONS = [
  { value: 'N10', label: 'N10' },
  { value: 'N12', label: 'N12' },
  { value: 'N16', label: 'N16' },
  { value: 'N20', label: 'N20' },
];

const STOCK_LENGTH_OPTIONS = [
  { value: '6', label: '6m' },
  { value: '12', label: '12m' },
];

export function WafflePodRibsInput({
  scopeData,
  onScopeDataChange,
}: WafflePodRibsInputProps) {
  // Extract values from scopeData
  const ribBottomBars = Number(scopeData?.rib_bottom_bars) || 2;
  const ribBottomBarSize = String(scopeData?.rib_bottom_bar_size || 'N12');
  const ribTopBars = Number(scopeData?.rib_top_bars) || 1;
  const ribTopBarSize = String(scopeData?.rib_top_bar_size || 'N12');
  const stockLength = String(scopeData?.stock_length || '6');
  
  // Grid dimensions for summary
  const nx = Number(scopeData?.pods_x) || 0;
  const ny = Number(scopeData?.pods_y) || 0;
  const podCount = Number(scopeData?.pod_count) || 0;

  const handleChange = (field: string, value: any) => {
    onScopeDataChange(field, value);
  };

  // Calculate estimated rib stats
  const xRibCount = ny > 0 ? ny + 1 : 0;
  const yRibCount = nx > 0 ? nx + 1 : 0;
  const totalRibs = xRibCount + yRibCount;

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Grid3X3 className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{totalRibs}</span>
            <span>ribs</span>
            {podCount > 0 && (
              <span className="text-muted-foreground/60">
                ({xRibCount} × X + {yRibCount} × Y from {nx}×{ny} grid)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rib Config Card */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="px-3 py-2.5 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Rib Reinforcement</span>
          </div>
        </div>
        
        <div className="px-3 pb-3 pt-3 space-y-4">
          {/* Bottom Bars Row */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Bottom Bars
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Quantity per Rib</Label>
                <Select 
                  value={String(ribBottomBars)} 
                  onValueChange={(v) => handleChange('rib_bottom_bars', Number(v))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                <Select 
                  value={ribBottomBarSize} 
                  onValueChange={(v) => handleChange('rib_bottom_bar_size', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
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
          </div>
          
          {/* Top Bars Row */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Top Bars
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Quantity per Rib</Label>
                <Select 
                  value={String(ribTopBars)} 
                  onValueChange={(v) => handleChange('rib_top_bars', Number(v))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n === 0 ? 'None' : n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Bar Size</Label>
                <Select 
                  value={ribTopBarSize} 
                  onValueChange={(v) => handleChange('rib_top_bar_size', v)}
                  disabled={ribTopBars === 0}
                >
                  <SelectTrigger className="h-8 text-sm">
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
          </div>
          
          {/* Stock Length Row */}
          <div className="pt-2 border-t space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Stock Length
            </Label>
            <RadioGroup
              value={stockLength}
              onValueChange={(v) => handleChange('stock_length', v)}
              className="flex gap-4"
            >
              {STOCK_LENGTH_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={opt.value} id={`stock-${opt.value}`} className="h-3.5 w-3.5" />
                  <Label htmlFor={`stock-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
