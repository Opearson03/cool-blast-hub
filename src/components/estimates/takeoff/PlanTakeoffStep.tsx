import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUp, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { useTakeoffData } from '@/hooks/useTakeoffData';
import { PlanUploader } from './PlanUploader';
import { TakeoffToolbar } from './TakeoffToolbar';
import { ScopeMarkupChecklist } from './ScopeMarkupChecklist';
import { CalibrationDialog } from './CalibrationDialog';
import { getScopeColor } from '@/types/takeoff';
import type { ScopeType } from '../ScopeSelector';
import type { DrawingTool, TakeoffPoint } from '@/types/takeoff';

interface PlanTakeoffStepProps {
  estimateId: string | null;
  businessId: string | null;
  selectedScopes: ScopeType[];
  scopeLabels: Record<string, string>;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function PlanTakeoffStep({
  estimateId,
  businessId,
  selectedScopes,
  scopeLabels,
  onContinue,
  onBack,
  onSkip
}: PlanTakeoffStepProps) {
  const {
    takeoff,
    markups,
    isLoading,
    isUploading,
    isCalibrating,
    uploadPlan,
    deletePlan,
    setScale,
    addMarkup,
    deleteMarkup,
    detectScale
  } = useTakeoffData({ estimateId, businessId });

  const [activeTool, setActiveTool] = useState<DrawingTool['type']>('select');
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [skippedScopes, setSkippedScopes] = useState<Set<string>>(new Set());
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<TakeoffPoint[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);

  const isCalibrated = !!takeoff?.scale_pixels_per_meter;
  const hasPlan = !!takeoff?.plan_url;

  const scopes = useMemo(() => 
    selectedScopes.map(id => ({ id, label: scopeLabels[id] || id })),
    [selectedScopes, scopeLabels]
  );

  const handleMarkArea = (scopeId: string) => {
    setActiveScope(scopeId);
    setActiveTool('polygon');
  };

  const handleSkipScope = (scopeId: string) => {
    setSkippedScopes(prev => new Set([...prev, scopeId]));
  };

  const handleDeleteMarkup = async (markupId: string) => {
    await deleteMarkup(markupId);
    setSelectedMarkupId(null);
  };

  const handleCalibrate = async (pixelsPerMeter: number, method: 'ai' | 'manual') => {
    await setScale(pixelsPerMeter, method);
  };

  const completedCount = markups.length + skippedScopes.size;
  const canContinue = completedCount === selectedScopes.length || !hasPlan;

  // Show upload state if no plan
  if (!hasPlan && !isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Plan Takeoff</h3>
            <p className="text-sm text-muted-foreground">
              Upload building plans to measure areas for each scope
            </p>
          </div>
          <Badge variant="outline">Optional</Badge>
        </div>

        <PlanUploader onUpload={uploadPlan} isUploading={isUploading} />

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={onSkip} variant="ghost" className="text-muted-foreground">
            Skip — Enter Measurements Manually
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Plan Takeoff</h3>
          <p className="text-sm text-muted-foreground">
            {isCalibrated 
              ? `Mark areas for each scope (${completedCount}/${selectedScopes.length} done)`
              : 'Calibrate the scale first, then mark areas'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={deletePlan} className="text-destructive gap-1">
          <Trash2 className="h-4 w-4" /> Remove Plan
        </Button>
      </div>

      {/* Toolbar */}
      <TakeoffToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onCalibrate={() => setShowCalibration(true)}
        onUndo={() => {}}
        onDelete={() => selectedMarkupId && handleDeleteMarkup(selectedMarkupId)}
        onZoomIn={() => setZoom(z => Math.min(z * 1.25, 3))}
        onZoomOut={() => setZoom(z => Math.max(z / 1.25, 0.25))}
        onFitToScreen={() => setZoom(1)}
        canUndo={false}
        canDelete={!!selectedMarkupId}
        isCalibrated={isCalibrated}
        zoom={zoom}
      />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan viewer placeholder */}
        <div className="lg:col-span-2">
          <Card className="aspect-[4/3] flex items-center justify-center bg-muted/30">
            {takeoff?.plan_url ? (
              <div className="text-center p-8">
                <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Plan viewer with drawing canvas coming soon
                </p>
                <p className="text-xs text-muted-foreground">
                  For now, use the checklist to skip scopes and enter measurements manually
                </p>
                {activeScope && (
                  <Badge className="mt-4" style={{ backgroundColor: getScopeColor(selectedScopes.indexOf(activeScope as ScopeType)) }}>
                    Drawing: {scopeLabels[activeScope]}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading plan...</p>
            )}
          </Card>
        </div>

        {/* Scope checklist */}
        <div>
          <ScopeMarkupChecklist
            scopes={scopes}
            markups={markups}
            skippedScopes={skippedScopes}
            activeScope={activeScope}
            onMarkArea={handleMarkArea}
            onSkipScope={handleSkipScope}
            onEditMarkup={(id) => setSelectedMarkupId(id)}
            onDeleteMarkup={handleDeleteMarkup}
            isCalibrated={isCalibrated}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
            Skip Remaining
          </Button>
          <Button onClick={onContinue} className="gap-1">
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calibration dialog */}
      <CalibrationDialog
        open={showCalibration}
        onOpenChange={setShowCalibration}
        onCalibrate={handleCalibrate}
        onDetectScale={detectScale}
        isCalibrating={isCalibrating}
        calibrationPoints={calibrationPoints}
        currentScale={takeoff?.scale_pixels_per_meter || null}
        currentMethod={takeoff?.scale_calibration_method || null}
      />
    </div>
  );
}
