import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Square, Plus, Layers, Ruler } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Square className="h-4 w-4 text-primary" />
            </div>
            {title} Dimensions
          </DialogTitle>
          <DialogDescription className="text-sm">
            Set the dimensions for the {title.toLowerCase()}s you marked.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Count badge - prominent */}
          <div className="flex items-center gap-3 p-3.5 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
              {padCount}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {title}{padCount !== 1 ? 's' : ''} marked
              </p>
              <p className="text-xs text-muted-foreground">on plan</p>
            </div>
            <Layers className="h-5 w-5 text-primary/60" />
          </div>

          {/* Group name input */}
          <div className="space-y-2">
            <Label htmlFor="pad-name" className="text-sm font-medium">Group Name</Label>
            <Input
              id="pad-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isPitBase ? 'e.g., Stormwater Pits' : 'e.g., Column A Footings'}
              className="h-11"
              autoFocus
            />
          </div>

          {/* Dimensions section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Dimensions</span>
            </div>
            
            {/* 3-column grid for L × W × D */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Length */}
              <div className="space-y-1.5">
                <Label htmlFor="length" className="text-xs text-muted-foreground">Length</Label>
                <div className="relative">
                  <Input
                    id="length"
                    type="number"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value) || 0)}
                    min={100}
                    max={5000}
                    step={50}
                    className="h-11 pr-9 text-center font-medium"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    mm
                  </span>
                </div>
              </div>

              {/* Width */}
              <div className="space-y-1.5">
                <Label htmlFor="width" className="text-xs text-muted-foreground">Width</Label>
                <div className="relative">
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value) || 0)}
                    min={100}
                    max={5000}
                    step={50}
                    className="h-11 pr-9 text-center font-medium"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    mm
                  </span>
                </div>
              </div>

              {/* Depth */}
              <div className="space-y-1.5">
                <Label htmlFor="depth" className="text-xs text-muted-foreground">Depth</Label>
                <div className="relative">
                  <Input
                    id="depth"
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value) || 0)}
                    min={50}
                    max={2000}
                    step={50}
                    className="h-11 pr-9 text-center font-medium"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    mm
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Volume summary card */}
          <div className="rounded-xl bg-muted/50 border border-border/50 overflow-hidden">
            <div className="px-4 py-3 bg-muted/80 border-b border-border/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Each {title.toLowerCase()}</span>
                <span className="font-mono font-medium">{length} × {width} × {depth}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Volume per unit</span>
                <span className="font-mono">{singleVolume.toFixed(4)} m³</span>
              </div>
              <div className="h-px bg-border/50 my-1" />
              <div className="flex justify-between items-center">
                <span className="font-medium">Total volume</span>
                <span className="font-mono font-bold text-primary">{totalVolume.toFixed(3)} m³</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-5 py-4 border-t border-border/50 bg-muted/30 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={padCount === 0} className="flex-1 sm:flex-none">
            Save {title}s
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother} 
              disabled={padCount === 0}
              className="gap-1.5 flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              Add More
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
