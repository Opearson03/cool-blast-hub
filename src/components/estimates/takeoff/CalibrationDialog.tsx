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
import { Badge } from '@/components/ui/badge';
import { Ruler, CheckCircle2, Target } from 'lucide-react';
import type { TakeoffPoint } from '@/types/takeoff';

interface CalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCalibrate: (pixelsPerMeter: number, method: 'ai' | 'manual') => Promise<void>;
  onStartCalibration: () => void;
  calibrationPoints: TakeoffPoint[];
  currentScale: number | null;
  currentMethod: 'ai' | 'manual' | null;
}

type DistanceUnit = 'm' | 'mm' | 'ft' | 'in';

export function CalibrationDialog({
  open,
  onOpenChange,
  onCalibrate,
  onStartCalibration,
  calibrationPoints,
  currentScale,
  currentMethod
}: CalibrationDialogProps) {
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<DistanceUnit>('m');

  useEffect(() => {
    if (open) {
      setDistance('');
    }
  }, [open]);

  const handleApplyPointsScale = async () => {
    if (calibrationPoints.length === 2 && distance) {
      const distanceValue = parseFloat(distance);
      if (distanceValue <= 0) return;

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
      await onCalibrate(pixelsPerMeter, 'manual');
      onOpenChange(false);
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
            Set Scale
          </DialogTitle>
          <DialogDescription>
            Set the scale by marking a known distance on the plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current scale info */}
          {currentScale && (
            <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Scale is set</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {currentMethod === 'ai' ? 'Auto-detected' : 'Manual'}
              </Badge>
            </div>
          )}

          {hasPoints ? (
            /* Distance entry when points are placed */
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Two points selected</span>
              </div>
              
              <Label className="text-sm font-medium">Enter the real-world distance between the points</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Distance"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    min="0"
                    step="0.1"
                    autoFocus
                  />
                </div>
                <Select value={unit} onValueChange={(v) => setUnit(v as DistanceUnit)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleApplyPointsScale} 
                disabled={!distance || parseFloat(distance) <= 0}
                className="w-full"
              >
                Apply Scale
              </Button>
            </div>
          ) : (
            /* Prompt to place points */
            <div className="space-y-3">
              <div className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Mark a known distance</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Click two points on the plan that are a known distance apart (e.g., a dimension line or scale bar).
                </p>
                <Button onClick={handleStartPlacingPoints} className="gap-2">
                  <Target className="h-4 w-4" />
                  Place Points on Plan
                </Button>
              </div>
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
