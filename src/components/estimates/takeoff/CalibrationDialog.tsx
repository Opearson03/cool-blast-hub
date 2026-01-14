import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ruler, CheckCircle2, Target } from 'lucide-react';
import type { TakeoffPoint } from '@/types/takeoff';

interface CalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCalibrate: (pixelsPerMeter: number) => Promise<void>;
  onStartCalibration: () => void;
  calibrationPoints: TakeoffPoint[];
  currentScale: number | null;
  pageNumber: number;
}

type DistanceUnit = 'm' | 'mm' | 'ft' | 'in';

export function CalibrationDialog({
  open,
  onOpenChange,
  onCalibrate,
  onStartCalibration,
  calibrationPoints,
  currentScale,
  pageNumber
}: CalibrationDialogProps) {
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<DistanceUnit>('m');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (open) {
      setDistance('');
    }
  }, [open]);

  const handleApplyPointsScale = async () => {
    if (calibrationPoints.length === 2 && distance) {
      const distanceValue = parseFloat(distance);
      if (distanceValue <= 0) return;

      setIsApplying(true);
      try {
        // Convert to meters
        let distanceMeters = distanceValue;
        switch (unit) {
          case 'mm':
            distanceMeters = distanceValue / 1000;
            break;
          case 'ft':
            distanceMeters = distanceValue * 0.3048;
            break;
          case 'in':
            distanceMeters = distanceValue * 0.0254;
            break;
        }

        // Calculate pixel distance
        const dx = calibrationPoints[1].x - calibrationPoints[0].x;
        const dy = calibrationPoints[1].y - calibrationPoints[0].y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);

        const pixelsPerMeter = pixelDistance / distanceMeters;
        await onCalibrate(pixelsPerMeter);
        onOpenChange(false);
      } finally {
        setIsApplying(false);
      }
    }
  };

  const handleStartPlacingPoints = () => {
    onOpenChange(false);
    onStartCalibration();
  };

  const hasPoints = calibrationPoints.length === 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Set Scale for Page {pageNumber}
          </DialogTitle>
          <DialogDescription>
            Before marking areas, you need to set the scale so measurements are accurate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current scale info */}
          {currentScale && (
            <div className="flex items-center gap-2 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Scale set: {currentScale.toFixed(1)} pixels/meter</span>
            </div>
          )}

          {hasPoints ? (
            /* Distance entry when points are placed */
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Two points selected on the drawing</span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  What is the real-world distance between these points?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Look at your drawing and find the dimension shown between these two points.
                </p>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    min="0"
                    step="0.1"
                    autoFocus
                  />
                </div>
                <Select value={unit} onValueChange={(v) => setUnit(v as DistanceUnit)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">meters</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="ft">feet</SelectItem>
                    <SelectItem value="in">inches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleApplyPointsScale} 
                disabled={!distance || parseFloat(distance) <= 0 || isApplying}
                className="w-full"
              >
                {isApplying ? 'Applying...' : 'Apply Scale'}
              </Button>
            </div>
          ) : (
            /* Prompt to place points */
            <div className="space-y-4">
              <div className="p-5 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
                <Target className="h-10 w-10 mx-auto mb-3 text-primary" />
                <h4 className="text-base font-semibold text-center mb-2">
                  How to Set the Scale
                </h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Find a <strong>dimension line</strong> or <strong>known distance</strong> on your drawing</li>
                  <li>Click the button below, then click the <strong>two ends</strong> of that line on the plan</li>
                  <li>Enter the <strong>real measurement</strong> shown on the drawing</li>
                </ol>
              </div>
              
              <Button onClick={handleStartPlacingPoints} className="w-full gap-2" size="lg">
                <Target className="h-5 w-5" />
                Place Two Points on Drawing
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Tip: Use a dimension line that's clearly visible and as long as possible for best accuracy.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
