import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Minus } from 'lucide-react';

interface EditBeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beamType: 'edge_beam' | 'internal_beam';
  initialName: string;
  initialWidth: number;
  initialDepth: number;
  length: number;
  onSave: (data: { name: string; width: number; depth: number }) => void;
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
}: EditBeamDialogProps) {
  const [name, setName] = useState(initialName);
  const [width, setWidth] = useState(initialWidth);
  const [depth, setDepth] = useState(initialDepth);

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setName(initialName);
      setWidth(initialWidth);
      setDepth(initialDepth);
    }
  }, [open, initialName, initialWidth, initialDepth]);

  const handleSave = () => {
    onSave({
      name: name.trim() || initialName,
      width,
      depth,
    });
    onOpenChange(false);
  };

  const beamLabel = beamType === 'edge_beam' ? 'Edge Beam' : 'Internal Beam';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle>Edit {beamLabel}</DialogTitle>
          <DialogDescription>
            Update the name and dimensions for this beam.
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

          {/* Beam name */}
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

          {/* Dimensions */}
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
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
