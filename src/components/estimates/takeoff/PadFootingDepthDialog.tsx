import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Square, Plus } from 'lucide-react';

interface PadFootingDepthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaSquareMeters: number;
  defaultName: string;
  onConfirm: (depth: number, name: string) => void;
  onConfirmAndAddAnother?: (depth: number, name: string) => void;
}

export function PadFootingDepthDialog({
  open,
  onOpenChange,
  areaSquareMeters,
  defaultName,
  onConfirm,
  onConfirmAndAddAnother,
}: PadFootingDepthDialogProps) {
  const [depth, setDepth] = useState(300);
  const [name, setName] = useState(defaultName);

  // Reset name when dialog opens with new default
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(defaultName);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    onConfirm(depth, name.trim() || defaultName);
    onOpenChange(false);
  };

  const handleConfirmAndAddAnother = () => {
    onConfirmAndAddAnother?.(depth, name.trim() || defaultName);
    onOpenChange(false);
  };

  // Calculate volume from drawn area and entered depth
  const volume = areaSquareMeters * (depth / 1000);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Square className="h-5 w-5 text-primary" />
            Pad Footing Details
          </DialogTitle>
          <DialogDescription>
            Enter a name and depth for this pad footing. The area is calculated from your drawing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="pad-name">Name</Label>
            <Input
              id="pad-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pad 1, Column A1"
            />
          </div>

          {/* Area display (read-only from drawing) */}
          <div className="space-y-2">
            <Label>Area (from plan)</Label>
            <div className="p-3 bg-muted rounded-lg">
              <span className="font-medium">{areaSquareMeters.toFixed(2)} m²</span>
            </div>
          </div>

          {/* Depth input */}
          <div className="space-y-2">
            <Label htmlFor="depth">Depth</Label>
            <div className="relative">
              <Input
                id="depth"
                type="number"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value) || 0)}
                min={50}
                max={2000}
                step={50}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Common depths: 300mm, 450mm, 600mm
            </p>
          </div>

          {/* Volume preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Area:</span>
              <span className="font-medium">{areaSquareMeters.toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Depth:</span>
              <span className="font-medium">{depth} mm</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-1 mt-1">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{volume.toFixed(3)} m³</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Save Pad Footing
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother}
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
