import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ruler, Plus } from 'lucide-react';

interface LinearDimensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lengthMeters: number;
  scopeType: string;
  onConfirm: (width: number, height: number) => void;
  onConfirmAndAddAnother?: (width: number, height: number) => void;
}

const SCOPE_LABELS: Record<string, { widthLabel: string; heightLabel: string; widthDefault: number; heightDefault: number }> = {
  strip_footings: { widthLabel: 'Footing Width', heightLabel: 'Footing Depth', widthDefault: 450, heightDefault: 300 },
  retaining_wall_footings: { widthLabel: 'Footing Width', heightLabel: 'Footing Depth', widthDefault: 600, heightDefault: 400 },
  kerbs_channels: { widthLabel: 'Kerb Width', heightLabel: 'Kerb Height', widthDefault: 300, heightDefault: 450 },
  retaining_walls: { widthLabel: 'Wall Thickness', heightLabel: 'Wall Height', widthDefault: 200, heightDefault: 1200 },
};

export function LinearDimensionsDialog({
  open,
  onOpenChange,
  lengthMeters,
  scopeType,
  onConfirm,
  onConfirmAndAddAnother,
}: LinearDimensionsDialogProps) {
  const labels = SCOPE_LABELS[scopeType] || { 
    widthLabel: 'Width', 
    heightLabel: 'Height/Depth', 
    widthDefault: 300, 
    heightDefault: 300 
  };

  const [width, setWidth] = useState(labels.widthDefault);
  const [height, setHeight] = useState(labels.heightDefault);

  const handleConfirm = () => {
    onConfirm(width, height);
    onOpenChange(false);
  };

  const handleConfirmAndAddAnother = () => {
    onConfirmAndAddAnother?.(width, height);
    onOpenChange(false);
  };

  // Calculate volume/area for preview
  const calculations = useMemo(() => {
    const widthM = width / 1000;
    const heightM = height / 1000;
    const volume = lengthMeters * widthM * heightM;
    const surfaceArea = lengthMeters * widthM; // Top/bottom surface
    
    return { volume, surfaceArea };
  }, [lengthMeters, width, height]);

  const getScopeTitle = () => {
    switch (scopeType) {
      case 'strip_footings': return 'Strip Footing';
      case 'retaining_wall_footings': return 'Retaining Wall Footing';
      case 'kerbs_channels': return 'Kerb & Channel';
      case 'retaining_walls': return 'Retaining Wall';
      default: return 'Linear Element';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Enter {getScopeTitle()} Dimensions
          </DialogTitle>
          <DialogDescription>
            You've traced {lengthMeters.toFixed(1)}m of {getScopeTitle().toLowerCase()}. Enter the cross-section dimensions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Length display */}
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">Total Length:</span>
            <span className="text-lg font-bold">{lengthMeters.toFixed(2)} m</span>
          </div>

          {/* Width input */}
          <div className="space-y-2">
            <Label htmlFor="width">{labels.widthLabel}</Label>
            <div className="relative">
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value) || 0)}
                min={50}
                max={2000}
                step={50}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
          </div>

          {/* Height input */}
          <div className="space-y-2">
            <Label htmlFor="height">{labels.heightLabel}</Label>
            <div className="relative">
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value) || 0)}
                min={50}
                max={5000}
                step={50}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
          </div>

          {/* Volume preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cross-section:</span>
              <span className="font-medium">{width}mm × {height}mm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Surface area:</span>
              <span className="font-medium">{calculations.surfaceArea.toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total volume:</span>
              <span className="font-medium">{calculations.volume.toFixed(3)} m³</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={lengthMeters === 0}>
            Save {getScopeTitle()}
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother} 
              disabled={lengthMeters === 0}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Save & Add More
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
