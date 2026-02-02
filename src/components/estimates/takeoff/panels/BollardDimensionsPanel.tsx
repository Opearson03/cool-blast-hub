import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CircleDot, Plus } from 'lucide-react';

interface BollardDimensionsPanelProps {
  bollardCount: number;
  onConfirm: (diameter: number, height: number, embedment: number) => void;
  onConfirmAndAddAnother?: (diameter: number, height: number, embedment: number) => void;
  onCancel: () => void;
}

export function BollardDimensionsPanel({
  bollardCount,
  onConfirm,
  onConfirmAndAddAnother,
  onCancel,
}: BollardDimensionsPanelProps) {
  const [diameter, setDiameter] = useState(150);
  const [height, setHeight] = useState(1000);
  const [embedment, setEmbedment] = useState(300);

  const handleConfirm = () => {
    onConfirm(diameter, height, embedment);
  };

  const handleConfirmAndAddAnother = () => {
    onConfirmAndAddAnother?.(diameter, height, embedment);
  };

  const radiusM = (diameter / 1000) / 2;
  const totalHeight = (height + embedment) / 1000;
  const singleVolume = Math.PI * radiusM * radiusM * totalHeight;
  const totalVolume = singleVolume * bollardCount;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <CircleDot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Enter Bollard Dimensions</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enter the dimensions for the bollards you marked on the plan.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={bollardCount === 0} className="flex-1">
            Save Bollards
          </Button>
        </div>
        {onConfirmAndAddAnother && (
          <Button 
            variant="secondary" 
            onClick={handleConfirmAndAddAnother} 
            disabled={bollardCount === 0}
            className="gap-1 w-full"
          >
            <Plus className="h-4 w-4" />
            Save & Add More
          </Button>
        )}
      </div>
    </div>
  );
}
