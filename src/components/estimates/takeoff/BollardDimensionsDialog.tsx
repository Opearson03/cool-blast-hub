import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CircleDot, Plus } from 'lucide-react';

interface BollardDimensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bollardCount: number;
  onConfirm: (diameter: number, height: number, embedment: number) => void;
  onConfirmAndAddAnother?: (diameter: number, height: number, embedment: number) => void;
}

export function BollardDimensionsDialog({
  open,
  onOpenChange,
  bollardCount,
  onConfirm,
  onConfirmAndAddAnother,
}: BollardDimensionsDialogProps) {
  const [diameter, setDiameter] = useState(150);
  const [height, setHeight] = useState(1000);
  const [embedment, setEmbedment] = useState(300);

  const handleConfirm = () => {
    onConfirm(diameter, height, embedment);
    onOpenChange(false);
  };

  const handleConfirmAndAddAnother = () => {
    onConfirmAndAddAnother?.(diameter, height, embedment);
    onOpenChange(false);
  };

  // Calculate volume for preview (cylindrical bollard)
  const radiusM = (diameter / 1000) / 2;
  const totalHeight = (height + embedment) / 1000;
  const singleVolume = Math.PI * radiusM * radiusM * totalHeight;
  const totalVolume = singleVolume * bollardCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-primary" />
            Enter Bollard Dimensions
          </DialogTitle>
          <DialogDescription>
            Enter the dimensions for the bollards you marked on the plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bollard count display */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Badge variant="default" className="text-base px-3 py-1">
              {bollardCount}
            </Badge>
            <span className="text-sm font-medium">
              bollard{bollardCount !== 1 ? 's' : ''} marked on plan
            </span>
          </div>

          {/* Diameter input */}
          <div className="space-y-2">
            <Label htmlFor="diameter">Diameter</Label>
            <div className="relative">
              <Input
                id="diameter"
                type="number"
                value={diameter}
                onChange={(e) => setDiameter(Number(e.target.value) || 0)}
                min={50}
                max={500}
                step={10}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Common sizes: 100mm, 150mm, 200mm
            </p>
          </div>

          {/* Height above ground input */}
          <div className="space-y-2">
            <Label htmlFor="height">Height Above Ground</Label>
            <div className="relative">
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value) || 0)}
                min={300}
                max={2000}
                step={100}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Common heights: 900mm, 1000mm, 1200mm
            </p>
          </div>

          {/* Embedment depth input */}
          <div className="space-y-2">
            <Label htmlFor="embedment">Embedment Depth</Label>
            <div className="relative">
              <Input
                id="embedment"
                type="number"
                value={embedment}
                onChange={(e) => setEmbedment(Number(e.target.value) || 0)}
                min={100}
                max={1000}
                step={50}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Depth below ground level
            </p>
          </div>

          {/* Volume preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total height (above + below):</span>
              <span className="font-medium">{height + embedment} mm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Concrete per bollard:</span>
              <span className="font-medium">{singleVolume.toFixed(4)} m³</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total concrete ({bollardCount} bollards):</span>
              <span className="font-medium">{totalVolume.toFixed(3)} m³</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={bollardCount === 0}>
            Save Bollards
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother} 
              disabled={bollardCount === 0}
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
