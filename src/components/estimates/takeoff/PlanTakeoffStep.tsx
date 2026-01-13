import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { useTakeoffData } from '@/hooks/useTakeoffData';
import { PlanUploader } from './PlanUploader';
import { PlanViewer } from './PlanViewer';
import { DrawingCanvas } from './DrawingCanvas';
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
    uploadPlan,
    deletePlan,
    setScale,
    addMarkup,
    deleteMarkup,
    setCurrentPage
  } = useTakeoffData({ estimateId, businessId });

  const [activeTool, setActiveTool] = useState<DrawingTool['type']>('select');
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [skippedScopes, setSkippedScopes] = useState<Set<string>>(new Set());
  const [showCalibration, setShowCalibration] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<TakeoffPoint[]>([]);
  const [planDimensions, setPlanDimensions] = useState({ width: 0, height: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [calibrationPoints, setCalibrationPoints] = useState<TakeoffPoint[]>([]);
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);

  const isCalibrated = !!takeoff?.scale_pixels_per_meter;
  const hasPlan = !!takeoff?.plan_url;

  const scopes = useMemo(() => 
    selectedScopes.map(id => ({ id, label: scopeLabels[id] || id })),
    [selectedScopes, scopeLabels]
  );

  const handleMarkArea = useCallback((scopeId: string) => {
    setActiveScope(scopeId);
    setActiveTool('polygon');
    setDrawingPoints([]);
  }, []);

  const handleSkipScope = (scopeId: string) => {
    setSkippedScopes(prev => new Set([...prev, scopeId]));
  };

  const handleDeleteMarkup = async (markupId: string) => {
    await deleteMarkup(markupId);
    setSelectedMarkupId(null);
  };

  const handleCalibrate = async (pixelsPerMeter: number, method: 'ai' | 'manual') => {
    await setScale(pixelsPerMeter, method);
    setIsCalibrationMode(false);
    setCalibrationPoints([]);
  };

  const handleCalibrationPointsChange = useCallback((points: TakeoffPoint[]) => {
    setCalibrationPoints(points);
    // When 2 points are placed, show the calibration dialog
    if (points.length === 2) {
      setIsCalibrationMode(false);
      setShowCalibration(true);
    }
  }, []);

  const handleMarkupComplete = useCallback(async (points: TakeoffPoint[], shapeType: 'polygon' | 'rectangle') => {
    if (!activeScope) return;
    
    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    await addMarkup(activeScope, shapeType, points, color);
    
    // Clear drawing state
    setDrawingPoints([]);
    setActiveTool('select');
    setActiveScope(null);
  }, [activeScope, selectedScopes, addMarkup]);

  const handleUndo = useCallback(() => {
    if (drawingPoints.length > 0) {
      setDrawingPoints(prev => prev.slice(0, -1));
    }
  }, [drawingPoints.length]);

  const handleToolChange = useCallback((tool: DrawingTool['type']) => {
    setActiveTool(tool);
    if (tool !== 'polygon' && tool !== 'rectangle') {
      setDrawingPoints([]);
    }
  }, []);

  const handleDimensionsChange = useCallback((dimensions: { width: number; height: number }) => {
    setPlanDimensions(dimensions);
  }, []);

  const handlePagesLoaded = useCallback((count: number) => {
    setTotalPages(count);
  }, []);

  const currentPage = takeoff?.current_page || 1;
  
  // Filter markups to only show those on the current page
  const currentPageMarkups = useMemo(() => 
    markups.filter(m => m.page_number === currentPage || m.page_number === null),
    [markups, currentPage]
  );

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
        onToolChange={handleToolChange}
        onCalibrate={() => setShowCalibration(true)}
        onUndo={handleUndo}
        onDelete={() => selectedMarkupId && handleDeleteMarkup(selectedMarkupId)}
        onZoomIn={() => setZoom(z => Math.min(z * 1.25, 3))}
        onZoomOut={() => setZoom(z => Math.max(z / 1.25, 0.25))}
        onFitToScreen={() => setZoom(1)}
        canUndo={drawingPoints.length > 0}
        canDelete={!!selectedMarkupId}
        isCalibrated={isCalibrated}
        zoom={zoom}
      />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan viewer with drawing canvas */}
        <div className="lg:col-span-2">
          {takeoff?.plan_url ? (
            <PlanViewer
              planUrl={takeoff.plan_url}
              planType={takeoff.plan_type as 'pdf' | 'image'}
              pageNumber={takeoff.current_page || 1}
              totalPages={totalPages}
              zoom={zoom}
              onPageChange={setCurrentPage}
              onPagesLoaded={handlePagesLoaded}
              onDimensionsChange={handleDimensionsChange}
            >
              <DrawingCanvas
                width={planDimensions.width}
                height={planDimensions.height}
                tool={activeTool}
                activeScope={activeScope}
                activeScopeColor={activeScope ? getScopeColor(selectedScopes.indexOf(activeScope as ScopeType)) : '#3b82f6'}
                markups={currentPageMarkups}
                selectedMarkupId={selectedMarkupId}
                isCalibrated={isCalibrated}
                pixelsPerMeter={takeoff.scale_pixels_per_meter}
                isCalibrationMode={isCalibrationMode}
                calibrationPoints={calibrationPoints}
                onMarkupComplete={handleMarkupComplete}
                onMarkupSelect={setSelectedMarkupId}
                onMarkupUpdate={() => {}}
                onPointsChange={setDrawingPoints}
                onCalibrationPointsChange={handleCalibrationPointsChange}
              />
            </PlanViewer>
          ) : (
            <div className="aspect-[4/3] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Loading plan...</p>
            </div>
          )}
          
          {/* Calibration mode indicator */}
          {isCalibrationMode && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                Setting Scale: {calibrationPoints.length}/2 points placed
              </Badge>
              <span className="text-xs text-muted-foreground">
                Click two points on the plan that are a known distance apart
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCalibrationMode(false);
                  setCalibrationPoints([]);
                }}
                className="text-xs h-6"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Active scope indicator */}
          {activeScope && !isCalibrationMode && (
            <div className="mt-2 flex items-center gap-2">
              <Badge 
                style={{ backgroundColor: getScopeColor(selectedScopes.indexOf(activeScope as ScopeType)) }}
              >
                Drawing: {scopeLabels[activeScope]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {activeTool === 'polygon' 
                  ? 'Click to add points, double-click or click first point to close'
                  : 'Click and drag to draw rectangle'}
              </span>
            </div>
          )}
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
        onStartCalibration={() => {
          setCalibrationPoints([]);
          setIsCalibrationMode(true);
          setActiveTool('select');
        }}
        calibrationPoints={calibrationPoints}
        currentScale={takeoff?.scale_pixels_per_meter || null}
        currentMethod={takeoff?.scale_calibration_method || null}
      />
    </div>
  );
}
