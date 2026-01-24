import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ruler, Plus } from 'lucide-react';

// Scope-specific type prefixes
export const LINEAR_TYPE_PREFIXES: Record<string, string> = {
  strip_footings: 'SF',
  retaining_wall_footings: 'RF',
  kerbs_channels: 'K',
  retaining_walls: 'RW',
};

interface LinearDimensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lengthMeters: number;
  scopeType: string;
  defaultName?: string;
  onConfirm: (name: string, width: number, height: number, toe?: number) => Promise<void>;
  onConfirmAndAddAnother?: (name: string, width: number, height: number, toe?: number) => Promise<void>;
}

const SCOPE_LABELS: Record<string, { 
  widthLabel: string; 
  heightLabel: string; 
  widthDefault: number; 
  heightDefault: number;
  showToe?: boolean;
  toeDefault?: number;
}> = {
  strip_footings: { widthLabel: 'Footing Width', heightLabel: 'Footing Depth', widthDefault: 450, heightDefault: 300 },
  retaining_wall_footings: { widthLabel: 'Footing Width', heightLabel: 'Footing Depth', widthDefault: 600, heightDefault: 400, showToe: true, toeDefault: 300 },
  kerbs_channels: { widthLabel: 'Kerb Width', heightLabel: 'Kerb Height', widthDefault: 300, heightDefault: 450 },
  retaining_walls: { widthLabel: 'Wall Thickness', heightLabel: 'Wall Height', widthDefault: 200, heightDefault: 1200, showToe: true, toeDefault: 300 },
};

export function LinearDimensionsDialog({
  open,
  onOpenChange,
  lengthMeters,
  scopeType,
  defaultName,
  onConfirm,
  onConfirmAndAddAnother,
}: LinearDimensionsDialogProps) {
  const labels = SCOPE_LABELS[scopeType] || { 
    widthLabel: 'Width', 
    heightLabel: 'Height/Depth', 
    widthDefault: 300, 
    heightDefault: 300 
  };

  const prefix = LINEAR_TYPE_PREFIXES[scopeType] || 'L';
  const computedDefaultName = defaultName || `${prefix}1`;

  const [name, setName] = useState(computedDefaultName);
  const [width, setWidth] = useState(labels.widthDefault);
  const [height, setHeight] = useState(labels.heightDefault);
  const [toe, setToe] = useState(labels.toeDefault || 0);
  const [isSaving, setIsSaving] = useState(false);

  // Sync name with defaultName when dialog opens or defaultName changes
  useEffect(() => {
    if (open) {
      setName(defaultName || `${prefix}1`);
    }
  }, [open, defaultName, prefix]);

  const handleConfirm = async () => {
    const typeName = name.trim() || `${prefix}1`;
    setIsSaving(true);
    try {
      await onConfirm(typeName, width, height, labels.showToe ? toe : undefined);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAndAddAnother = async () => {
    const typeName = name.trim() || `${prefix}1`;
    setIsSaving(true);
    try {
      await onConfirmAndAddAnother?.(typeName, width, height, labels.showToe ? toe : undefined);
      // Auto-increment name for next section (SF1 -> SF2, etc.)
      const currentNum = parseInt(typeName.replace(/\D/g, '')) || 0;
      setName(`${prefix}${currentNum + 1}`);
    } finally {
      setIsSaving(false);
    }
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
      <DialogContent className="sm:max-w-md z-[100] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Enter {getScopeTitle()} Dimensions
          </DialogTitle>
          <DialogDescription>
            You've traced {lengthMeters.toFixed(1)}m of {getScopeTitle().toLowerCase()}. Enter the type name and cross-section dimensions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Type name input */}
          <div className="space-y-2">
            <Label htmlFor="typeName">Type Name</Label>
            <Input
              id="typeName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g., ${prefix}1, ${prefix}2`}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Group sections with same dimensions under one type (e.g., "{prefix}1")
            </p>
          </div>

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

          {/* Toe input - only for retaining wall scopes */}
          {labels.showToe && (
            <div className="space-y-2">
              <Label htmlFor="toe">Toe Length</Label>
              <div className="relative">
                <Input
                  id="toe"
                  type="number"
                  value={toe}
                  onChange={(e) => setToe(Number(e.target.value) || 0)}
                  min={0}
                  max={1000}
                  step={50}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  mm
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Distance footing extends beyond wall face (0 if no toe)
              </p>
            </div>
          )}

          {/* Volume preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{name || `${prefix}1`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cross-section:</span>
              <span className="font-medium">{width}mm × {height}mm</span>
            </div>
            {labels.showToe && toe > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Toe:</span>
                <span className="font-medium">{toe}mm</span>
              </div>
            )}
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

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={lengthMeters === 0 || isSaving} className="w-full sm:w-auto">
            {isSaving ? 'Saving...' : `Save ${getScopeTitle()}`}
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother} 
              disabled={lengthMeters === 0 || isSaving}
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
