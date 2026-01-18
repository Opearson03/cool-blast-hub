import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Square, Plus } from 'lucide-react';

interface PadFootingDimensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  padCount: number;
  scopeType: 'pad_footings' | 'pit_bases';
  onConfirm: (length: number, width: number, depth: number) => void;
  onConfirmAndAddAnother?: (length: number, width: number, depth: number) => void;
}

export function PadFootingDimensionsDialog({
  open,
  onOpenChange,
  padCount,
  scopeType,
  onConfirm,
  onConfirmAndAddAnother,
}: PadFootingDimensionsDialogProps) {
  const isPitBase = scopeType === 'pit_bases';
  
  const [length, setLength] = useState(isPitBase ? 600 : 450);
  const [width, setWidth] = useState(isPitBase ? 600 : 450);
  const [depth, setDepth] = useState(isPitBase ? 150 : 300);

  const handleConfirm = () => {
    onConfirm(length, width, depth);
    onOpenChange(false);
  };

  const handleConfirmAndAddAnother = () => {
    onConfirmAndAddAnother?.(length, width, depth);
    onOpenChange(false);
  };

  // Calculate volume for preview
  const singleVolume = (length / 1000) * (width / 1000) * (depth / 1000);
  const totalVolume = singleVolume * padCount;

  const title = isPitBase ? 'Pit Base' : 'Pad Footing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Square className="h-5 w-5 text-primary" />
            Enter {title} Dimensions
          </DialogTitle>
          <DialogDescription>
            Enter the dimensions for the {title.toLowerCase()}s you marked on the plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Count display */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Badge variant="default" className="text-base px-3 py-1">
              {padCount}
            </Badge>
            <span className="text-sm font-medium">
              {title.toLowerCase()}{padCount !== 1 ? 's' : ''} marked on plan
            </span>
          </div>

          {/* Length input */}
          <div className="space-y-2">
            <Label htmlFor="length">Length</Label>
            <div className="relative">
              <Input
                id="length"
                type="number"
                value={length}
                onChange={(e) => setLength(Number(e.target.value) || 0)}
                min={100}
                max={5000}
                step={50}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
            {!isPitBase && (
              <p className="text-xs text-muted-foreground">
                Common sizes: 450mm, 600mm, 750mm, 900mm
              </p>
            )}
          </div>

          {/* Width input */}
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <div className="relative">
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value) || 0)}
                min={100}
                max={5000}
                step={50}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
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
            {!isPitBase && (
              <p className="text-xs text-muted-foreground">
                Common depths: 300mm, 450mm, 600mm
              </p>
            )}
          </div>

          {/* Volume preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dimensions:</span>
              <span className="font-medium">{length}mm × {width}mm × {depth}mm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Volume per {title.toLowerCase()}:</span>
              <span className="font-medium">{singleVolume.toFixed(4)} m³</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total volume ({padCount}):</span>
              <span className="font-medium">{totalVolume.toFixed(3)} m³</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={padCount === 0}>
            Save {title}s
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother} 
              disabled={padCount === 0}
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
