import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ruler, Check } from 'lucide-react';

interface JointDimensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Total length in meters (all segments combined) */
  lengthMeters: number;
  /** Number of segments drawn */
  segmentCount: number;
  /** Type of joint being measured */
  jointType: 'expansion_joints' | 'control_joints';
  /** Callback when user confirms - saves markup and triggers auto-return */
  onConfirm: () => Promise<void>;
  /** Callback when user cancels */
  onCancel: () => void;
}

export function JointDimensionsDialog({
  open,
  onOpenChange,
  lengthMeters,
  segmentCount,
  jointType,
  onConfirm,
  onCancel,
}: JointDimensionsDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const getTitle = () => {
    return jointType === 'expansion_joints' 
      ? 'Expansion Joint Measured' 
      : 'Control Joint Measured';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {segmentCount === 1 
              ? 'One line segment traced.'
              : `${segmentCount} line segments traced.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {/* Total length display */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Total Length</div>
            <div className="text-3xl font-bold font-mono">
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Confirm & Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
