import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronRight, ChevronLeft, Trash2, AlertTriangle, Plus, MessageSquareWarning } from 'lucide-react';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
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
import { MarkupNameDialog } from './MarkupNameDialog';
import { SlabBeamMarkupDialog, type SlabWorkflowStep, type PendingSlabData } from './SlabBeamMarkupDialog';
import { getScopeColor, calculatePolylineLength, calculatePolygonArea, calculateRectangleArea, calculatePolygonPerimeter, calculateRectanglePerimeter, SLAB_WITH_BEAMS_SCOPES } from '@/types/takeoff';
import type { ScopeType } from '../ScopeSelector';
import type { DrawingTool, TakeoffPoint } from '@/types/takeoff';

interface PlanTakeoffStepProps {
  estimateId: string | null;
  businessId: string | null;
  selectedScopes: ScopeType[];
  scopeLabels: Record<string, string>;
  /** Optional scope to auto-activate when component mounts (from "Mark on plans" button) */
  initialScope?: ScopeType | null;
  /** Callback to clear initialScope after it's been handled */
  onInitialScopeHandled?: () => void;
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
  initialScope,
  onInitialScopeHandled,
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
    addSlabWithBeams,
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
  const [showMarkupNameDialog, setShowMarkupNameDialog] = useState(false);
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
  const [scopePanelManuallyExpanded, setScopePanelManuallyExpanded] = useState(false);
  
  // Pending markup state (for polygon/rectangle before name dialog)
  const [pendingMarkupData, setPendingMarkupData] = useState<{
    points: TakeoffPoint[];
    shapeType: 'polygon' | 'rectangle';
    scopeId: string;
    fileId: string;
    pageNumber: number;
  } | null>(null);

  // Slab with beams workflow state
  const [slabWorkflowActive, setSlabWorkflowActive] = useState(false);
  const [slabWorkflowStep, setSlabWorkflowStep] = useState<SlabWorkflowStep>('name');
  const [showSlabBeamDialog, setShowSlabBeamDialog] = useState(false);
  const [pendingSlabData, setPendingSlabData] = useState<PendingSlabData | null>(null);
  const [currentBeamSegment, setCurrentBeamSegment] = useState<TakeoffPoint[]>([]);

  // Auto-collapse scope panel when actively marking (unless manually expanded)
  const isActivelyMarking = activeScope !== null && activeTool !== 'select';
  const isSlabBeamMarking = slabWorkflowActive && (slabWorkflowStep === 'mark_edge_beams' || slabWorkflowStep === 'mark_internal_beams');
  const isScopePanelCollapsed = (isActivelyMarking || isSlabBeamMarking) && !scopePanelManuallyExpanded;

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

  // Track whether we've handled the initial scope to prevent re-triggering
  const initialScopeHandledRef = useRef(false);

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

  // Auto-activate the initial scope when component mounts and files are loaded
  useEffect(() => {
    // Only trigger once, when we have files, calibration, and a pending scope
    if (
      initialScope &&
      !initialScopeHandledRef.current &&
      hasFiles &&
      isCalibrated &&
      !isLoading
    ) {
      initialScopeHandledRef.current = true;
      // Use handleMarkArea to activate the scope with proper tool selection
      handleMarkArea(initialScope);
      // Notify parent that we've handled it
      onInitialScopeHandled?.();
    }
  }, [initialScope, hasFiles, isCalibrated, isLoading, handleMarkArea, onInitialScopeHandled]);

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
    
    // Check if this is a slab scope that supports beam marking
    const isSlabWithBeamsScope = SLAB_WITH_BEAMS_SCOPES.includes(activeScope as any);
    
