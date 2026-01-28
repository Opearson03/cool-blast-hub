import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3X3, Plus, SkipForward, Check, Edit2 } from 'lucide-react';

type WafflePodCountStep = 'count_pods' | 'count_4way' | 'count_2way' | 'complete';

interface WafflePodCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: WafflePodCountStep;
  // Pod counting
  podCount: number;
  podDepth: string;
  onPodDepthChange: (depth: string) => void;
  // Spacer counts
  spacer4WayCount: number;
  spacer2WayCount: number;
  // Top slab thickness (for pod rails calculation)
  topSlabThickness: number;
  // Manual count override
  onManualPodCountChange?: (count: number) => void;
  // Actions
  onSavePodCount: () => void;
  onSaveAnd4Way: () => void;
  onSave4WayCount: () => void;
  onSaveAnd2Way: () => void;
  onSave2WayCount: () => void;
  onSkip4Way: () => void;
  onSkip2Way: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

// Pod thickness options
const POD_THICKNESS_OPTIONS = [
  { value: '225', label: '225mm' },
  { value: '275', label: '275mm' },
  { value: '325', label: '325mm' },
  { value: '375', label: '375mm' },
];

export function WafflePodCountDialog({
  open,
  onOpenChange,
  step,
  podCount,
  podDepth,
  onPodDepthChange,
  spacer4WayCount,
  spacer2WayCount,
  topSlabThickness,
  onManualPodCountChange,
  onSavePodCount,
  onSaveAnd4Way,
  onSave4WayCount,
  onSaveAnd2Way,
  onSave2WayCount,
  onSkip4Way,
  onSkip2Way,
  onComplete,
  onCancel,
}: WafflePodCountDialogProps) {
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualCount, setManualCount] = useState<string>('');
  
  // Sync manual count with actual pod count when dialog opens
  useEffect(() => {
    if (open && step === 'count_pods') {
      setManualCount(podCount > 0 ? String(podCount) : '');
    }
  }, [open, step, podCount]);

  // Calculate pod rails (only needed for 100mm+ slabs)
  const podRailsRequired = topSlabThickness >= 100;
  const effectivePodCount = isManualEntry ? Number(manualCount) || 0 : podCount;
  const podRailsNeeded = podRailsRequired ? effectivePodCount * 2 : 0;
  const podRailPacks = Math.ceil(podRailsNeeded / 20);

  const handleManualCountChange = (value: string) => {
    setManualCount(value);
    const numValue = Number(value) || 0;
    if (numValue > 0 && onManualPodCountChange) {
      onManualPodCountChange(numValue);
    }
  };

  const handleToggleManualEntry = () => {
    if (!isManualEntry) {
      // Switching to manual - pre-fill with current count
      setManualCount(podCount > 0 ? String(podCount) : '');
    }
    setIsManualEntry(!isManualEntry);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'count_pods':
        return 'Pods and Accessories';
      case 'count_4way':
        return '4-Way Spacers';
      case 'count_2way':
        return '2-Way Spacers';
      case 'complete':
        return 'Count Complete';
      default:
        return 'Pods and Accessories';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'count_pods':
        return isManualEntry 
          ? 'Enter the pod count manually if you know it from the plans.'
          : 'Tap each pod location on the plans, or switch to manual entry.';
      case 'count_4way':
        return 'Tap each 4-way intersection where pods meet, then save or skip.';
      case 'count_2way':
        return 'Tap each 2-way edge connection, then save or skip.';
      case 'complete':
        return 'All counts have been saved.';
      default:
        return '';
    }
  };

  // Don't render if step is complete (it will auto-close)
  if (step === 'complete') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100] flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-primary" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step: Count Pods */}
          {step === 'count_pods' && (
            <div className="space-y-4">
              {/* Pod count display/entry */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {isManualEntry ? 'Pod Count' : 'Pods Marked'}
                </span>
                {isManualEntry ? (
                  <Input
                    type="number"
                    min="1"
                    value={manualCount}
                    onChange={(e) => handleManualCountChange(e.target.value)}
                    className="w-24 h-8 text-right font-medium"
                    placeholder="0"
                    autoFocus
                  />
                ) : (
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {podCount}
                  </Badge>
                )}
              </div>

              {/* Toggle manual entry button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToggleManualEntry}
                className="w-full"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {isManualEntry ? 'Mark on Plans Instead' : 'Enter Count Manually'}
              </Button>

              {/* Pod depth selection */}
              <div className="space-y-2">
                <Label htmlFor="pod-depth">Pod Thickness</Label>
                <Select value={podDepth} onValueChange={onPodDepthChange}>
                  <SelectTrigger id="pod-depth" className="z-[150]">
                    <SelectValue placeholder="Select pod thickness" />
                  </SelectTrigger>
                  <SelectContent className="z-[200] bg-background">
                    {POD_THICKNESS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pod rails info (if 100mm+ slab) */}
              {podRailsRequired && effectivePodCount > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Pod Rails Required
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {topSlabThickness}mm slab requires pod rails (2 per pod)
                  </p>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Rails needed:</span>
                    <span className="font-medium">{podRailsNeeded}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Packs (20/pack):</span>
                    <span className="font-medium">{podRailPacks}</span>
                  </div>
                </div>
              )}
              
              {/* Info about spacer auto-calculation */}
              <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2">
                💡 Spacers will be auto-estimated from pod count in the configure step. You can adjust them there or count manually in the next steps.
              </p>
            </div>
          )}

          {/* Step: Count 4-Way Spacers */}
          {step === 'count_4way' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">4-Way Spacers Marked</span>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {spacer4WayCount}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                4-way spacers are placed at intersections where 4 pods meet.
              </p>
            </div>
          )}

          {/* Step: Count 2-Way Spacers */}
          {step === 'count_2way' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-primary rounded" />
                  <span className="text-sm text-muted-foreground">2-Way Spacers Marked</span>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {spacer2WayCount}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                2-way spacers are placed at edges where 2 pods meet.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex flex-col sm:flex-row gap-2">
          {step === 'count_pods' && (
            <>
              <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={onComplete}
                disabled={effectivePodCount === 0}
                className="w-full sm:w-auto"
              >
                Mark edge beams
              </Button>
            </>
          )}

          {step === 'count_4way' && (
            <>
              <Button variant="outline" onClick={onSkip4Way} className="w-full sm:w-auto">
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              <Button 
                variant="secondary"
                onClick={onSave4WayCount}
                className="w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-1" />
                Save Only
              </Button>
              <Button 
                onClick={onSaveAnd2Way}
                className="w-full sm:w-auto"
              >
                Save & Count 2-Way
              </Button>
            </>
          )}

          {step === 'count_2way' && (
            <>
              <Button variant="outline" onClick={onSkip2Way} className="w-full sm:w-auto">
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              <Button 
                onClick={onSave2WayCount}
                className="w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-1" />
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
