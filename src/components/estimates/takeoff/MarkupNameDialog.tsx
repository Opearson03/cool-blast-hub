import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Plus } from 'lucide-react';

interface MarkupNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  scopeLabel: string;
  shapeType: 'polygon' | 'rectangle' | 'polyline' | 'point';
  /** Stats to show (e.g., area, length, count) */
  stats?: {
    area?: number;
    length?: number;
    count?: number;
  };
  onConfirm: (name: string) => void;
  onConfirmAndAddAnother?: (name: string) => void;
}

export function MarkupNameDialog({
  open,
  onOpenChange,
  defaultName,
  scopeLabel,
  shapeType,
  stats,
  onConfirm,
  onConfirmAndAddAnother,
}: MarkupNameDialogProps) {
  const [name, setName] = useState(defaultName);

  // Update name when defaultName changes (dialog reopened)
  useEffect(() => {
    if (open) {
      setName(defaultName);
    }
  }, [open, defaultName]);

  const handleConfirm = () => {
    const finalName = name.trim() || defaultName;
    onConfirm(finalName);
    onOpenChange(false);
  };

  const handleConfirmAndAddAnother = () => {
    const finalName = name.trim() || defaultName;
    onConfirmAndAddAnother?.(finalName);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const getTypeLabel = () => {
    switch (shapeType) {
      case 'polygon':
      case 'rectangle':
        return 'Area';
      case 'polyline':
        return 'Section';
      case 'point':
        return 'Points';
      default:
        return 'Markup';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Name This {getTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Give this {scopeLabel.toLowerCase()} {getTypeLabel().toLowerCase()} a descriptive name for easy reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="markup-name">Name</Label>
            <Input
              id="markup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={defaultName}
              autoFocus
            />
          </div>

          {/* Stats preview */}
          {stats && (stats.area || stats.length || stats.count) && (
            <div className="p-3 bg-muted rounded-lg space-y-1">
              {stats.area !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Area:</span>
                  <span className="font-medium">{stats.area.toFixed(2)} m²</span>
                </div>
              )}
              {stats.length !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Length:</span>
                  <span className="font-medium">{stats.length.toFixed(2)} m</span>
                </div>
              )}
              {stats.count !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Points marked:</span>
                  <span className="font-medium">{stats.count}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Save {getTypeLabel()}
          </Button>
          {onConfirmAndAddAnother && (
            <Button 
              variant="secondary" 
              onClick={handleConfirmAndAddAnother}
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
