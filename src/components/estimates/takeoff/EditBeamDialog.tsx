import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Minus, Layers } from 'lucide-react';

// Interface for beam types (groups of beams with same dimensions)
interface BeamType {
  name: string;
  width: number;
  depth: number;
  count: number;
}

// Individual beam data
interface BeamData {
  id?: string;
  name: string;
  width: number;
  depth: number;
  length: number;
}

interface EditBeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beamType: 'edge_beam' | 'internal_beam';
  initialName: string;
  initialWidth: number;
  initialDepth: number;
  length: number;
  onSave: (data: { name: string; width: number; depth: number }) => void;
  /** If true, shows "Add" instead of "Edit" in title */
  mode?: 'edit' | 'add';
  /** Optional parent slab name for context */
  slabName?: string;
  /** Existing beams of the same type (for grouping) - only used in add mode */
  existingBeams?: BeamData[];
}

export function EditBeamDialog({
  open,
  onOpenChange,
  beamType,
  initialName,
  initialWidth,
  initialDepth,
  length,
  onSave,
  mode = 'edit',
  slabName,
  existingBeams = [],
}: EditBeamDialogProps) {
  const [name, setName] = useState(initialName);
  const [width, setWidth] = useState(initialWidth);
  const [depth, setDepth] = useState(initialDepth);
  const [typeMode, setTypeMode] = useState<'existing' | 'new'>('new');
  const [selectedTypeKey, setSelectedTypeKey] = useState<string | null>(null);

  // Derive existing beam types from provided beams
  const existingBeamTypes = useMemo((): BeamType[] => {
    const typeMap = new Map<string, BeamType>();
    existingBeams.forEach(beam => {
      const baseName = beam.name.split('-')[0].trim();
      const key = `${baseName}-${beam.width}-${beam.depth}`;
      if (!typeMap.has(key)) {
        typeMap.set(key, { name: baseName, width: beam.width, depth: beam.depth, count: 1 });
      } else {
        typeMap.get(key)!.count++;
      }
    });
    return Array.from(typeMap.values());
  }, [existingBeams]);

  // Calculate next new type name
  const nextNewTypeName = useMemo(() => {
    const prefix = beamType === 'edge_beam' ? 'EB' : 'IB';
    const existingNumbers = existingBeamTypes
      .map(t => {
        const match = t.name.match(new RegExp(`^${prefix}(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `${prefix}${maxNumber + 1}`;
  }, [beamType, existingBeamTypes]);

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      if (mode === 'add' && existingBeamTypes.length > 0) {
        // Default to existing type mode
        setTypeMode('existing');
        const firstType = existingBeamTypes[0];
        const key = `${firstType.name}-${firstType.width}-${firstType.depth}`;
        setSelectedTypeKey(key);
        const beamCount = existingBeams.filter(b => b.name.split('-')[0].trim() === firstType.name).length;
        setName(`${firstType.name}-${beamCount + 1}`);
        setWidth(firstType.width);
        setDepth(firstType.depth);
      } else {
        // New type mode or edit mode
        setTypeMode('new');
        setSelectedTypeKey(null);
        if (mode === 'add') {
          setName(nextNewTypeName);
          setWidth(beamType === 'edge_beam' ? 450 : 300);
          setDepth(beamType === 'edge_beam' ? 450 : 400);
        } else {
          setName(initialName);
          setWidth(initialWidth);
          setDepth(initialDepth);
        }
      }
    }
  }, [open, initialName, initialWidth, initialDepth, mode, existingBeamTypes, existingBeams, beamType, nextNewTypeName]);

  // Handle type selection change
  const handleTypeSelect = (key: string) => {
    setSelectedTypeKey(key);
    const type = existingBeamTypes.find(t => `${t.name}-${t.width}-${t.depth}` === key);
    if (type) {
      const beamCount = existingBeams.filter(b => b.name.split('-')[0].trim() === type.name).length;
      setName(`${type.name}-${beamCount + 1}`);
      setWidth(type.width);
      setDepth(type.depth);
    }
  };

  // Handle mode toggle
  const handleModeChange = (newMode: 'existing' | 'new') => {
    setTypeMode(newMode);
    if (newMode === 'new') {
      setSelectedTypeKey(null);
      setName(nextNewTypeName);
      setWidth(beamType === 'edge_beam' ? 450 : 300);
      setDepth(beamType === 'edge_beam' ? 450 : 400);
    } else if (existingBeamTypes.length > 0) {
      const firstType = existingBeamTypes[0];
      const key = `${firstType.name}-${firstType.width}-${firstType.depth}`;
      handleTypeSelect(key);
    }
  };

  const handleSave = () => {
    onSave({
      name: name.trim() || initialName,
      width,
      depth,
    });
    onOpenChange(false);
  };

  const beamLabel = beamType === 'edge_beam' ? 'Edge Beam' : 'Internal Beam';
  const actionLabel = mode === 'add' ? 'Add' : 'Edit';
  const showTypeSelection = mode === 'add' && existingBeamTypes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle>{actionLabel} {beamLabel}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? `Add a new ${beamLabel.toLowerCase()} to ${slabName || 'the slab'}.`
              : 'Update the name and dimensions for this beam.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Length display (read-only) */}
          <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Beam Length:</span>
            </div>
            <Badge variant="secondary">{length.toFixed(2)} m</Badge>
          </div>

          {/* Type selection - only in add mode with existing types */}
          {showTypeSelection && (
            <div className="space-y-3">
              <Label>Beam Type</Label>
              <Tabs value={typeMode} onValueChange={(v) => handleModeChange(v as 'existing' | 'new')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">
                    <Layers className="h-3.5 w-3.5 mr-1.5" />
                    Existing Type
                  </TabsTrigger>
                  <TabsTrigger value="new">New Type</TabsTrigger>
                </TabsList>
              </Tabs>

              {typeMode === 'existing' && (
                <div className="grid gap-2">
                  {existingBeamTypes.map((type) => {
                    const key = `${type.name}-${type.width}-${type.depth}`;
                    const isSelected = selectedTypeKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleTypeSelect(key)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{type.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {type.count} beam{type.count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {type.width}mm × {type.depth}mm
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* New type name input - show in new mode or when no existing types */}
          {(typeMode === 'new' || !showTypeSelection) && mode === 'add' && (
            <div className="space-y-2">
              <Label htmlFor="beam-type-name">Type Name</Label>
              <Input
                id="beam-type-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g., ${beamType === 'edge_beam' ? 'EB1' : 'IB1'}`}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This creates a new beam type. Future beams can reuse these dimensions.
              </p>
            </div>
          )}

          {/* Beam name for edit mode */}
          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="beam-name">Beam Name</Label>
              <Input
                id="beam-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., North Edge, Front Wall"
                autoFocus
              />
            </div>
          )}

          {/* Dimensions - editable for new types, read-only for existing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beam-width">Width (mm)</Label>
              <Input
                id="beam-width"
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={100}
                max={1000}
                disabled={typeMode === 'existing' && showTypeSelection}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beam-depth">Depth (mm)</Label>
              <Input
                id="beam-depth"
                type="number"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                min={100}
                max={1500}
                disabled={typeMode === 'existing' && showTypeSelection}
              />
            </div>
          </div>
          {typeMode === 'existing' && showTypeSelection && (
            <p className="text-xs text-muted-foreground">
              Dimensions are inherited from the selected type.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === 'add' ? 'Add Beam' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
