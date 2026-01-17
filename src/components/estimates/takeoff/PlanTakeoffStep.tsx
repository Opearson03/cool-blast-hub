import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronRight, ChevronLeft, Trash2, AlertTriangle, Plus } from 'lucide-react';
import { useTakeoffData } from '@/hooks/useTakeoffData';
import { PlanUploader } from './PlanUploader';
import { PlanViewer } from './PlanViewer';
import { DrawingCanvas } from './DrawingCanvas';
import { TakeoffToolbar } from './TakeoffToolbar';
import { ScopeMarkupChecklist } from './ScopeMarkupChecklist';
import { CalibrationDialog } from './CalibrationDialog';
import { PierDimensionsDialog } from './PierDimensionsDialog';
import { BollardDimensionsDialog } from './BollardDimensionsDialog';
import { PadFootingDimensionsDialog } from './PadFootingDimensionsDialog';
import { LinearDimensionsDialog } from './LinearDimensionsDialog';
import { getScopeColor, calculatePolylineLength } from '@/types/takeoff';
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
  isNavigating?: boolean;
}

export function PlanTakeoffStep({
  estimateId,
  businessId,
  selectedScopes,
  scopeLabels,
  onContinue,
  onBack,
  onSkip,
  isNavigating = false
}: PlanTakeoffStepProps) {
  const {
    takeoff,
    files,
    markups,
    currentFileId,
    isLoading,
    isUploading,
    addFile,
    removeFile,
    setCurrentFile,
    setPageScale,
    getPageScale,
    deletePlan,
    addMarkup,
    addPierMarkups,
    addBollardMarkups,
    addPadMarkups,
    addPolylineMarkup,
    deleteMarkup,
    setCurrentPage
  } = useTakeoffData({ estimateId, businessId });

  const [activeTool, setActiveTool] = useState<DrawingTool['type']>('select');
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [pendingMarkupName, setPendingMarkupName] = useState<string>('');
  const [skippedScopes, setSkippedScopes] = useState<Set<string>>(new Set());
  const [showCalibration, setShowCalibration] = useState(false);
  const [showPierDimensions, setShowPierDimensions] = useState(false);
  const [showBollardDimensions, setShowBollardDimensions] = useState(false);
  const [showPadDimensions, setShowPadDimensions] = useState(false);
  const [showLinearDimensions, setShowLinearDimensions] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<TakeoffPoint[]>([]);
  const [pierPoints, setPierPoints] = useState<TakeoffPoint[]>([]);
  const [polylinePoints, setPolylinePoints] = useState<TakeoffPoint[]>([]);
  const [pendingPolylineLength, setPendingPolylineLength] = useState<number>(0);
  const [planDimensions, setPlanDimensions] = useState({ width: 0, height: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [calibrationPoints, setCalibrationPoints] = useState<TakeoffPoint[]>([]);
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);

  const currentFile = files.find(f => f.id === currentFileId);
  const currentPage = takeoff?.current_page || 1;
  const currentScale = currentFileId ? getPageScale(currentFileId, currentPage) : null;
  const isCalibrated = !!currentScale;
  const hasFiles = files.length > 0;

  // Define scope types for different drawing tools
  const POINT_SCOPES = ['piers', 'bollards', 'pad_footings', 'pit_bases'];
  const LINEAR_SCOPES = ['strip_footings', 'retaining_wall_footings', 'kerbs_channels', 'retaining_walls'];
  
  const isPointScope = activeScope !== null && POINT_SCOPES.includes(activeScope);
  const isLinearScope = activeScope !== null && LINEAR_SCOPES.includes(activeScope);
  const isPierScope = activeScope === 'piers';
  const isBollardScope = activeScope === 'bollards';
  const isPadScope = activeScope === 'pad_footings' || activeScope === 'pit_bases';

  const scopes = useMemo(() => 
    selectedScopes.map(id => ({ id, label: scopeLabels[id] || id })),
    [selectedScopes, scopeLabels]
  );

  const handleUploadFile = useCallback(async (file: File) => {
    await addFile(file);
  }, [addFile]);

  const handleMarkArea = useCallback((scopeId: string) => {
    if (!isCalibrated) {
      setShowCalibration(true);
      return;
    }
    
    setActiveScope(scopeId);
    
    // Check scope type and set appropriate tool
    const isPointType = POINT_SCOPES.includes(scopeId);
    const isLinearType = LINEAR_SCOPES.includes(scopeId);
    
    if (isPointType) {
      // Use point tool for piers, bollards, pads
      setPierPoints([]);
      setActiveTool('point');
    } else if (isLinearType) {
      // Use polyline tool for linear elements
      setPolylinePoints([]);
      setPendingPolylineLength(0);
      const existingForScope = markups.filter(m => m.scope_id === scopeId);
      const defaultName = existingForScope.length === 0 
        ? 'Section 1' 
        : `Section ${existingForScope.length + 1}`;
      setPendingMarkupName(defaultName);
      setActiveTool('polyline');
    } else {
      // Generate default name based on existing markups for this scope
      const existingForScope = markups.filter(m => m.scope_id === scopeId);
      const defaultName = existingForScope.length === 0 
        ? 'Area 1' 
        : `Area ${existingForScope.length + 1}`;
      setPendingMarkupName(defaultName);
      setActiveTool('polygon');
      setDrawingPoints([]);
    }
  }, [markups, isCalibrated]);

  const handleSkipScope = (scopeId: string) => {
    setSkippedScopes(prev => new Set([...prev, scopeId]));
  };

  const handleDeleteMarkup = async (markupId: string) => {
    await deleteMarkup(markupId);
    setSelectedMarkupId(null);
  };

  const handleCalibrate = async (pixelsPerMeter: number) => {
    if (!currentFileId) return;
    await setPageScale(currentFileId, currentPage, pixelsPerMeter);
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
    if (!activeScope || !currentFileId) return;
    
    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    const name = pendingMarkupName.trim() || `Area ${markups.filter(m => m.scope_id === activeScope).length + 1}`;
    await addMarkup(currentFileId, activeScope, shapeType, points, color, currentPage, name);
    
    // Clear drawing state
    setDrawingPoints([]);
    setActiveTool('select');
    setActiveScope(null);
    setPendingMarkupName('');
  }, [activeScope, currentFileId, selectedScopes, addMarkup, pendingMarkupName, markups, currentPage]);

  // Handler for completing pier marking
  const handlePierDimensionsConfirm = useCallback(async (diameter: number, depth: number) => {
    if (!activeScope || !currentFileId || pierPoints.length === 0) return;

    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    await addPierMarkups(currentFileId, activeScope, pierPoints, diameter, depth, color, currentPage);

    // Clear state
    setPierPoints([]);
    setActiveTool('select');
    setActiveScope(null);
  }, [activeScope, currentFileId, pierPoints, selectedScopes, addPierMarkups, currentPage]);

  // Handler for "Done" button when marking piers/bollards/pads
  const handleDoneMarkingPiers = useCallback(() => {
    if (pierPoints.length > 0) {
      if (isBollardScope) {
        setShowBollardDimensions(true);
      } else if (isPadScope) {
        setShowPadDimensions(true);
      } else {
        setShowPierDimensions(true);
      }
    }
  }, [pierPoints.length, isBollardScope, isPadScope]);

  // Handler for completing polyline drawing - called when user clicks "Done" on polyline toolbar
  const handleDoneMarkingPolyline = useCallback(() => {
    if (polylinePoints.length >= 2 && currentScale) {
      const lengthMeters = calculatePolylineLength(polylinePoints, currentScale);
      setPendingPolylineLength(lengthMeters);
      setShowLinearDimensions(true);
    }
  }, [polylinePoints, currentScale]);

  // Handler called by DrawingCanvas when polyline is completed (double-click alternative)
  const handlePolylineComplete = useCallback((points: TakeoffPoint[], lengthMeters: number) => {
    setPendingPolylineLength(lengthMeters);
    setShowLinearDimensions(true);
  }, []);

  const handleUndo = useCallback(() => {
    // Undo polyline point
    if (activeTool === 'polyline' && polylinePoints.length > 0) {
      setPolylinePoints(prev => prev.slice(0, -1));
      return;
    }
    
    // Undo pier/bollard/pad point
    if (activeTool === 'point' && pierPoints.length > 0) {
      setPierPoints(prev => prev.slice(0, -1));
      return;
    }
    
    // Undo polygon vertex
    if (drawingPoints.length > 0) {
      setDrawingPoints(prev => prev.slice(0, -1));
    }
  }, [activeTool, polylinePoints.length, pierPoints.length, drawingPoints.length]);

  const handleToolChange = useCallback((tool: DrawingTool['type']) => {
    setActiveTool(tool);
    if (tool !== 'polygon' && tool !== 'rectangle') {
      setDrawingPoints([]);
    }
    if (tool !== 'polyline') {
      setPolylinePoints([]);
    }
  }, []);

  const handleDimensionsChange = useCallback((dimensions: { width: number; height: number }) => {
    setPlanDimensions(dimensions);
  }, []);

  const handlePagesLoaded = useCallback((count: number) => {
    setTotalPages(count);
  }, []);

  // Only show markups after plan dimensions are loaded (prevents misaligned rendering)
  const dimensionsReady = planDimensions.width > 0 && planDimensions.height > 0;
  
  // Filter markups to only show those on the current page and file
  // When actively marking a scope, only show markups for that scope to reduce clutter
  const currentPageMarkups = useMemo(() => {
    if (!dimensionsReady || !currentFileId) return [];
    
    let filtered = markups.filter(m => 
      m.file_id === currentFileId && 
      (m.page_number === currentPage || m.page_number === null)
    );
    
    // If actively marking a scope, only show markups for that scope
    if (activeScope && activeTool !== 'select') {
      filtered = filtered.filter(m => m.scope_id === activeScope);
    }
    
    return filtered;
  }, [markups, currentPage, currentFileId, dimensionsReady, activeScope, activeTool]);

  const completedCount = markups.length + skippedScopes.size;
  const canContinue = completedCount === selectedScopes.length || !hasFiles;

  // Show upload state if no files
  if (!hasFiles && !isLoading) {
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

        <PlanUploader onUpload={handleUploadFile} isUploading={isUploading} />

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} disabled={isNavigating} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={onSkip} disabled={isNavigating} variant="ghost" className="text-muted-foreground">
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
              : 'Set the scale first, then mark areas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => document.getElementById('add-more-files')?.click()}
            className="gap-1"
          >
            <Plus className="h-4 w-4" /> Add File
          </Button>
          <input
            id="add-more-files"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadFile(file);
              e.target.value = '';
            }}
          />
          <Button variant="ghost" size="sm" onClick={deletePlan} className="text-destructive gap-1">
            <Trash2 className="h-4 w-4" /> Remove All
          </Button>
        </div>
      </div>

      {/* Calibration required banner */}
      {!isCalibrated && hasFiles && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">
            Scale Not Set for Page {currentPage}
          </AlertTitle>
          <AlertDescription className="text-amber-700/80 dark:text-amber-400/80">
            <p className="mb-3">
              Before you can mark areas, you need to set the scale so measurements are accurate.
            </p>
            <div className="space-y-2 text-sm mb-4">
              <p><strong>How to set the scale:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Find a dimension line or known distance on this drawing</li>
                <li>Click "Set Scale" then click the two ends of that line</li>
                <li>Enter the real-world distance (e.g., 10 meters)</li>
              </ol>
            </div>
            <Button 
              onClick={() => setShowCalibration(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Set Scale for This Page
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
        canUndo={activeTool === 'polyline' ? polylinePoints.length > 0 : activeTool === 'point' ? pierPoints.length > 0 : drawingPoints.length > 0}
        canDelete={!!selectedMarkupId}
        isCalibrated={isCalibrated}
        currentScale={currentScale}
        zoom={zoom}
        files={files}
        currentFileId={currentFileId}
        onFileChange={setCurrentFile}
        currentPage={currentPage}
        isPointMode={activeTool === 'point' && isPointScope}
        pointCount={pierPoints.length}
        pointLabel={activeScope === 'bollards' ? 'bollard' : activeScope === 'pad_footings' ? 'pad footing' : activeScope === 'pit_bases' ? 'pit base' : 'pier'}
        onDoneMarkingPoints={handleDoneMarkingPiers}
        isPolylineMode={activeTool === 'polyline' && isLinearScope}
        polylineLength={currentScale ? calculatePolylineLength(polylinePoints, currentScale) : 0}
        polylineLabel={activeScope === 'kerbs_channels' ? 'kerb' : activeScope === 'retaining_walls' ? 'wall' : 'footing'}
        onDoneMarkingPolyline={handleDoneMarkingPolyline}
      />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan viewer with drawing canvas */}
        <div className="lg:col-span-2">
          {currentFile?.file_url ? (
            <PlanViewer
              planUrl={currentFile.file_url}
              planType={currentFile.file_type}
              pageNumber={currentPage}
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
                pixelsPerMeter={currentScale}
                isCalibrationMode={isCalibrationMode}
                calibrationPoints={calibrationPoints}
                pierPoints={pierPoints}
                polylinePoints={polylinePoints}
                onMarkupComplete={handleMarkupComplete}
                onPolylineComplete={handlePolylineComplete}
                onMarkupSelect={setSelectedMarkupId}
                onMarkupUpdate={() => {}}
                onPointsChange={setDrawingPoints}
                onCalibrationPointsChange={handleCalibrationPointsChange}
                onPierPointsChange={setPierPoints}
                onPolylinePointsChange={setPolylinePoints}
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

          {/* Active scope indicator with name input (only for non-pier scopes) */}
          {activeScope && !isCalibrationMode && !isPierScope && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge 
                style={{ backgroundColor: getScopeColor(selectedScopes.indexOf(activeScope as ScopeType)) }}
              >
                Drawing: {scopeLabels[activeScope]}
              </Badge>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Name:</span>
                <Input
                  value={pendingMarkupName}
                  onChange={(e) => setPendingMarkupName(e.target.value)}
                  placeholder="Area 1"
                  className="h-7 w-32 text-xs"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {activeTool === 'polygon' 
                  ? 'Click to add points, double-click to close'
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
        <Button variant="outline" onClick={onBack} disabled={isNavigating} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip} disabled={isNavigating} className="text-muted-foreground">
            Skip Remaining
          </Button>
          <Button onClick={onContinue} disabled={isNavigating} className="gap-1">
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
        currentScale={currentScale}
        pageNumber={currentPage}
      />

      {/* Pier dimensions dialog */}
      <PierDimensionsDialog
        open={showPierDimensions}
        onOpenChange={setShowPierDimensions}
        pierCount={pierPoints.length}
        onConfirm={handlePierDimensionsConfirm}
      />

      {/* Bollard dimensions dialog */}
      <BollardDimensionsDialog
        open={showBollardDimensions}
        onOpenChange={setShowBollardDimensions}
        bollardCount={pierPoints.length}
        onConfirm={async (diameter, height, embedment) => {
          if (!activeScope || !currentFileId || pierPoints.length === 0) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          await addBollardMarkups(currentFileId, activeScope, pierPoints, diameter, height, embedment, color, currentPage);
          setPierPoints([]);
          setActiveTool('select');
          setActiveScope(null);
        }}
      />

      {/* Pad footing dimensions dialog */}
      <PadFootingDimensionsDialog
        open={showPadDimensions}
        onOpenChange={setShowPadDimensions}
        padCount={pierPoints.length}
        scopeType={activeScope === 'pit_bases' ? 'pit_bases' : 'pad_footings'}
        onConfirm={async (length, width, depth) => {
          if (!activeScope || !currentFileId || pierPoints.length === 0) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          await addPadMarkups(currentFileId, activeScope, pierPoints, length, width, depth, color, currentPage, activeScope as 'pad_footings' | 'pit_bases');
          setPierPoints([]);
          setActiveTool('select');
          setActiveScope(null);
        }}
      />

      {/* Linear dimensions dialog */}
      <LinearDimensionsDialog
        open={showLinearDimensions}
        onOpenChange={setShowLinearDimensions}
        lengthMeters={pendingPolylineLength}
        scopeType={activeScope || 'strip_footings'}
        onConfirm={async (width, height) => {
          if (!activeScope || !currentFileId || polylinePoints.length < 2) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          const name = pendingMarkupName.trim() || `Section ${markups.filter(m => m.scope_id === activeScope).length + 1}`;
          await addPolylineMarkup(currentFileId, activeScope, polylinePoints, pendingPolylineLength, width, height, color, currentPage, name);
          setPolylinePoints([]);
          setPendingPolylineLength(0);
          setActiveTool('select');
          setActiveScope(null);
          setPendingMarkupName('');
        }}
      />
    </div>
  );
}