    if (isSlabWithBeamsScope && currentScale) {
      // Start multi-step slab workflow
      const existingForScope = markups.filter(m => m.scope_id === activeScope);
      const defaultName = existingForScope.length === 0 
        ? 'Slab 1' 
        : `Slab ${existingForScope.length + 1}`;
      
      setPendingSlabData({
        slabPoints: points,
        slabShapeType: shapeType,
        slabName: defaultName,
        edgeBeamSegments: [],
        edgeBeamDimensions: null,
        internalBeamSegments: [],
        internalBeamDimensions: null,
      });
      setSlabWorkflowActive(true);
      setSlabWorkflowStep('name');
      setShowSlabBeamDialog(true);
      setDrawingPoints([]);
    } else {
      // Standard naming flow for non-slab scopes
      const existingForScope = markups.filter(m => m.scope_id === activeScope);
      const defaultName = existingForScope.length === 0 
        ? 'Area 1' 
        : `Area ${existingForScope.length + 1}`;
      
      setPendingMarkupData({
        points,
        shapeType,
        scopeId: activeScope,
        fileId: currentFileId,
        pageNumber: currentPage,
      });
      setPendingMarkupName(defaultName);
      setShowMarkupNameDialog(true);
    }
  }, [activeScope, currentFileId, markups, currentPage, currentScale]);

  // Handler for confirming markup name and saving
  const handleMarkupNameConfirm = useCallback(async (name: string) => {
    if (!pendingMarkupData) return;
    
    const { points, shapeType, scopeId, fileId, pageNumber } = pendingMarkupData;
    const color = getScopeColor(selectedScopes.indexOf(scopeId as ScopeType));
    
    await addMarkup(fileId, scopeId, shapeType, points, color, pageNumber, name);
    
    // Clear all state
    setPendingMarkupData(null);
    setDrawingPoints([]);
    setActiveTool('select');
    setActiveScope(null);
    setPendingMarkupName('');
  }, [pendingMarkupData, selectedScopes, addMarkup]);

  // Handler for confirming markup name and adding another
  const handleMarkupNameConfirmAndAddAnother = useCallback(async (name: string) => {
    if (!pendingMarkupData) return;
    
    const { points, shapeType, scopeId, fileId, pageNumber } = pendingMarkupData;
    const color = getScopeColor(selectedScopes.indexOf(scopeId as ScopeType));
    
    await addMarkup(fileId, scopeId, shapeType, points, color, pageNumber, name);
    
    // Clear markup data but keep scope and tool active for more marking
    setPendingMarkupData(null);
    setDrawingPoints([]);
    // Keep activeScope and activeTool so user can continue marking
    const existingForScope = markups.filter(m => m.scope_id === scopeId);
    setPendingMarkupName(`Area ${existingForScope.length + 2}`);
  }, [pendingMarkupData, selectedScopes, addMarkup, markups]);

  // ============= SLAB WORKFLOW HANDLERS =============
  
  // Calculate slab stats for the dialog
  const slabStats = useMemo(() => {
    if (!pendingSlabData || !currentScale) return { area: 0, perimeter: 0 };
    
    const { slabPoints, slabShapeType } = pendingSlabData;
    const area = slabShapeType === 'polygon' 
      ? calculatePolygonArea(slabPoints, currentScale)
      : calculateRectangleArea(slabPoints, currentScale);
    const perimeter = slabShapeType === 'polygon'
      ? calculatePolygonPerimeter(slabPoints, currentScale)
      : calculateRectanglePerimeter(slabPoints, currentScale);
    
    return { area, perimeter };
  }, [pendingSlabData, currentScale]);

  // Calculate total edge beam length
  const totalEdgeBeamLength = useMemo(() => {
    if (!pendingSlabData || !currentScale) return 0;
    return pendingSlabData.edgeBeamSegments.reduce((sum, segment) => {
      return sum + calculatePolylineLength(segment, currentScale);
    }, 0);
  }, [pendingSlabData, currentScale]);

  // Calculate total internal beam length
  const totalInternalBeamLength = useMemo(() => {
    if (!pendingSlabData || !currentScale) return 0;
    return pendingSlabData.internalBeamSegments.reduce((sum, segment) => {
      return sum + calculatePolylineLength(segment, currentScale);
    }, 0);
  }, [pendingSlabData, currentScale]);

  // Handler: User wants to add edge beams
  const handleAddEdgeBeams = useCallback(() => {
    setShowSlabBeamDialog(false);
    setSlabWorkflowStep('mark_edge_beams');
    setCurrentBeamSegment([]);
    setActiveTool('polyline');
  }, []);

  // Handler: User skips edge beams (save slab only)
  const handleSkipEdgeBeams = useCallback(async () => {
    if (!pendingSlabData || !activeScope || !currentFileId) return;
    
    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    
    // Save slab without beams
    await addSlabWithBeams(
      currentFileId,
      activeScope,
      {
        points: pendingSlabData.slabPoints,
        shapeType: pendingSlabData.slabShapeType,
        name: pendingSlabData.slabName.trim() || 'Slab',
      },
      null,
      null,
      color,
      currentPage
    );
    
    // Reset all slab workflow state
    setShowSlabBeamDialog(false);
    setSlabWorkflowActive(false);
    setSlabWorkflowStep('name');
    setPendingSlabData(null);
    setActiveTool('select');
    setActiveScope(null);
  }, [pendingSlabData, activeScope, currentFileId, selectedScopes, addSlabWithBeams, currentPage]);

  // Handler: User done marking edge beams (continuous linear marking)
  const handleDoneMarkingEdgeBeams = useCallback(() => {
    // Add current polyline points as a beam segment if it has points
    if (polylinePoints.length >= 2 && pendingSlabData) {
      setPendingSlabData(prev => prev ? {
        ...prev,
        edgeBeamSegments: [...prev.edgeBeamSegments, polylinePoints],
      } : null);
    }
    setPolylinePoints([]);
    setCurrentBeamSegment([]);
    setActiveTool('select');
    setSlabWorkflowStep('edge_beam_dimensions');
    setShowSlabBeamDialog(true);
  }, [polylinePoints, pendingSlabData]);

  // Handler: User wants to add internal beams
  const handleAddInternalBeams = useCallback(() => {
    setShowSlabBeamDialog(false);
    setSlabWorkflowStep('mark_internal_beams');
    setCurrentBeamSegment([]);
    setActiveTool('polyline');
  }, []);

  // Handler: User skips internal beams (save slab + edge beams)
  const handleSkipInternalBeams = useCallback(async () => {
    if (!pendingSlabData || !activeScope || !currentFileId) return;
    
    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    
    // Save slab with edge beams (if any)
    await addSlabWithBeams(
      currentFileId,
      activeScope,
      {
        points: pendingSlabData.slabPoints,
        shapeType: pendingSlabData.slabShapeType,
        name: pendingSlabData.slabName.trim() || 'Slab',
      },
      pendingSlabData.edgeBeamSegments.length > 0 && pendingSlabData.edgeBeamDimensions ? {
        segments: pendingSlabData.edgeBeamSegments,
        width_mm: pendingSlabData.edgeBeamDimensions.width,
        depth_mm: pendingSlabData.edgeBeamDimensions.depth,
        totalLength: totalEdgeBeamLength,
      } : null,
      null,
      color,
      currentPage
    );
    
    // Reset all slab workflow state
    setShowSlabBeamDialog(false);
    setSlabWorkflowActive(false);
    setSlabWorkflowStep('name');
    setPendingSlabData(null);
    setActiveTool('select');
    setActiveScope(null);
  }, [pendingSlabData, activeScope, currentFileId, selectedScopes, addSlabWithBeams, currentPage, totalEdgeBeamLength]);

  // Handler: User done marking internal beams (continuous linear marking)
  const handleDoneMarkingInternalBeams = useCallback(() => {
    // Add current polyline points as a beam segment if it has points
    if (polylinePoints.length >= 2 && pendingSlabData) {
      setPendingSlabData(prev => prev ? {
        ...prev,
        internalBeamSegments: [...prev.internalBeamSegments, polylinePoints],
      } : null);
    }
    setPolylinePoints([]);
    setCurrentBeamSegment([]);
    setActiveTool('select');
    setSlabWorkflowStep('internal_beam_dimensions');
    setShowSlabBeamDialog(true);
  }, [polylinePoints, pendingSlabData]);

  // Handler: User wants to add more internal beams after setting dimensions
  const handleAddMoreInternalBeams = useCallback((currentDimensions: { width: number; depth: number }) => {
    // Save current dimensions to pendingSlabData
    setPendingSlabData(prev => prev ? { ...prev, internalBeamDimensions: currentDimensions } : null);
    // Go back to marking mode for more internal beams
    setShowSlabBeamDialog(false);
    setSlabWorkflowStep('mark_internal_beams');
    setCurrentBeamSegment([]);
    setActiveTool('polyline');
  }, []);

  // Handler: Save everything (slab + edge beams + internal beams)
  // finalInternalDimensions is passed directly from the dialog to avoid React state timing issues
  const handleFinishSlabWorkflow = useCallback(async (finalInternalDimensions?: { width: number; depth: number }) => {
    if (!pendingSlabData || !activeScope || !currentFileId) return;
    
    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    
    // Use finalInternalDimensions if provided, otherwise fall back to pendingSlabData.internalBeamDimensions
    const internalDimensions = finalInternalDimensions || pendingSlabData.internalBeamDimensions;
    
    await addSlabWithBeams(
      currentFileId,
      activeScope,
      {
        points: pendingSlabData.slabPoints,
        shapeType: pendingSlabData.slabShapeType,
        name: pendingSlabData.slabName.trim() || 'Slab',
      },
      pendingSlabData.edgeBeamSegments.length > 0 && pendingSlabData.edgeBeamDimensions ? {
        segments: pendingSlabData.edgeBeamSegments,
        width_mm: pendingSlabData.edgeBeamDimensions.width,
        depth_mm: pendingSlabData.edgeBeamDimensions.depth,
        totalLength: totalEdgeBeamLength,
      } : null,
      pendingSlabData.internalBeamSegments.length > 0 && internalDimensions ? {
        segments: pendingSlabData.internalBeamSegments,
        width_mm: internalDimensions.width,
        depth_mm: internalDimensions.depth,
        totalLength: totalInternalBeamLength,
      } : null,
      color,
      currentPage
    );
    
    // Reset all slab workflow state
    setShowSlabBeamDialog(false);
    setSlabWorkflowActive(false);
    setSlabWorkflowStep('name');
    setPendingSlabData(null);
    setActiveTool('select');
    setActiveScope(null);
  }, [pendingSlabData, activeScope, currentFileId, selectedScopes, addSlabWithBeams, currentPage, totalEdgeBeamLength, totalInternalBeamLength]);

  // Handler: Cancel slab workflow
  const handleCancelSlabWorkflow = useCallback(() => {
    setShowSlabBeamDialog(false);
    setSlabWorkflowActive(false);
    setSlabWorkflowStep('name');
    setPendingSlabData(null);
    setCurrentBeamSegment([]);
    setActiveTool('select');
    setActiveScope(null);
  }, []);

  // Handler: Beam polyline completion during slab workflow (double-click to finish segment)
  const handleSlabBeamPolylineComplete = useCallback((points: TakeoffPoint[], _lengthMeters: number) => {
    if (!pendingSlabData) return;
    
    if (slabWorkflowStep === 'mark_edge_beams') {
      // Add completed segment to edge beams
      setPendingSlabData(prev => prev ? {
        ...prev,
        edgeBeamSegments: [...prev.edgeBeamSegments, points],
      } : null);
      // Reset for next segment
      setCurrentBeamSegment([]);
      setPolylinePoints([]);
    } else if (slabWorkflowStep === 'mark_internal_beams') {
      // Add completed segment to internal beams
      setPendingSlabData(prev => prev ? {
        ...prev,
        internalBeamSegments: [...prev.internalBeamSegments, points],
      } : null);
      // Reset for next segment
      setCurrentBeamSegment([]);
      setPolylinePoints([]);
    }
  }, [pendingSlabData, slabWorkflowStep]);

  // Calculate current beam segment length for display
  const currentBeamLength = useMemo(() => {
    if (!currentScale || polylinePoints.length < 2) return 0;
    return calculatePolylineLength(polylinePoints, currentScale);
  }, [polylinePoints, currentScale]);

  // Total length including current segment
  const displayEdgeBeamLength = useMemo(() => {
    return totalEdgeBeamLength + (slabWorkflowStep === 'mark_edge_beams' ? currentBeamLength : 0);
  }, [totalEdgeBeamLength, slabWorkflowStep, currentBeamLength]);

  const displayInternalBeamLength = useMemo(() => {
    return totalInternalBeamLength + (slabWorkflowStep === 'mark_internal_beams' ? currentBeamLength : 0);
  }, [totalInternalBeamLength, slabWorkflowStep, currentBeamLength]);

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

  // Handler for completing pier marking AND continuing to add more
  const handlePierDimensionsConfirmAndAddAnother = useCallback(async (diameter: number, depth: number) => {
    if (!activeScope || !currentFileId || pierPoints.length === 0) return;

    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    await addPierMarkups(currentFileId, activeScope, pierPoints, diameter, depth, color, currentPage);

    // Clear points but keep tool and scope active for more marking
    setPierPoints([]);
    // Keep activeTool as 'point' and activeScope as current scope
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
    // If in slab beam workflow, handle differently
    if (slabWorkflowActive) {
      if (slabWorkflowStep === 'mark_edge_beams') {
        handleDoneMarkingEdgeBeams();
      } else if (slabWorkflowStep === 'mark_internal_beams') {
        handleDoneMarkingInternalBeams();
      }
      return;
    }
    
    if (polylinePoints.length >= 2 && currentScale) {
      const lengthMeters = calculatePolylineLength(polylinePoints, currentScale);
      setPendingPolylineLength(lengthMeters);
      setShowLinearDimensions(true);
    }
  }, [polylinePoints, currentScale, slabWorkflowActive, slabWorkflowStep, handleDoneMarkingEdgeBeams, handleDoneMarkingInternalBeams]);

  // Handler called by DrawingCanvas when polyline is completed (double-click alternative)
  const handlePolylineComplete = useCallback((points: TakeoffPoint[], lengthMeters: number) => {
    // If in slab beam workflow, add segment and continue
    if (slabWorkflowActive) {
      handleSlabBeamPolylineComplete(points, lengthMeters);
      return;
    }
    
    setPendingPolylineLength(lengthMeters);
    setShowLinearDimensions(true);
  }, [slabWorkflowActive, handleSlabBeamPolylineComplete]);

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
        isPolylineMode={activeTool === 'polyline' && isLinearScope && !isSlabBeamMarking}
        polylineLength={currentScale ? calculatePolylineLength(polylinePoints, currentScale) : 0}
        polylineLabel={activeScope === 'kerbs_channels' ? 'kerb' : activeScope === 'retaining_walls' ? 'wall' : 'footing'}
        onDoneMarkingPolyline={handleDoneMarkingPolyline}
        isBeamMarkingMode={isSlabBeamMarking}
        beamType={slabWorkflowStep === 'mark_edge_beams' ? 'edge' : 'internal'}
        beamSlabName={pendingSlabData?.slabName || 'Slab'}
        beamPointCount={polylinePoints.length}
        beamLength={slabWorkflowStep === 'mark_edge_beams' ? displayEdgeBeamLength : displayInternalBeamLength}
        onDoneMarkingBeams={slabWorkflowStep === 'mark_edge_beams' ? handleDoneMarkingEdgeBeams : handleDoneMarkingInternalBeams}
        onCancelBeamMarking={handleCancelSlabWorkflow}
      />

      {/* Main content - plan takes full space, scopes float on left */}
      <div className="relative flex-1 min-h-0">
        {/* Plan viewer with drawing canvas - takes full width/height */}
        <div className="h-full w-full">
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
                isContinuousPolylineMode={isSlabBeamMarking}
                pendingSlabReference={
                  slabWorkflowActive && pendingSlabData ? {
                    points: pendingSlabData.slabPoints,
                    shapeType: pendingSlabData.slabShapeType,
                    color: activeScope ? getScopeColor(selectedScopes.indexOf(activeScope as ScopeType)) : '#3b82f6',
                    name: pendingSlabData.slabName || undefined,
                  } : undefined
                }
                existingBeamSegments={
                  slabWorkflowActive && pendingSlabData ? [
                    ...pendingSlabData.edgeBeamSegments.map(segment => ({
                      points: segment,
                      type: 'edge' as const,
                    })),
                    ...pendingSlabData.internalBeamSegments.map(segment => ({
                      points: segment,
                      type: 'internal' as const,
                    })),
                  ] : []
                }
                activeBeamType={
                  slabWorkflowStep === 'mark_edge_beams' ? 'edge' 
                  : slabWorkflowStep === 'mark_internal_beams' ? 'internal' 
                  : null
                }
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
            <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Loading plan...</p>
            </div>
          )}
          
          {/* Calibration mode indicator */}
          {isCalibrationMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg border z-20">
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

          {/* Active scope indicator (only for non-pier scopes and not in slab beam workflow) */}
          {activeScope && !isCalibrationMode && !isPierScope && !isLinearScope && !slabWorkflowActive && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap items-center gap-2 bg-card/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg border z-20">
              <Badge 
                style={{ backgroundColor: getScopeColor(selectedScopes.indexOf(activeScope as ScopeType)) }}
              >
                Drawing: {scopeLabels[activeScope]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {activeTool === 'polygon' 
                  ? 'Click to add points, double-click to close'
                  : 'Click and drag to draw rectangle'}
              </span>
            </div>
          )}
        </div>

        {/* Floating scope panel - positioned on left side */}
        <div className="absolute top-2 left-2 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <ScopeMarkupChecklist
              scopes={scopes}
              markups={markups}
              skippedScopes={skippedScopes}
              activeScope={activeScope}
              onMarkArea={(scopeId) => {
                setScopePanelManuallyExpanded(false);
                handleMarkArea(scopeId);
              }}
              onSkipScope={handleSkipScope}
              onEditMarkup={(id) => setSelectedMarkupId(id)}
              onDeleteMarkup={handleDeleteMarkup}
              isCalibrated={isCalibrated}
              isCollapsed={isScopePanelCollapsed}
              onToggle={() => setScopePanelManuallyExpanded(!scopePanelManuallyExpanded)}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-3 pt-4 border-t">
        {/* Testing feedback banner */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquareWarning className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Stuck on an issue? We're still testing and want to help.</span>
          </div>
          <FeedbackDialog 
            trigger={
              <Button variant="outline" size="sm" className="shrink-0 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600">
                Report Issue
              </Button>
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
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
        onConfirmAndAddAnother={handlePierDimensionsConfirmAndAddAnother}
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
        onConfirmAndAddAnother={async (diameter, height, embedment) => {
          if (!activeScope || !currentFileId || pierPoints.length === 0) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          await addBollardMarkups(currentFileId, activeScope, pierPoints, diameter, height, embedment, color, currentPage);
          setPierPoints([]); // Clear points but keep tool and scope active
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
        onConfirmAndAddAnother={async (length, width, depth) => {
          if (!activeScope || !currentFileId || pierPoints.length === 0) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          await addPadMarkups(currentFileId, activeScope, pierPoints, length, width, depth, color, currentPage, activeScope as 'pad_footings' | 'pit_bases');
          setPierPoints([]); // Clear points but keep tool and scope active
        }}
      />

      {/* Linear dimensions dialog */}
      <LinearDimensionsDialog
        open={showLinearDimensions}
        onOpenChange={setShowLinearDimensions}
        lengthMeters={pendingPolylineLength}
        scopeType={activeScope || 'strip_footings'}
        onConfirm={async (width, height, toe) => {
          if (!activeScope || !currentFileId || polylinePoints.length < 2) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          const name = pendingMarkupName.trim() || `Section ${markups.filter(m => m.scope_id === activeScope).length + 1}`;
          await addPolylineMarkup(currentFileId, activeScope, polylinePoints, pendingPolylineLength, width, height, color, currentPage, name, toe);
          setPolylinePoints([]);
          setPendingPolylineLength(0);
          setActiveTool('select');
          setActiveScope(null);
          setPendingMarkupName('');
        }}
        onConfirmAndAddAnother={async (width, height, toe) => {
          if (!activeScope || !currentFileId || polylinePoints.length < 2) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          const name = pendingMarkupName.trim() || `Section ${markups.filter(m => m.scope_id === activeScope).length + 1}`;
          await addPolylineMarkup(currentFileId, activeScope, polylinePoints, pendingPolylineLength, width, height, color, currentPage, name, toe);
          setPolylinePoints([]); // Clear points but keep tool and scope active
          setPendingPolylineLength(0);
          // Update default name for next section
          const existingForScope = markups.filter(m => m.scope_id === activeScope);
          setPendingMarkupName(`Section ${existingForScope.length + 2}`);
        }}
      />

      {/* Markup name dialog for polygon/rectangle */}
      <MarkupNameDialog
        open={showMarkupNameDialog}
        onOpenChange={(open) => {
          setShowMarkupNameDialog(open);
          if (!open && pendingMarkupData) {
            // If dialog is closed without saving, clear pending data and reset state
            setPendingMarkupData(null);
            setDrawingPoints([]);
          }
        }}
        defaultName={pendingMarkupName}
        scopeLabel={pendingMarkupData ? (scopeLabels[pendingMarkupData.scopeId] || pendingMarkupData.scopeId) : ''}
        shapeType={pendingMarkupData?.shapeType || 'polygon'}
        stats={pendingMarkupData && currentScale ? {
          area: pendingMarkupData.shapeType === 'polygon' 
            ? calculatePolygonArea(pendingMarkupData.points, currentScale)
            : calculateRectangleArea(pendingMarkupData.points, currentScale)
        } : undefined}
        onConfirm={handleMarkupNameConfirm}
        onConfirmAndAddAnother={handleMarkupNameConfirmAndAddAnother}
      />

      {/* Slab beam workflow dialog */}
      <SlabBeamMarkupDialog
        open={showSlabBeamDialog}
        onOpenChange={(open) => {
          setShowSlabBeamDialog(open);
          if (!open && !slabWorkflowActive) {
            // Dialog closed without starting workflow, reset
            setPendingSlabData(null);
          }
        }}
        step={slabWorkflowStep}
        slabName={pendingSlabData?.slabName || ''}
        onSlabNameChange={(name) => setPendingSlabData(prev => prev ? { ...prev, slabName: name } : null)}
        scopeLabel={activeScope ? (scopeLabels[activeScope] || activeScope) : ''}
        scopeId={activeScope || undefined}
        slabArea={slabStats.area}
        slabPerimeter={slabStats.perimeter}
        edgeBeamLength={slabWorkflowStep === 'edge_beam_dimensions' ? totalEdgeBeamLength : displayEdgeBeamLength}
        internalBeamLength={slabWorkflowStep === 'internal_beam_dimensions' ? totalInternalBeamLength : displayInternalBeamLength}
        edgeBeamWidth={pendingSlabData?.edgeBeamDimensions?.width || 450}
        edgeBeamDepth={pendingSlabData?.edgeBeamDimensions?.depth || 450}
        onEdgeBeamDimensionsChange={(width, depth) => 
          setPendingSlabData(prev => prev ? { ...prev, edgeBeamDimensions: { width, depth } } : null)
        }
        internalBeamWidth={pendingSlabData?.internalBeamDimensions?.width || 300}
        internalBeamDepth={pendingSlabData?.internalBeamDimensions?.depth || 400}
        onInternalBeamDimensionsChange={(width, depth) => 
          setPendingSlabData(prev => prev ? { ...prev, internalBeamDimensions: { width, depth } } : null)
        }
        wafflePodSize={pendingSlabData?.wafflePodSize || '1090x1090'}
        wafflePodThickness={pendingSlabData?.wafflePodThickness || 225}
        wafflePodTopThickness={pendingSlabData?.wafflePodTopThickness || 85}
        onWafflePodDimensionsChange={(size, podThickness, topThickness) =>
          setPendingSlabData(prev => prev ? { ...prev, wafflePodSize: size, wafflePodThickness: podThickness, wafflePodTopThickness: topThickness } : null)
        }
        onAddEdgeBeams={handleAddEdgeBeams}
        onSkipEdgeBeams={handleSkipEdgeBeams}
        onDoneMarkingEdgeBeams={handleDoneMarkingEdgeBeams}
        onAddInternalBeams={handleAddInternalBeams}
        onSkipInternalBeams={handleSkipInternalBeams}
        onDoneMarkingInternalBeams={handleDoneMarkingInternalBeams}
        onAddMoreInternalBeams={handleAddMoreInternalBeams}
        onFinish={handleFinishSlabWorkflow}
        onCancel={handleCancelSlabWorkflow}
      />
    </div>
  );
}
