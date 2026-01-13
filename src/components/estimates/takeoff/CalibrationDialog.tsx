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
import { Loader2, Sparkles, Ruler, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CalibrationResult, TakeoffPoint } from '@/types/takeoff';

interface CalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCalibrate: (pixelsPerMeter: number, method: 'ai' | 'manual') => Promise<void>;
  onDetectScale: () => Promise<CalibrationResult>;
  isCalibrating: boolean;
  calibrationPoints: TakeoffPoint[];
  currentScale: number | null;
  currentMethod: 'ai' | 'manual' | null;
}

type CalibrationMode = 'auto' | 'manual' | 'points';
type DistanceUnit = 'm' | 'mm' | 'ft' | 'in';

export function CalibrationDialog({
  open,
  onOpenChange,
  onCalibrate,
  onDetectScale,
  isCalibrating,
  calibrationPoints,
  currentScale,
  currentMethod
}: CalibrationDialogProps) {
  const [mode, setMode] = useState<CalibrationMode>('auto');
  const [aiResult, setAiResult] = useState<CalibrationResult | null>(null);
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<DistanceUnit>('m');
  const [manualScale, setManualScale] = useState('');

  useEffect(() => {
    if (open) {
      setAiResult(null);
      setDistance('');
      setManualScale('');
      setMode('auto');
    }
  }, [open]);

  const handleAutoDetect = async () => {
    const result = await onDetectScale();
    setAiResult(result);
    if (result.detected) {
      setMode('auto');
    } else {
      setMode('manual');
    }
  };

  const handleApplyAiScale = async () => {
    if (aiResult?.pixels_per_meter) {
      await onCalibrate(aiResult.pixels_per_meter, 'ai');
      onOpenChange(false);
    }
  };

  const handleApplyManualScale = async () => {
    if (manualScale) {
      const scale = parseFloat(manualScale);
      if (scale > 0) {
        await onCalibrate(scale, 'manual');
        onOpenChange(false);
      }
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Scale Calibration
          </DialogTitle>
          <DialogDescription>
            Calibrate the scale to accurately measure areas on your plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current scale info */}
          {currentScale && (
            <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Current scale: <span className="font-mono font-medium">{currentScale.toFixed(1)}</span> px/m</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {currentMethod === 'ai' ? 'AI detected' : 'Manual'}
              </Badge>
            </div>
          )}

          {/* AI Detection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Auto-Detect Scale</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAutoDetect}
                disabled={isCalibrating}
                className="gap-1.5"
              >
                {isCalibrating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Detect with AI
              </Button>
            </div>

            {aiResult && (
              <div className={`p-3 rounded-lg border ${aiResult.detected ? 'border-green-500/30 bg-green-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
                {aiResult.detected ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Scale detected!</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(aiResult.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Detected: <span className="font-mono">{aiResult.pixels_per_meter?.toFixed(1)}</span> pixels per meter
                    </p>
                    <Button size="sm" onClick={handleApplyAiScale} className="w-full mt-2">
                      Use This Scale
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Could not detect scale</p>
                      <p className="text-xs text-muted-foreground">{aiResult.message || 'Please calibrate manually below.'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or calibrate manually</span>
            </div>
          </div>

          {/* Two-Point Calibration */}
          {calibrationPoints.length === 2 ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Two-Point Calibration</Label>
              <p className="text-xs text-muted-foreground">
                You've selected two points. Enter the real-world distance between them.
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Distance"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    min="0"
                    step="0.1"
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
                Apply Calibration
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Manual Entry</Label>
              <p className="text-xs text-muted-foreground">
                Enter the scale directly if you know it, or click two points on a known dimension on the plan.
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Pixels per meter"
                  value={manualScale}
                  onChange={(e) => setManualScale(e.target.value)}
                  min="0"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">px/m</span>
              </div>
              <Button 
                onClick={handleApplyManualScale}
                disabled={!manualScale || parseFloat(manualScale) <= 0}
                variant="outline"
                className="w-full"
              >
                Apply Manual Scale
              </Button>
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
