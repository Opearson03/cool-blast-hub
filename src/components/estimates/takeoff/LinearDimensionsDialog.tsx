import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ruler, Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Scope-specific type prefixes
export const LINEAR_TYPE_PREFIXES: Record<string, string> = {
  strip_footings: 'SF',
  retaining_wall_footings: 'RF',
  kerbs_channels: 'K',
  retaining_walls: 'RW',
};

export interface ExistingLinearSegment {
  id: string;
  name: string;
  width: number;
  depth: number;
  length: number;
}

interface LinearType {
  baseName: string;
  width: number;
  depth: number;
  count: number;
}

interface LinearDimensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lengthMeters: number;
  scopeType: string;
  defaultName?: string;
  onConfirm: (name: string, width: number, height: number, toe?: number) => Promise<void>;
  onConfirmAndAddAnother?: (name: string, width: number, height: number, toe?: number) => Promise<void>;
  /** Existing segments for type selection (add to existing type) */
  existingSegments?: ExistingLinearSegment[];
  /** Pre-selected type when adding to existing type from sidebar */
  preselectedType?: { typeName: string; width: number; depth: number } | null;
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
  existingSegments = [],
  preselectedType = null,
}: LinearDimensionsDialogProps) {
  const labels = SCOPE_LABELS[scopeType] || { 
    widthLabel: 'Width', 
    heightLabel: 'Height/Depth', 
    widthDefault: 300, 
    heightDefault: 300 
  };

  const prefix = LINEAR_TYPE_PREFIXES[scopeType] || 'L';
  
  // Derive existing linear types from segments
  const existingTypes = useMemo(() => {
    const typeMap = new Map<string, LinearType>();
    existingSegments.forEach(seg => {
      const baseName = seg.name.split('-')[0].trim();
      const key = `${baseName}-${seg.width}-${seg.depth}`;
      if (!typeMap.has(key)) {
        typeMap.set(key, { baseName, width: seg.width, depth: seg.depth, count: 1 });
      } else {
        typeMap.get(key)!.count++;
      }
    });
    return Array.from(typeMap.values()).sort((a, b) => 
      a.baseName.localeCompare(b.baseName, undefined, { numeric: true })
    );
  }, [existingSegments]);

  const hasExistingTypes = existingTypes.length > 0;

  // Type mode state
  const [typeMode, setTypeMode] = useState<'existing' | 'new'>('new');
  const [selectedTypeKey, setSelectedTypeKey] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [width, setWidth] = useState(labels.widthDefault);
  const [height, setHeight] = useState(labels.heightDefault);
  const [toe, setToe] = useState(labels.toeDefault || 0);
  const [isSaving, setIsSaving] = useState(false);

  // Get selected existing type
  const selectedType = useMemo(() => {
    if (!selectedTypeKey) return null;
    return existingTypes.find(t => `${t.baseName}-${t.width}-${t.depth}` === selectedTypeKey) || null;
  }, [selectedTypeKey, existingTypes]);

  // Calculate next segment name for existing type
  const nextSegmentName = useMemo(() => {
    if (!selectedType) return '';
    return `${selectedType.baseName}-${selectedType.count + 1}`;
  }, [selectedType]);

  // Calculate default name for new type
  const newTypeDefaultName = useMemo(() => {
    if (defaultName) return defaultName;
    
    // Find highest type number in existing segments
    const existingNumbers = existingTypes
      .map(t => {
        const match = t.baseName.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `${prefix}${nextNumber}`;
  }, [defaultName, existingTypes, prefix]);

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      // Check for preselected type (from sidebar "Add" button)
      if (preselectedType) {
        const key = `${preselectedType.typeName}-${preselectedType.width}-${preselectedType.depth}`;
        setTypeMode('existing');
        setSelectedTypeKey(key);
        setWidth(preselectedType.width);
        setHeight(preselectedType.depth);
      } else if (hasExistingTypes) {
        // Default to existing type mode if types exist
        setTypeMode('existing');
        const firstType = existingTypes[0];
        const key = `${firstType.baseName}-${firstType.width}-${firstType.depth}`;
        setSelectedTypeKey(key);
        setWidth(firstType.width);
        setHeight(firstType.depth);
      } else {
        setTypeMode('new');
        setSelectedTypeKey(null);
        setName(newTypeDefaultName);
        setWidth(labels.widthDefault);
        setHeight(labels.heightDefault);
      }
      setToe(labels.toeDefault || 0);
    }
  }, [open, preselectedType, hasExistingTypes, existingTypes, newTypeDefaultName, labels]);

  // Update dimensions when selecting an existing type
  useEffect(() => {
    if (typeMode === 'existing' && selectedType) {
      setWidth(selectedType.width);
      setHeight(selectedType.depth);
    }
  }, [typeMode, selectedType]);

  // Reset to defaults when switching to new type mode
  useEffect(() => {
    if (typeMode === 'new') {
      setName(newTypeDefaultName);
      setWidth(labels.widthDefault);
      setHeight(labels.heightDefault);
    }
  }, [typeMode, newTypeDefaultName, labels]);

  const handleConfirm = async () => {
    const segmentName = typeMode === 'existing' && selectedType 
      ? nextSegmentName 
      : (name.trim() || newTypeDefaultName);
    
    setIsSaving(true);
    try {
      await onConfirm(segmentName, width, height, labels.showToe ? toe : undefined);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAndAddAnother = async () => {
    const segmentName = typeMode === 'existing' && selectedType 
      ? nextSegmentName 
      : (name.trim() || newTypeDefaultName);
    
    setIsSaving(true);
    try {
      await onConfirmAndAddAnother?.(segmentName, width, height, labels.showToe ? toe : undefined);
      // Close dialog to return to drawing mode for next segment
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate volume/area for preview
  const calculations = useMemo(() => {
    const widthM = width / 1000;
    const heightM = height / 1000;
    const volume = lengthMeters * widthM * heightM;
    const surfaceArea = lengthMeters * widthM;
    
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

  const displayName = typeMode === 'existing' && selectedType ? nextSegmentName : (name || newTypeDefaultName);
  const dimensionsLocked = typeMode === 'existing' && selectedType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Enter {getScopeTitle()} Dimensions
          </DialogTitle>
          <DialogDescription>
            You've traced {lengthMeters.toFixed(1)}m of {getScopeTitle().toLowerCase()}. 
            {hasExistingTypes 
              ? ' Add to an existing type or create a new one.'
              : ' Enter the type name and cross-section dimensions.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Length display */}
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">Total Length:</span>
            <span className="text-lg font-bold">{lengthMeters.toFixed(2)} m</span>
          </div>

          {/* Type selection tabs - only show if existing types exist */}
          {hasExistingTypes ? (
            <Tabs value={typeMode} onValueChange={(v) => setTypeMode(v as 'existing' | 'new')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Type</TabsTrigger>
                <TabsTrigger value="new">New Type</TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing" className="space-y-4 mt-4">
                {/* Type selection list */}
                <div className="space-y-2">
                  <Label>Select Type</Label>
                  <div className="grid gap-2 max-h-32 overflow-y-auto">
                    {existingTypes.map((type) => {
                      const key = `${type.baseName}-${type.width}-${type.depth}`;
                      const isSelected = selectedTypeKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedTypeKey(key)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border text-left transition-colors",
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {type.baseName}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {type.width}×{type.depth}mm
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {type.count} segment{type.count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Show auto-generated segment name */}
                {selectedType && (
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      New segment will be named <span className="font-mono font-medium">{nextSegmentName}</span>
                    </span>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="new" className="space-y-4 mt-4">
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
                    Create a new type with different dimensions
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            /* No existing types - show simple name input */
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
          )}

          {/* Dimension inputs */}
          <div className="space-y-4">
            {/* Width input */}
            <div className="space-y-2">
              <Label htmlFor="width" className="flex items-center gap-1">
                {labels.widthLabel}
                {dimensionsLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
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
                  disabled={!!dimensionsLocked}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  mm
                </span>
              </div>
            </div>

            {/* Height input */}
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-1">
                {labels.heightLabel}
                {dimensionsLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
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
                  disabled={!!dimensionsLocked}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  mm
                </span>
              </div>
              {dimensionsLocked && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Dimensions inherited from {selectedType?.baseName}
                </p>
              )}
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
          </div>

          {/* Volume preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Segment:</span>
              <span className="font-medium font-mono">{displayName}</span>
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
