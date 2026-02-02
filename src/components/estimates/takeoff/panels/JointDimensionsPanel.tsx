import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ruler, Check } from 'lucide-react';

interface JointDimensionsPanelProps {
  lengthMeters: number;
  segmentCount: number;
  jointType: 'expansion_joints' | 'control_joints';
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function JointDimensionsPanel({
  lengthMeters,
  segmentCount,
  jointType,
  onConfirm,
  onCancel,
}: JointDimensionsPanelProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm();
    } finally {
      setIsSaving(false);
    }
  };

  const getTitle = () => {
    return jointType === 'expansion_joints' 
      ? 'Expansion Joint Measured' 
      : 'Control Joint Measured';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{getTitle()}</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {segmentCount === 1 
            ? 'One line segment traced.'
            : `${segmentCount} line segments traced.`}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Total length display */}
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground mb-2">Total Length</div>
          <div className="text-4xl font-bold font-mono">
            {lengthMeters.toFixed(1)}
            <span className="text-lg font-normal text-muted-foreground ml-1">m</span>
          </div>
        </div>

        {/* Info badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs">
            <Check className="h-3 w-3 mr-1" />
            Measurement will be saved and applied
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30 flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? 'Saving...' : 'Confirm & Return'}
        </Button>
      </div>
    </div>
  );
}
