import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Square, Plus, Layers, Ruler } from 'lucide-react';

interface PadFootingDimensionsPanelProps {
  padCount: number;
  scopeType: 'pad_footings' | 'pit_bases';
  onConfirm: (length: number, width: number, depth: number, name: string) => void;
  onConfirmAndAddAnother?: (length: number, width: number, depth: number, name: string) => void;
  onCancel: () => void;
  defaultName?: string;
}

export function PadFootingDimensionsPanel({
  padCount,
  scopeType,
  onConfirm,
  onConfirmAndAddAnother,
  onCancel,
  defaultName = '',
}: PadFootingDimensionsPanelProps) {
  const isPitBase = scopeType === 'pit_bases';
  
  const [length, setLength] = useState(isPitBase ? 600 : 450);
  const [width, setWidth] = useState(isPitBase ? 600 : 450);
  const [depth, setDepth] = useState(isPitBase ? 150 : 300);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleConfirm = () => {
    const groupName = name.trim() || (isPitBase ? 'Pit Base Group' : 'Pad Footing Group');
    onConfirm(length, width, depth, groupName);
  };

  const handleConfirmAndAddAnother = () => {
    const groupName = name.trim() || (isPitBase ? 'Pit Base Group' : 'Pad Footing Group');
    onConfirmAndAddAnother?.(length, width, depth, groupName);
    setName(`${isPitBase ? 'Pit Bases' : 'Pad Footings'} ${Date.now().toString().slice(-4)}`);
  };

  const singleVolume = (length / 1000) * (width / 1000) * (depth / 1000);
  const totalVolume = singleVolume * padCount;
  const title = isPitBase ? 'Pit Base' : 'Pad Footing';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Square className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{title} Dimensions</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Set the dimensions for the {title.toLowerCase()}s you marked.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Count badge */}
        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
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
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
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
                  className="h-10 pr-8 text-center font-medium"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  mm
                </span>
              </div>
            </div>

            <div className="space-y-1">
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
                  className="h-10 pr-8 text-center font-medium"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  mm
                </span>
              </div>
            </div>

            <div className="space-y-1">
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
                  className="h-10 pr-8 text-center font-medium"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  mm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Volume summary card */}
        <div className="rounded-lg bg-muted/50 border overflow-hidden">
          <div className="px-3 py-2 bg-muted/80 border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</span>
          </div>
          <div className="px-3 py-2 space-y-1">
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
      <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={padCount === 0} className="flex-1">
            Save {title}s
          </Button>
        </div>
        {onConfirmAndAddAnother && (
          <Button 
            variant="secondary" 
            onClick={handleConfirmAndAddAnother} 
            disabled={padCount === 0}
            className="gap-1 w-full"
          >
            <Plus className="h-4 w-4" />
            Add More
          </Button>
        )}
      </div>
    </div>
  );
}
