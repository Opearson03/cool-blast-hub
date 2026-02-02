import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CircleDot, Plus } from 'lucide-react';

interface PierDimensionsPanelProps {
  pierCount: number;
  onConfirm: (diameter: number, depth: number, name: string) => Promise<void>;
  onConfirmAndAddAnother?: (diameter: number, depth: number, name: string) => Promise<void>;
  onCancel: () => void;
  defaultName?: string;
}

export function PierDimensionsPanel({
  pierCount,
  onConfirm,
  onConfirmAndAddAnother,
  onCancel,
  defaultName = 'P1',
}: PierDimensionsPanelProps) {
  const [name, setName] = useState(defaultName);
  const [diameter, setDiameter] = useState(450);
  const [depth, setDepth] = useState(600);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleConfirm = async () => {
    const groupName = name.trim() || 'P1';
    setIsSaving(true);
    try {
      await onConfirm(diameter, depth, groupName);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAndAddAnother = async () => {
    const groupName = name.trim() || 'P1';
    setIsSaving(true);
    try {
      await onConfirmAndAddAnother?.(diameter, depth, groupName);
      const currentNum = parseInt(groupName.replace(/\D/g, '')) || 0;
      setName(`P${currentNum + 1}`);
    } finally {
      setIsSaving(false);
    }
  };

  const radiusM = (diameter / 1000) / 2;
  const depthM = depth / 1000;
  const singleVolume = Math.PI * radiusM * radiusM * depthM;
  const totalVolume = singleVolume * pierCount;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <CircleDot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Enter Pier Dimensions</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enter the dimensions for the piers you marked on the plan.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={pierCount === 0 || isSaving} className="flex-1">
            {isSaving ? 'Saving...' : 'Save Piers'}
          </Button>
        </div>
        {onConfirmAndAddAnother && (
          <Button 
            variant="secondary" 
            onClick={handleConfirmAndAddAnother} 
            disabled={pierCount === 0 || isSaving}
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
