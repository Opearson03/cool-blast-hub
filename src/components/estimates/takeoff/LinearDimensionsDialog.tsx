import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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

/** Segment data from polyline points */
export interface PolylineSegment {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  length: number; // in meters
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
  /** Total length in meters (all segments combined) */
  lengthMeters: number;
  /** Individual segments with their lengths */
  segments?: PolylineSegment[];
  scopeType: string;
  defaultName?: string;
  onConfirm: (name: string, width: number, height: number, hasToe?: boolean, toeWidth?: number, toeDepth?: number) => Promise<void>;
  onConfirmAndAddAnother?: (name: string, width: number, height: number, hasToe?: boolean, toeWidth?: number, toeDepth?: number) => Promise<void>;
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
  toeWidthDefault?: number;
  toeDepthDefault?: number;
}> = {
  strip_footings: { widthLabel: 'Footing Width', heightLabel: 'Footing Depth', widthDefault: 450, heightDefault: 300 },
  retaining_wall_footings: { widthLabel: 'Footing Width', heightLabel: 'Footing Depth', widthDefault: 600, heightDefault: 400, showToe: true, toeWidthDefault: 300, toeDepthDefault: 300 },
  kerbs_channels: { widthLabel: 'Kerb Width', heightLabel: 'Kerb Height', widthDefault: 300, heightDefault: 450 },
  retaining_walls: { widthLabel: 'Wall Thickness', heightLabel: 'Wall Height', widthDefault: 200, heightDefault: 1200, showToe: true, toeWidthDefault: 300, toeDepthDefault: 300 },
};

export function LinearDimensionsDialog({
  open,
  onOpenChange,
  lengthMeters,
  segments = [],
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
  const [hasToe, setHasToe] = useState(false);
  const [toeWidth, setToeWidth] = useState(labels.toeWidthDefault || 300);
  const [toeDepth, setToeDepth] = useState(labels.toeDepthDefault || 300);
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
      setHasToe(false);
      setToeWidth(labels.toeWidthDefault || 300);
      setToeDepth(labels.toeDepthDefault || 300);
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
      await onConfirm(
        segmentName, 
        width, 
        height, 
        labels.showToe ? hasToe : undefined,
        labels.showToe && hasToe ? toeWidth : undefined, 
        labels.showToe && hasToe ? toeDepth : undefined
      );
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
      await onConfirmAndAddAnother?.(
        segmentName, 
        width, 
        height, 
        labels.showToe ? hasToe : undefined,
        labels.showToe && hasToe ? toeWidth : undefined, 
        labels.showToe && hasToe ? toeDepth : undefined
      );
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
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Enter {getScopeTitle()} Dimensions
          </DialogTitle>
          <DialogDescription className="text-xs">
            {segments.length > 1 
              ? `${segments.length} segments totaling ${lengthMeters.toFixed(1)}m traced.`
              : `${lengthMeters.toFixed(1)}m traced.`}
            {hasExistingTypes ? ' Select a type or create new.' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Type selection tabs - only show if existing types exist */}
          {hasExistingTypes ? (
            <Tabs value={typeMode} onValueChange={(v) => setTypeMode(v as 'existing' | 'new')}>
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="existing" className="text-xs">Existing Type</TabsTrigger>
                <TabsTrigger value="new" className="text-xs">New Type</TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing" className="space-y-2 mt-2">
                <div className="grid gap-1.5 max-h-24 overflow-y-auto">
                  {existingTypes.map((type) => {
                    const key = `${type.baseName}-${type.width}-${type.depth}`;
                    const isSelected = selectedTypeKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTypeKey(key)}
                        className={cn(
                          "flex items-center justify-between p-1.5 rounded-md border text-left transition-colors",
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs h-5">
                            {type.baseName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {type.width}×{type.depth}mm
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {type.count}×
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedType && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    New segment: <span className="font-mono font-medium">{nextSegmentName}</span>
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="new" className="mt-2">
                <div className="space-y-1">
                  <Label htmlFor="typeName" className="text-xs">Type Name</Label>
                  <Input
                    id="typeName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`e.g., ${prefix}1`}
                    className="h-8"
                    autoFocus
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="typeName" className="text-xs">Type Name</Label>
              <Input
                id="typeName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g., ${prefix}1`}
                className="h-8"
                autoFocus
              />
            </div>
          )}

          {/* Dimension inputs - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="width" className="text-xs flex items-center gap-1">
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
                  className="pr-10 h-8"
                  disabled={!!dimensionsLocked}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="height" className="text-xs flex items-center gap-1">
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
                  className="pr-10 h-8"
                  disabled={!!dimensionsLocked}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm
                </span>
              </div>
            </div>
          </div>

          {/* Toe section - compact layout */}
          {labels.showToe && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Is there a toe?</Label>
                <Switch
                  checked={hasToe}
                  onCheckedChange={setHasToe}
                />
              </div>
              
              {hasToe && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="toeWidth" className="text-xs text-muted-foreground">Toe Width</Label>
                    <div className="relative">
                      <Input
                        id="toeWidth"
                        type="number"
                        value={toeWidth}
                        onChange={(e) => setToeWidth(Number(e.target.value) || 0)}
                        min={0}
                        max={2000}
                        step={50}
                        className="pr-10 h-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        mm
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="toeDepth" className="text-xs text-muted-foreground">Toe Depth</Label>
                    <div className="relative">
                      <Input
                        id="toeDepth"
                        type="number"
                        value={toeDepth}
                        onChange={(e) => setToeDepth(Number(e.target.value) || 0)}
                        min={0}
                        max={2000}
                        step={50}
                        className="pr-10 h-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        mm
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact summary */}
          <div className="p-2 bg-muted/50 rounded-md text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Segment:</span>
              <span className="font-mono font-medium">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{calculations.volume.toFixed(3)} m³</span>
            </div>
          </div>
        </div>

        <DialogFooter className="!flex-row gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSaving}
            className="flex-1 h-9"
          >
            Cancel
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother} 
              disabled={lengthMeters === 0 || isSaving}
              className="flex-1 h-9 gap-1"
            >
              <Plus className="h-4 w-4" />
              Save & Add
            </Button>
          )}
          <Button 
            onClick={handleConfirm} 
            disabled={lengthMeters === 0 || isSaving}
            className="flex-1 h-9"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
