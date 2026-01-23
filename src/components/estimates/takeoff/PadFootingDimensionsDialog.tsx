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
  onConfirm: (length: number, width: number, depth: number, name: string) => void;
  onConfirmAndAddAnother?: (length: number, width: number, depth: number, name: string) => void;
  defaultName?: string;
}

export function PadFootingDimensionsDialog({
  open,
  onOpenChange,
  padCount,
  scopeType,
  onConfirm,
  onConfirmAndAddAnother,
  defaultName = '',
}: PadFootingDimensionsDialogProps) {
  const isPitBase = scopeType === 'pit_bases';
  
  const [length, setLength] = useState(isPitBase ? 600 : 450);
  const [width, setWidth] = useState(isPitBase ? 600 : 450);
  const [depth, setDepth] = useState(isPitBase ? 150 : 300);
  const [name, setName] = useState(defaultName);

  // Reset name when dialog opens with new default
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(defaultName);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    const groupName = name.trim() || (isPitBase ? 'Pit Base Group' : 'Pad Footing Group');
    onConfirm(length, width, depth, groupName);
    onOpenChange(false);
  };

  const handleConfirmAndAddAnother = () => {
    const groupName = name.trim() || (isPitBase ? 'Pit Base Group' : 'Pad Footing Group');
    onConfirmAndAddAnother?.(length, width, depth, groupName);
    // Reset name for next group
    setName(`${isPitBase ? 'Pit Bases' : 'Pad Footings'} ${Date.now().toString().slice(-4)}`);
  };

  // Calculate volume for preview
  const singleVolume = (length / 1000) * (width / 1000) * (depth / 1000);
  const totalVolume = singleVolume * padCount;

  const title = isPitBase ? 'Pit Base' : 'Pad Footing';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Square className="h-5 w-5 text-primary" />
            Enter {title} Dimensions
          </DialogTitle>
          <DialogDescription>
            Enter the dimensions for the {title.toLowerCase()}s you marked on the plan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Group name input */}
          <div className="space-y-2">
            <Label htmlFor="pad-name">Group Name</Label>
            <Input
              id="pad-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g., ${isPitBase ? 'Stormwater Pits' : 'Column Footings'}`}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Name this group of {title.toLowerCase()}s (e.g., "{isPitBase ? 'Stormwater Pits' : 'Column A Footings'}")
            </p>
          </div>

          {/* Count display */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Badge variant="default" className="text-base px-3 py-1">
              {padCount}
            </Badge>
            <span className="text-sm font-medium">
              {title.toLowerCase()}{padCount !== 1 ? 's' : ''} marked on plan
            </span>
          </div>

          {/* Dimensions grid - 2 columns on mobile for L/W */}
          <div className="grid grid-cols-2 gap-3">
            {/* Length input */}
            <div className="space-y-1.5">
              <Label htmlFor="length" className="text-sm">Length</Label>
              <div className="relative">
                <Input
                  id="length"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value) || 0)}
                  min={100}
                  max={5000}
                  step={50}
                  className="pr-10"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm
                </span>
              </div>
            </div>

            {/* Width input */}
            <div className="space-y-1.5">
              <Label htmlFor="width" className="text-sm">Width</Label>
              <div className="relative">
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 0)}
                  min={100}
                  max={5000}
                  step={50}
                  className="pr-10"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm
                </span>
              </div>
            </div>
          </div>

          {/* Depth input - full width */}
          <div className="space-y-1.5">
            <Label htmlFor="depth" className="text-sm">Depth</Label>
            <div className="relative">
              <Input
                id="depth"
                type="number"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value) || 0)}
                min={50}
                max={2000}
                step={50}
                className="pr-10"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                mm
              </span>
            </div>
            {!isPitBase && (
              <p className="text-xs text-muted-foreground">
                Common: 300, 450, 600mm
              </p>
            )}
          </div>

          {/* Volume preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{length} × {width} × {depth}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total vol ({padCount}):</span>
              <span className="font-medium">{totalVolume.toFixed(3)} m³</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={padCount === 0} className="w-full sm:w-auto">
            Save {title}s
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother} 
              disabled={padCount === 0}
              className="gap-1 w-full sm:w-auto"
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
