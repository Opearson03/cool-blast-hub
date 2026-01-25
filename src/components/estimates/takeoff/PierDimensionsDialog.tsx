import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CircleDot, Plus } from 'lucide-react';

interface PierDimensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pierCount: number;
  onConfirm: (diameter: number, depth: number, name: string) => Promise<void>;
  onConfirmAndAddAnother?: (diameter: number, depth: number, name: string) => Promise<void>;
  defaultName?: string;
}

export function PierDimensionsDialog({
  open,
  onOpenChange,
  pierCount,
  onConfirm,
  onConfirmAndAddAnother,
  defaultName = 'P1',
}: PierDimensionsDialogProps) {
  const [name, setName] = useState(defaultName);
  const [diameter, setDiameter] = useState(450);
  const [depth, setDepth] = useState(600);
  const [isSaving, setIsSaving] = useState(false);

  // Sync name with defaultName when dialog opens or defaultName changes
  useEffect(() => {
    if (open) {
      setName(defaultName);
    }
  }, [open, defaultName]);

  const handleConfirm = async () => {
    const groupName = name.trim() || 'P1';
    setIsSaving(true);
    try {
      await onConfirm(diameter, depth, groupName);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAndAddAnother = async () => {
    const groupName = name.trim() || 'P1';
    setIsSaving(true);
    try {
      await onConfirmAndAddAnother?.(diameter, depth, groupName);
      // Auto-increment name for next group (P1 -> P2, etc.)
      const currentNum = parseInt(groupName.replace(/\D/g, '')) || 0;
      setName(`P${currentNum + 1}`);
      // Close dialog to return to drawing mode for next group
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate volume for preview
  const radiusM = (diameter / 1000) / 2;
  const depthM = depth / 1000;
  const singleVolume = Math.PI * radiusM * radiusM * depthM;
  const totalVolume = singleVolume * pierCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-primary" />
            Enter Pier Dimensions
          </DialogTitle>
          <DialogDescription>
            Enter the dimensions for the piers you marked on the plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
          {/* Group name input */}
          <div className="space-y-2">
            <Label htmlFor="pier-name">Group Name</Label>
            <Input
              id="pier-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., P1, P2, Footing Piers"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Name this group of piers (e.g., "P1", "Deck Piers")
            </p>
          </div>

          {/* Pier count display */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Badge variant="default" className="text-base px-3 py-1">
              {pierCount}
            </Badge>
            <span className="text-sm font-medium">
              pier{pierCount !== 1 ? 's' : ''} marked on plan
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
                min={100}
                max={2000}
                step={50}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Common sizes: 300mm, 450mm, 600mm, 750mm
            </p>
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
                min={100}
                max={5000}
                step={100}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mm
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Common depths: 600mm, 900mm, 1200mm, 1500mm
            </p>
          </div>

          {/* Volume preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Volume per pier:</span>
              <span className="font-medium">{singleVolume.toFixed(3)} m³</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total volume ({pierCount} piers):</span>
              <span className="font-medium">{totalVolume.toFixed(3)} m³</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={pierCount === 0 || isSaving}>
            {isSaving ? 'Saving...' : 'Save Piers'}
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother} 
              disabled={pierCount === 0 || isSaving}
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
