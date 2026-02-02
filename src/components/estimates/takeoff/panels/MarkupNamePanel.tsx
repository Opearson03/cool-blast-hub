import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Plus } from 'lucide-react';

interface MarkupNamePanelProps {
  defaultName: string;
  scopeLabel: string;
  shapeType: 'polygon' | 'rectangle' | 'polyline' | 'point';
  stats?: {
    area?: number;
    length?: number;
    count?: number;
  };
  onConfirm: (name: string) => void;
  onConfirmAndAddAnother?: (name: string) => void;
  onCancel: () => void;
}

export function MarkupNamePanel({
  defaultName,
  scopeLabel,
  shapeType,
  stats,
  onConfirm,
  onConfirmAndAddAnother,
  onCancel,
}: MarkupNamePanelProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleConfirm = () => {
    const finalName = name.trim() || defaultName;
    onConfirm(finalName);
  };

  const handleConfirmAndAddAnother = () => {
    const finalName = name.trim() || defaultName;
    onConfirmAndAddAnother?.(finalName);
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Name This {getTypeLabel()}</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Give this {scopeLabel.toLowerCase()} {getTypeLabel().toLowerCase()} a descriptive name for easy reference.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Save {getTypeLabel()}
          </Button>
        </div>
        {onConfirmAndAddAnother && (
          <Button 
            variant="secondary" 
            onClick={handleConfirmAndAddAnother}
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
