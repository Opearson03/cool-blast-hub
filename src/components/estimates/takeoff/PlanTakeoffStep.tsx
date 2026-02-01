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
import { LinearDimensionsDialog, type ExistingLinearSegment, type PolylineSegment } from './LinearDimensionsDialog';
import { MarkupNameDialog } from './MarkupNameDialog';
import { SlabBeamMarkupDialog, SlabBeamMarkingBar, type SlabWorkflowStep, type PendingSlabData, type BeamData } from './SlabBeamMarkupDialog';
import { EditBeamDialog } from './EditBeamDialog';
// WafflePodCountDialog and WafflePodFloatingInput removed - counts now auto-calculated in SlabBeamMarkupDialog
import { getScopeColor, calculatePolylineLength, calculatePolygonArea, calculateRectangleArea, calculatePolygonPerimeter, calculateRectanglePerimeter, SLAB_WITH_BEAMS_SCOPES, isWafflePodPointScope } from '@/types/takeoff';
import type { ScopeType } from '../ScopeSelector';
import type { DrawingTool, TakeoffPoint, TakeoffMarkup, WafflePodPointScope } from '@/types/takeoff';

interface PlanTakeoffStepProps {
  estimateId: string | null;
  businessId: string | null;
  selectedScopes: ScopeType[];
  scopeLabels: Record<string, string>;
  /** Optional scope to auto-activate when component mounts (from "Mark on plans" button) 
   * Can be a ScopeType or a string identifier like "scopeId:beamType:typeName" */
  initialScope?: ScopeType | string | null;
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
    addBeamToSlab,
    updateBeamMarkup,
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


  // ============= NEW SLAB WORKFLOW STATE =============
  const [slabWorkflowActive, setSlabWorkflowActive] = useState(false);
  const [slabWorkflowStep, setSlabWorkflowStep] = useState<SlabWorkflowStep>('name');
  const [showSlabBeamDialog, setShowSlabBeamDialog] = useState(false);
  const [pendingSlabData, setPendingSlabData] = useState<PendingSlabData | null>(null);
  // Current beam being drawn (points collected before naming)
  const [currentBeamPoints, setCurrentBeamPoints] = useState<TakeoffPoint[]>([]);
  // Cached beam length and segments (set before clearing polylinePoints)
  const [cachedBeamLength, setCachedBeamLength] = useState<number>(0);
  const [cachedBeamSegments, setCachedBeamSegments] = useState<Array<{ startPoint: TakeoffPoint; endPoint: TakeoffPoint; length: number }>>([]);
  
  // Edit beam dialog state
  const [editingBeam, setEditingBeam] = useState<TakeoffMarkup | null>(null);
  
  // State for discrete internal beams (each pair of clicks = one separate beam)
  const [discreteInternalBeams, setDiscreteInternalBeams] = useState<
    Array<{ startPoint: TakeoffPoint; endPoint: TakeoffPoint; length: number }>
  >([]);
  
  // Track if slab has already been saved (prevents duplicate saves)
  const [slabSavedId, setSlabSavedId] = useState<string | null>(null);
  
  // State for adding beams to existing slabs
  const [addingBeamToSlabId, setAddingBeamToSlabId] = useState<string | null>(null);
  const [addingBeamType, setAddingBeamType] = useState<'edge_beam' | 'internal_beam' | null>(null);
  const [showAddBeamDimensionsDialog, setShowAddBeamDimensionsDialog] = useState(false);
  const [pendingBeamPoints, setPendingBeamPoints] = useState<TakeoffPoint[]>([]);
  const [pendingBeamLength, setPendingBeamLength] = useState<number>(0);
  
  // Preselected linear type (for adding segments to existing types from sidebar)
  const [preselectedLinearType, setPreselectedLinearType] = useState<{
    typeName: string;
    width: number;
    depth: number;
  } | null>(null);
  
  // ============= WAFFLE POD STATE (Auto-calculated, no longer counting) =============
  // These are kept for backward compatibility but counting workflow is removed
  const [wafflePodDepth, setWafflePodDepth] = useState<string>('225');
  
  const isActivelyMarking = activeScope !== null && activeTool !== 'select';
  const isSlabBeamMarking = slabWorkflowActive && (slabWorkflowStep === 'mark_edge_beam' || slabWorkflowStep === 'mark_internal_beam');
  const isAddingBeamToExistingSlab = addingBeamToSlabId !== null && activeTool === 'polyline';
  const isScopePanelCollapsed = (isActivelyMarking || isSlabBeamMarking || isAddingBeamToExistingSlab) && !scopePanelManuallyExpanded;

  const currentFile = files.find(f => f.id === currentFileId);
  const currentPage = takeoff?.current_page || 1;
  const currentScale = currentFileId ? getPageScale(currentFileId, currentPage) : null;
  const isCalibrated = !!currentScale;
  const hasFiles = files.length > 0;

  // Define scope types for different drawing tools
  const POINT_SCOPES = ['piers', 'bollards', 'pit_bases', 'pad_footings'];
  const LINEAR_SCOPES = ['strip_footings', 'retaining_wall_footings', 'kerbs_channels', 'retaining_walls', 'expansion_joints', 'control_joints'];
  
  const isPointScope = activeScope !== null && POINT_SCOPES.includes(activeScope);
  const isLinearScope = activeScope !== null && LINEAR_SCOPES.includes(activeScope);
  const isPierScope = activeScope === 'piers';
  const isBollardScope = activeScope === 'bollards';
  const isPadScope = activeScope === 'pit_bases' || activeScope === 'pad_footings'; // Both use point tool now

  const scopes = useMemo(() => 
    selectedScopes.map(id => ({ id, label: scopeLabels[id] || id })),
    [selectedScopes, scopeLabels]
  );

  // Get existing beams for the slab we're adding to (for beam type grouping)
  const existingBeamsForAddDialog = useMemo(() => {
    if (!addingBeamToSlabId || !addingBeamType) return [];
    
    // Find all beams that belong to the same parent slab and match the beam type
    const beamMarkupType = addingBeamType; // 'edge_beam' or 'internal_beam'
    return markups
      .filter(m => m.parent_markup_id === addingBeamToSlabId && m.markup_type === beamMarkupType)
      .map(m => ({
        id: m.id,
        name: m.name || '',
        width: m.width_mm || 450,
        depth: m.height_mm || 450,
        length: m.length_m || 0,
      }));
  }, [addingBeamToSlabId, addingBeamType, markups]);

  // Get existing linear segments for the active linear scope (for type grouping)
  const existingLinearSegments = useMemo((): ExistingLinearSegment[] => {
    if (!activeScope || !LINEAR_SCOPES.includes(activeScope)) return [];
    
    return markups
      .filter(m => m.scope_id === activeScope && m.shape_type === 'polyline')
      .map(m => ({
        id: m.id,
        name: m.name || '',
        width: m.width_mm || 450,
        depth: m.height_mm || 300,
        length: m.length_m || 0,
      }));
  }, [activeScope, markups]);

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
      // Extract base scope from identifier (e.g., "raft_slab:edge_beam:EB1" -> "raft_slab")
      const scopeToActivate = (typeof initialScope === 'string' && initialScope.includes(':'))
        ? initialScope.split(':')[0]
        : initialScope;
      // Use handleMarkArea to activate the scope with proper tool selection
      handleMarkArea(scopeToActivate);
      // Notify parent that we've handled it
      onInitialScopeHandled?.();
    }
  }, [initialScope, hasFiles, isCalibrated, isLoading, handleMarkArea, onInitialScopeHandled]);

  const handleSkipScope = (scopeId: string) => {
    setSkippedScopes(prev => new Set([...prev, scopeId]));
  };

  // Handler for adding a new segment to an existing linear type from sidebar
  const handleAddToLinearType = useCallback((scopeId: string, typeName: string, width: number, depth: number) => {
    if (!isCalibrated) {
      setShowCalibration(true);
      return;
    }
    
    // Set the scope active and store the preselected type
    setActiveScope(scopeId);
    setPreselectedLinearType({ typeName, width, depth });
    setPolylinePoints([]);
    setPendingPolylineLength(0);
    setActiveTool('polyline');
  }, [isCalibrated]);

  const handleDeleteMarkup = async (markupId: string) => {
    await deleteMarkup(markupId);
    setSelectedMarkupId(null);
  };

  const handleEditBeam = useCallback((markupId: string) => {
    const beam = markups.find(m => m.id === markupId);
    if (beam && (beam.markup_type === 'edge_beam' || beam.markup_type === 'internal_beam')) {
      setEditingBeam(beam);
    }
  }, [markups]);

  const handleSaveBeamEdit = useCallback(async (data: { name: string; width: number; depth: number }) => {
    if (!editingBeam) return;
    await updateBeamMarkup(editingBeam.id, {
      name: data.name,
      width_mm: data.width,
      height_mm: data.depth,
    });
    setEditingBeam(null);
  }, [editingBeam, updateBeamMarkup]);

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
        edgeBeams: [],
        internalBeams: [],
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

  // ============= NEW SLAB WORKFLOW HANDLERS =============
  
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

  // Calculate current beam length
  const currentBeamLength = useMemo(() => {
    if (!currentScale || polylinePoints.length < 2) return 0;
    return calculatePolylineLength(polylinePoints, currentScale);
  }, [polylinePoints, currentScale]);

  // Calculate individual polyline segments for linear scopes
  const polylineSegments = useMemo(() => {
    if (!currentScale || polylinePoints.length < 2) return [];
    
    return polylinePoints.slice(0, -1).map((point, i) => {
      const nextPoint = polylinePoints[i + 1];
      const pixelLength = Math.sqrt(
        Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
      );
      return {
        startPoint: point,
        endPoint: nextPoint,
        length: pixelLength / currentScale,
      };
    });
  }, [polylinePoints, currentScale]);

  // Handler: Start drawing edge beams
  const handleStartEdgeBeams = useCallback(() => {
    setShowSlabBeamDialog(false);
    setSlabWorkflowStep('mark_edge_beam');
    setPolylinePoints([]);
    setActiveTool('polyline');
  }, []);

  // Handler: Use slab perimeter as edge beam (skip manual marking)
  const handleUsePerimeterAsEdgeBeam = useCallback(() => {
    if (!pendingSlabData || !currentScale) return;
    
    const { slabPoints, slabShapeType } = pendingSlabData;
    
    // Convert slab polygon/rectangle to a closed polyline for the edge beam
    let edgeBeamPoints: TakeoffPoint[];
    
    if (slabShapeType === 'polygon') {
      // Close the polygon by adding first point at end
      edgeBeamPoints = [...slabPoints, slabPoints[0]];
    } else {
      // Rectangle: expand 2 corners into 4 corners + close
      const [p1, p2] = slabPoints;
      edgeBeamPoints = [
        { x: p1.x, y: p1.y },  // top-left
        { x: p2.x, y: p1.y },  // top-right
        { x: p2.x, y: p2.y },  // bottom-right
        { x: p1.x, y: p2.y },  // bottom-left
        { x: p1.x, y: p1.y },  // close back to top-left
      ];
    }
    
    // Calculate segments from the closed polyline
    const segments = edgeBeamPoints.slice(0, -1).map((point, i) => {
      const nextPoint = edgeBeamPoints[i + 1];
      const pixelLength = Math.sqrt(
        Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
      );
      return {
        startPoint: point,
        endPoint: nextPoint,
        length: pixelLength / currentScale,
      };
    });
    
    // Cache beam data with pre-calculated perimeter
    setCachedBeamLength(slabStats.perimeter);
    setCachedBeamSegments(segments);
    setCurrentBeamPoints(edgeBeamPoints);
    
    // Skip directly to edge_beam_details step
    setSlabWorkflowStep('edge_beam_details');
    setShowSlabBeamDialog(true);
  }, [pendingSlabData, currentScale, slabStats.perimeter]);

  // Handler: Skip all beams and save slab only
  const handleSkipAllBeams = useCallback(async () => {
    if (!pendingSlabData || !activeScope || !currentFileId) return;
    
    // Idempotency check: only save if slab hasn't been saved yet
    if (slabSavedId) {
      resetSlabWorkflow();
      return;
    }
    
    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    
    // Save slab without beams
    const slabMarkup = await addSlabWithBeams(
      currentFileId,
      activeScope,
      {
        points: pendingSlabData.slabPoints,
        shapeType: pendingSlabData.slabShapeType,
        name: pendingSlabData.slabName.trim() || 'Slab',
      },
      null, // No edge beams
      null, // No internal beams
      color,
      currentPage
    );
    
    // Store the saved ID to prevent double-saves
    if (slabMarkup?.id) {
      setSlabSavedId(slabMarkup.id);
    }
    
    // Reset all slab workflow state
    resetSlabWorkflow();
  }, [pendingSlabData, activeScope, currentFileId, selectedScopes, addSlabWithBeams, currentPage, slabSavedId]);

  // Handler: Done marking a single beam (ready for naming/dimensions)
  const handleDoneMarkingSingleBeam = useCallback(() => {
    // For edge beams: use continuous polyline points
    if (slabWorkflowStep === 'mark_edge_beam' && polylinePoints.length >= 2 && currentScale) {
      // Calculate and cache the length and segments BEFORE clearing polylinePoints
      const length = calculatePolylineLength(polylinePoints, currentScale);
      const segments = polylinePoints.slice(0, -1).map((point, i) => {
        const nextPoint = polylinePoints[i + 1];
        const pixelLength = Math.sqrt(
          Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
        );
        return {
          startPoint: point,
          endPoint: nextPoint,
          length: pixelLength / currentScale,
        };
      });
      
      setCachedBeamLength(length);
      setCachedBeamSegments(segments);
      setCurrentBeamPoints([...polylinePoints]);
      setPolylinePoints([]);  // Now safe to clear
      setSlabWorkflowStep('edge_beam_details');
      setShowSlabBeamDialog(true);
      setActiveTool('select');
      return;
    }
    
    // For internal beams: use accumulated discrete beams
    if (slabWorkflowStep === 'mark_internal_beam' && discreteInternalBeams.length > 0 && currentScale) {
      // Convert discrete beams to points for the dialog
      // We store all the discrete beams and pass total length
      setCurrentBeamPoints([]); // Not used for discrete beams
      setPolylinePoints([]);
      setSlabWorkflowStep('internal_beam_details');
      setShowSlabBeamDialog(true);
      setActiveTool('select');
      return;
    }
  }, [polylinePoints, currentScale, slabWorkflowStep, discreteInternalBeams.length]);

  // Auto-capture internal beam pairs (every 2 clicks = 1 discrete beam)
  useEffect(() => {
    if (slabWorkflowStep === 'mark_internal_beam' && polylinePoints.length === 2 && currentScale) {
      const [start, end] = polylinePoints;
      const pixelLength = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      const lengthMeters = pixelLength / currentScale;
      
      // Add to discrete beams array
      setDiscreteInternalBeams(prev => [...prev, {
        startPoint: start,
        endPoint: end,
        length: lengthMeters,
      }]);
      
      // Reset polyline for next beam - stay in marking mode
      setPolylinePoints([]);
    }
  }, [slabWorkflowStep, polylinePoints, currentScale]);
  
  // Also capture discrete beams when adding internal beams to existing slabs
  useEffect(() => {
    if (isAddingBeamToExistingSlab && addingBeamType === 'internal_beam' && polylinePoints.length === 2 && currentScale) {
      const [start, end] = polylinePoints;
      const pixelLength = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      const lengthMeters = pixelLength / currentScale;
      
      // Add to discrete beams array
      setDiscreteInternalBeams(prev => [...prev, {
        startPoint: start,
        endPoint: end,
        length: lengthMeters,
      }]);
      
      // Reset polyline for next beam
      setPolylinePoints([]);
    }
  }, [isAddingBeamToExistingSlab, addingBeamType, polylinePoints, currentScale]);

  // Handler: Save a single beam with its name and dimensions
  const handleSaveBeam = useCallback(async (beamData: { name: string; width: number; depth: number }) => {
    if (!pendingSlabData || !currentScale) return;
    
    if (slabWorkflowStep === 'edge_beam_details') {
      // Edge beams use continuous polyline
      const beamLength = calculatePolylineLength(currentBeamPoints, currentScale);
      const newBeam: BeamData = {
        name: beamData.name,
        points: currentBeamPoints,
        width: beamData.width,
        depth: beamData.depth,
        length: beamLength,
      };
      // Add to edge beams and go to summary
      setPendingSlabData(prev => prev ? {
        ...prev,
        edgeBeams: [...prev.edgeBeams, newBeam],
      } : null);
      setSlabWorkflowStep('edge_beams_complete');
      setCurrentBeamPoints([]);
    } else if (slabWorkflowStep === 'internal_beam_details') {
      // Internal beams: create one beam record per discrete segment
      const newInternalBeams: BeamData[] = discreteInternalBeams.map((segment, index) => ({
        name: discreteInternalBeams.length > 1 ? `${beamData.name}-${index + 1}` : beamData.name,
        points: [segment.startPoint, segment.endPoint],
        width: beamData.width,
        depth: beamData.depth,
        length: segment.length,
      }));
      
      // Add all to internal beams and go to summary
      setPendingSlabData(prev => prev ? {
        ...prev,
        internalBeams: [...prev.internalBeams, ...newInternalBeams],
      } : null);
      setSlabWorkflowStep('internal_beams_complete');
      setDiscreteInternalBeams([]); // Clear discrete beams after saving
    }
  }, [pendingSlabData, currentScale, currentBeamPoints, slabWorkflowStep, discreteInternalBeams]);

  // Handler: Add another edge beam
  const handleAddAnotherEdgeBeam = useCallback(() => {
    setShowSlabBeamDialog(false);
    setSlabWorkflowStep('mark_edge_beam');
    setPolylinePoints([]);
    setCachedBeamLength(0);
    setCachedBeamSegments([]);
    setActiveTool('polyline');
  }, []);

  // Handler: Finish edge beams (no internal beams)
  const handleFinishEdgeBeams = useCallback(async () => {
    if (!pendingSlabData || !activeScope || !currentFileId) return;
    
    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    
    let slabId = slabSavedId;
    
    // Only create slab if not already saved
    if (!slabId) {
      const slabMarkup = await addSlabWithBeams(
        currentFileId,
        activeScope,
        {
          points: pendingSlabData.slabPoints,
          shapeType: pendingSlabData.slabShapeType,
          name: pendingSlabData.slabName.trim() || 'Slab',
        },
        null, // Will add beams individually
        null,
        color,
        currentPage
      );
      slabId = slabMarkup?.id || null;
      setSlabSavedId(slabId);
    }
    
    // Now add each edge beam individually
    if (slabId && pendingSlabData.edgeBeams.length > 0) {
      for (const beam of pendingSlabData.edgeBeams) {
        await addBeamToSlab(
          slabId,
          currentFileId,
          activeScope,
          beam.points,
          beam.length,
          beam.width,
          beam.depth,
          color,
          currentPage,
          beam.name,
          'edge_beam'
        );
      }
    }
    
    resetSlabWorkflow();
  }, [pendingSlabData, activeScope, currentFileId, selectedScopes, addSlabWithBeams, addBeamToSlab, currentPage, slabSavedId]);

  // Handler: Start adding internal beams
  const handleStartInternalBeams = useCallback(() => {
    setShowSlabBeamDialog(false);
    setSlabWorkflowStep('mark_internal_beam');
    setPolylinePoints([]);
    setActiveTool('polyline');
  }, []);

  // Handler: Add another internal beam
  const handleAddAnotherInternalBeam = useCallback(() => {
    setShowSlabBeamDialog(false);
    setSlabWorkflowStep('mark_internal_beam');
    setPolylinePoints([]);
    setActiveTool('polyline');
  }, []);

  // Handler: Finish all beams (save everything)
  const handleFinishAllBeams = useCallback(async () => {
    if (!pendingSlabData || !activeScope || !currentFileId) return;
    
    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    
    let slabId = slabSavedId;
    
    // Only create slab if not already saved
    if (!slabId) {
      // Prepare waffle pod data if this is a waffle pod scope (always include data, even if counting was skipped)
      const wafflePodData = (activeScope === 'waffle_pod') ? {
        podCount: pendingSlabData.wafflePodCount || 0,
        podThickness: pendingSlabData.wafflePodThickness || Number(wafflePodDepth) || 225,
        spacer4WayCount: pendingSlabData.spacer4WayCount || 0,
        spacer2WayCount: pendingSlabData.spacer2WayCount || 0,
      } : undefined;
      
      const slabMarkup = await addSlabWithBeams(
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
        currentPage,
        wafflePodData
      );
      slabId = slabMarkup?.id || null;
      setSlabSavedId(slabId);
    }
    
    // Add each beam individually - skip edge beams if slab was already saved (they were added then)
    if (slabId) {
      // Only add edge beams if they haven't been saved yet (slabSavedId was null before this call)
      if (!slabSavedId) {
        for (const beam of pendingSlabData.edgeBeams) {
          await addBeamToSlab(
            slabId,
            currentFileId,
            activeScope,
            beam.points,
            beam.length,
            beam.width,
            beam.depth,
            color,
            currentPage,
            beam.name,
            'edge_beam'
          );
        }
      }
      // Always add internal beams (they're new)
      for (const beam of pendingSlabData.internalBeams) {
        await addBeamToSlab(
          slabId,
          currentFileId,
          activeScope,
          beam.points,
          beam.length,
          beam.width,
          beam.depth,
          color,
          currentPage,
          beam.name,
          'internal_beam'
        );
      }
    }
    
    resetSlabWorkflow();
  }, [pendingSlabData, activeScope, currentFileId, selectedScopes, addSlabWithBeams, addBeamToSlab, currentPage, slabSavedId, wafflePodDepth]);

  // Handler: Cancel slab workflow
  const handleCancelSlabWorkflow = useCallback(() => {
    resetSlabWorkflow();
  }, []);

  const resetSlabWorkflow = () => {
    setShowSlabBeamDialog(false);
    setSlabWorkflowActive(false);
    setSlabWorkflowStep('name');
    setPendingSlabData(null);
    setCurrentBeamPoints([]);
    setPolylinePoints([]);
    setCachedBeamLength(0);
    setCachedBeamSegments([]);
    setDiscreteInternalBeams([]); // Clear discrete beams
    setSlabSavedId(null); // Clear saved slab ID to allow new slab creation
    setActiveTool('select');
    setActiveScope(null);
  };

  // ============= WAFFLE POD COUNTING HANDLERS REMOVED =============
  // Pod counts are now auto-calculated in SlabBeamMarkupDialog based on slab area
  
  // Handler: Start adding a beam to an existing slab
  const handleAddBeamToExistingSlab = useCallback((slabMarkupId: string, beamType: 'edge_beam' | 'internal_beam') => {
    // Find the slab markup to get its scope
    const slabMarkup = markups.find(m => m.id === slabMarkupId);
    if (!slabMarkup || !isCalibrated) return;
    
    setAddingBeamToSlabId(slabMarkupId);
    setAddingBeamType(beamType);
    setActiveScope(slabMarkup.scope_id);
    setPolylinePoints([]);
    setActiveTool('polyline');
  }, [markups, isCalibrated]);

  // Handler: Done marking beam for existing slab (2 points placed)
  const handleDoneAddingBeamToSlab = useCallback(() => {
    if (polylinePoints.length >= 2 && currentScale) {
      const length = calculatePolylineLength(polylinePoints, currentScale);
      setPendingBeamPoints([...polylinePoints]);
      setPendingBeamLength(length);
      setShowAddBeamDimensionsDialog(true);
      setPolylinePoints([]);
      setActiveTool('select');
    }
  }, [polylinePoints, currentScale]);

  // Handler: Save beam to existing slab with dimensions
  const handleSaveBeamToExistingSlab = useCallback(async (data: { name: string; width: number; depth: number }) => {
    if (!addingBeamToSlabId || !addingBeamType || !currentFileId || pendingBeamPoints.length < 2) return;
    
    const slabMarkup = markups.find(m => m.id === addingBeamToSlabId);
    if (!slabMarkup) return;
    
    const color = slabMarkup.color || getScopeColor(selectedScopes.indexOf(slabMarkup.scope_id as ScopeType));
    
    await addBeamToSlab(
      addingBeamToSlabId,
      currentFileId,
      slabMarkup.scope_id,
      pendingBeamPoints,
      pendingBeamLength,
      data.width,
      data.depth,
      color,
      currentPage,
      data.name,
      addingBeamType
    );
    
    // Reset state
    setShowAddBeamDimensionsDialog(false);
    setAddingBeamToSlabId(null);
    setAddingBeamType(null);
    setPendingBeamPoints([]);
    setPendingBeamLength(0);
    setActiveScope(null);
  }, [addingBeamToSlabId, addingBeamType, currentFileId, pendingBeamPoints, pendingBeamLength, markups, selectedScopes, addBeamToSlab, currentPage]);

  // Handler: Cancel adding beam to existing slab
  const handleCancelAddingBeamToSlab = useCallback(() => {
    setAddingBeamToSlabId(null);
    setAddingBeamType(null);
    setPolylinePoints([]);
    setPendingBeamPoints([]);
    setPendingBeamLength(0);
    setActiveTool('select');
    setActiveScope(null);
    setShowAddBeamDimensionsDialog(false);
  }, []);

  // Internal beams now use continuous polyline markup like edge beams
  // User must click "Done" or press Enter to complete marking

  // Handler for completing pier marking
  const handlePierDimensionsConfirm = useCallback(async (diameter: number, depth: number, name: string) => {
    if (!activeScope || !currentFileId || pierPoints.length === 0) return;

    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    await addPierMarkups(currentFileId, activeScope, pierPoints, diameter, depth, color, currentPage, name);

    // Clear state
    setPierPoints([]);
    setActiveTool('select');
    setActiveScope(null);
  }, [activeScope, currentFileId, pierPoints, selectedScopes, addPierMarkups, currentPage]);

  // Handler for completing pier marking AND continuing to add more
  const handlePierDimensionsConfirmAndAddAnother = useCallback(async (diameter: number, depth: number, name: string) => {
    if (!activeScope || !currentFileId || pierPoints.length === 0) return;

    const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
    await addPierMarkups(currentFileId, activeScope, pierPoints, diameter, depth, color, currentPage, name);

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
      handleDoneMarkingSingleBeam();
      return;
    }
    
    if (polylinePoints.length >= 2 && currentScale) {
      const lengthMeters = calculatePolylineLength(polylinePoints, currentScale);
      setPendingPolylineLength(lengthMeters);
      setShowLinearDimensions(true);
    }
  }, [polylinePoints, currentScale, slabWorkflowActive, handleDoneMarkingSingleBeam]);

  // Handler called by DrawingCanvas when polyline is completed (double-click alternative)
  const handlePolylineComplete = useCallback((points: TakeoffPoint[], lengthMeters: number) => {
    // If in slab beam workflow, complete the current beam
    if (slabWorkflowActive) {
      if (points.length >= 2) {
        setPolylinePoints(points);
        handleDoneMarkingSingleBeam();
      }
      return;
    }
    
    setPendingPolylineLength(lengthMeters);
    setShowLinearDimensions(true);
  }, [slabWorkflowActive, handleDoneMarkingSingleBeam]);

  const handleUndo = useCallback(() => {
    // Undo polyline point (for edge beams or linear scopes)
    if (activeTool === 'polyline' && polylinePoints.length > 0) {
      setPolylinePoints(prev => prev.slice(0, -1));
      return;
    }
    
    // Undo discrete internal beam segment (remove last completed beam)
    // This handles internal beam workflow where pairs of points form discrete beams
    if (activeTool === 'polyline' && discreteInternalBeams.length > 0 && polylinePoints.length === 0) {
      setDiscreteInternalBeams(prev => prev.slice(0, -1));
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
  }, [activeTool, polylinePoints.length, pierPoints.length, drawingPoints.length, discreteInternalBeams.length]);

  // Handler to cancel current markup and clear unsaved points
  const handleCancelCurrentMarkup = useCallback(() => {
    // If adding beam to existing slab, cancel that
    if (isAddingBeamToExistingSlab) {
      handleCancelAddingBeamToSlab();
      return;
    }
    
    // If in slab workflow, cancel it
    if (slabWorkflowActive) {
      handleCancelSlabWorkflow();
      return;
    }
    
    // Clear all drawing state
    setDrawingPoints([]);
    setPierPoints([]);
    setPolylinePoints([]);
    setPendingPolylineLength(0);
    setCalibrationPoints([]);
    setIsCalibrationMode(false);
    setActiveTool('select');
    setActiveScope(null);
  }, [isAddingBeamToExistingSlab, slabWorkflowActive, handleCancelAddingBeamToSlab, handleCancelSlabWorkflow]);

  // Keyboard shortcuts: Backspace (undo), Enter (Done), Escape (cancel), Ctrl+Z/Cmd+Z (undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Backspace key to delete last point (same as undo)
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Escape key to cancel current markup (only when actively marking)
      // Note: The parent EstimateFormDialog blocks Escape from closing during takeoff step
      if (e.key === 'Escape') {
        // Only handle if we're actively drawing something
        const hasActiveDrawing = 
          (activeTool === 'polygon' && drawingPoints.length > 0) ||
          (activeTool === 'polyline' && polylinePoints.length > 0) ||
          (activeTool === 'point' && pierPoints.length > 0) ||
          slabWorkflowActive ||
          isAddingBeamToExistingSlab;
        
        if (hasActiveDrawing) {
          e.preventDefault();
          e.stopPropagation();
          handleCancelCurrentMarkup();
        }
        return;
      }

      // Enter key behavior:
      // 1. If a details dialog is open, don't interfere (dialog handles its own Enter via form/button)
      // 2. Otherwise, complete current markup (like clicking "Done")
      if (e.key === 'Enter') {
        // Check if any detail dialog is open - if so, let the dialog handle Enter naturally
        const isAnyDialogOpen = 
          showPierDimensions ||
          showBollardDimensions ||
          showPadDimensions ||
          showLinearDimensions ||
          showMarkupNameDialog ||
          showSlabBeamDialog ||
          showAddBeamDimensionsDialog ||
          !!editingBeam ||
          showCalibration;
        
        if (isAnyDialogOpen) {
          // Don't prevent default - let the dialog's form submission or button click work
          return;
        }
        
        e.preventDefault();
        
        // Handle polyline/beam completion
        if (activeTool === 'polyline' && polylinePoints.length >= 2) {
          handleDoneMarkingPolyline();
          return;
        }
        
        // Handle point tool completion (piers/bollards/pads)
        if (activeTool === 'point' && pierPoints.length > 0) {
          handleDoneMarkingPiers();
          return;
        }
        
        // Handle polygon completion (need at least 3 points)
        if (activeTool === 'polygon' && drawingPoints.length >= 3) {
          // Trigger the markup complete with current points
          if (activeScope && currentFileId) {
            const points = drawingPoints;
            onPointsChange?.([]);
            setDrawingPoints([]);
            
            // Check if this is a slab scope that supports beam marking
            const isSlabWithBeamsScope = SLAB_WITH_BEAMS_SCOPES.includes(activeScope as any);
            
            if (isSlabWithBeamsScope && currentScale) {
              const existingForScope = markups.filter(m => m.scope_id === activeScope);
              const defaultName = existingForScope.length === 0 
                ? 'Slab 1' 
                : `Slab ${existingForScope.length + 1}`;
              
              setPendingSlabData({
                slabPoints: points,
                slabShapeType: 'polygon',
                slabName: defaultName,
                edgeBeams: [],
                internalBeams: [],
              });
              setSlabWorkflowActive(true);
              setSlabWorkflowStep('name');
              setShowSlabBeamDialog(true);
            } else {
              const existingForScope = markups.filter(m => m.scope_id === activeScope);
              const defaultName = existingForScope.length === 0 
                ? 'Area 1' 
                : `Area ${existingForScope.length + 1}`;
              
              setPendingMarkupData({
                points,
                shapeType: 'polygon',
                scopeId: activeScope,
                fileId: currentFileId,
                pageNumber: currentPage,
              });
              setPendingMarkupName(defaultName);
              setShowMarkupNameDialog(true);
            }
          }
          return;
        }
        
        return;
      }

      // Ctrl+Z / Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTool, 
    polylinePoints.length, 
    pierPoints.length, 
    drawingPoints.length,
    drawingPoints,
    activeScope,
    currentFileId,
    currentPage,
    currentScale,
    markups,
    handleDoneMarkingPolyline, 
    handleDoneMarkingPiers,
    handleUndo,
    handleCancelCurrentMarkup,
    showPierDimensions,
    showBollardDimensions,
    showPadDimensions,
    showLinearDimensions,
    showMarkupNameDialog,
    showSlabBeamDialog,
    showAddBeamDimensionsDialog,
    editingBeam,
    showCalibration,
    slabWorkflowActive,
    isAddingBeamToExistingSlab,
  ]);

  // Callback to allow DrawingCanvas to report points for Enter key handling
  const onPointsChange = useCallback((points: TakeoffPoint[]) => {
    setDrawingPoints(points);
  }, []);

  // Internal beams now use continuous polyline markup like edge beams
  // User must click "Done" or press Enter to complete marking

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
        onZoomIn={() => setZoom(z => Math.min(z * 1.25, 5))}
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
        pointLabel={
          activeScope === 'bollards' ? 'bollard' : activeScope === 'pad_footings' ? 'pad footing' : activeScope === 'pit_bases' ? 'pit base' : 'pier'
        }
        onDoneMarkingPoints={handleDoneMarkingPiers}
        isPolylineMode={activeTool === 'polyline' && isLinearScope && !isSlabBeamMarking}
        polylineLength={currentScale ? calculatePolylineLength(polylinePoints, currentScale) : 0}
        polylineSegmentCount={polylinePoints.length > 1 ? polylinePoints.length - 1 : 0}
        polylineLabel={activeScope === 'kerbs_channels' ? 'kerb' : activeScope === 'retaining_walls' ? 'wall' : 'footing'}
        onDoneMarkingPolyline={handleDoneMarkingPolyline}
        isBeamMarkingMode={isSlabBeamMarking || (isAddingBeamToExistingSlab && addingBeamType !== null)}
        beamType={slabWorkflowStep === 'mark_edge_beam' || addingBeamType === 'edge_beam' ? 'edge' : 'internal'}
        beamSlabName={pendingSlabData?.slabName || (addingBeamToSlabId ? markups.find(m => m.id === addingBeamToSlabId)?.name || 'Slab' : 'Slab')}
        beamPointCount={
          // For internal beams, show discrete beam count; for edge beams, show polyline points
          (slabWorkflowStep === 'mark_internal_beam' || addingBeamType === 'internal_beam')
            ? discreteInternalBeams.length * 2 + polylinePoints.length  // Total points placed
            : polylinePoints.length
        }
        beamLength={
          // For internal beams, calculate total from discrete beams
          (slabWorkflowStep === 'mark_internal_beam' || addingBeamType === 'internal_beam')
            ? discreteInternalBeams.reduce((sum, b) => sum + b.length, 0)
            : currentBeamLength
        }
        discreteBeamCount={
          (slabWorkflowStep === 'mark_internal_beam' || addingBeamType === 'internal_beam')
            ? discreteInternalBeams.length
            : undefined
        }
        onDoneMarkingBeams={
          isAddingBeamToExistingSlab 
            ? handleDoneAddingBeamToSlab 
            : handleDoneMarkingSingleBeam
        }
        onCancelBeamMarking={
          isAddingBeamToExistingSlab 
            ? handleCancelAddingBeamToSlab 
            : handleCancelSlabWorkflow
        }
        scopeId={activeScope || undefined}
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
              onZoomChange={setZoom}
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
                    ...pendingSlabData.edgeBeams.map(beam => ({
                      points: beam.points,
                      type: 'edge' as const,
                    })),
                    ...pendingSlabData.internalBeams.map(beam => ({
                      points: beam.points,
                      type: 'internal' as const,
                    })),
                  ] : []
                }
                discreteInternalBeams={
                  (slabWorkflowStep === 'mark_internal_beam' || (isAddingBeamToExistingSlab && addingBeamType === 'internal_beam'))
                    ? discreteInternalBeams
                    : []
                }
                activeBeamType={
                  slabWorkflowStep === 'mark_edge_beam' || addingBeamType === 'edge_beam' ? 'edge' 
                  : (slabWorkflowStep === 'mark_internal_beam' || addingBeamType === 'internal_beam') ? 'internal' 
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
          
          {/* Floating bottom popups removed - waffle pod input moved to sidebar */}

          {/* Floating bottom popups removed - status info is shown in toolbar */}
        </div>

        {/* Floating scope panel - positioned on left side */}
        <div className="absolute top-2 left-2 z-20 pointer-events-none">
          <div className="pointer-events-auto space-y-2">
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
              onEditBeam={handleEditBeam}
              onDeleteMarkup={handleDeleteMarkup}
              onAddBeamToSlab={handleAddBeamToExistingSlab}
              onAddToLinearType={(scopeId, typeName, width, depth) => {
                setScopePanelManuallyExpanded(false);
                handleAddToLinearType(scopeId, typeName, width, depth);
              }}
              isCalibrated={isCalibrated}
              isCollapsed={isScopePanelCollapsed}
              onToggle={() => setScopePanelManuallyExpanded(!scopePanelManuallyExpanded)}
            />
            
            {/* Waffle pod floating input removed - counts are now auto-calculated in dialog */}
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
        defaultName={`P${markups.filter(m => m.scope_id === 'piers' && m.shape_type === 'point').length + 1}`}
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

      {/* Pad footing dimensions dialog (for both pit_bases and pad_footings - point-based) */}
      <PadFootingDimensionsDialog
        open={showPadDimensions}
        onOpenChange={setShowPadDimensions}
        padCount={pierPoints.length}
        scopeType={activeScope === 'pit_bases' ? 'pit_bases' : 'pad_footings'}
        defaultName={activeScope === 'pit_bases' ? 'Pit Bases' : 'Pad Footings'}
        onConfirm={async (length, width, depth, name) => {
          if (!activeScope || !currentFileId || pierPoints.length === 0) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          const scopeType = activeScope === 'pit_bases' ? 'pit_bases' : 'pad_footings';
          await addPadMarkups(currentFileId, activeScope, pierPoints, length, width, depth, color, currentPage, scopeType, name);
          setPierPoints([]);
          setActiveTool('select');
          setActiveScope(null);
        }}
        onConfirmAndAddAnother={async (length, width, depth, name) => {
          if (!activeScope || !currentFileId || pierPoints.length === 0) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          const scopeType = activeScope === 'pit_bases' ? 'pit_bases' : 'pad_footings';
          await addPadMarkups(currentFileId, activeScope, pierPoints, length, width, depth, color, currentPage, scopeType, name);
          setPierPoints([]); // Clear points but keep tool and scope active
        }}
      />

      {/* Linear dimensions dialog */}
      <LinearDimensionsDialog
        open={showLinearDimensions}
        onOpenChange={(open) => {
          setShowLinearDimensions(open);
          if (!open) {
            // Dialog closed without saving, reset polyline state and preselected type
            if (pendingPolylineLength === 0) {
              setPolylinePoints([]);
            }
            setPreselectedLinearType(null);
          }
        }}
        lengthMeters={pendingPolylineLength}
        segments={polylineSegments}
        scopeType={activeScope || 'strip_footings'}
        defaultName={(() => {
          if (!activeScope) return 'SF1';
          const prefixMap: Record<string, string> = {
            strip_footings: 'SF',
            retaining_wall_footings: 'RF',
            kerbs_channels: 'K',
            retaining_walls: 'RW',
          };
          const prefix = prefixMap[activeScope] || 'L';
          const existingForScope = markups.filter(m => m.scope_id === activeScope && m.shape_type === 'polyline');
          return `${prefix}${existingForScope.length + 1}`;
        })()}
        existingSegments={existingLinearSegments}
        preselectedType={preselectedLinearType}
        onConfirm={async (name, width, height, hasToe, toeWidth, toeDepth) => {
          if (!activeScope || !currentFileId || pendingPolylineLength === 0) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          const sectionName = name.trim() || `Section ${markups.filter(m => m.scope_id === activeScope).length + 1}`;
          await addPolylineMarkup(currentFileId, activeScope, polylinePoints, pendingPolylineLength, width, height, color, currentPage, sectionName, hasToe, toeWidth, toeDepth);
          setPolylinePoints([]);
          setPendingPolylineLength(0);
          setActiveTool('select');
          setActiveScope(null);
          setPendingMarkupName('');
          setPreselectedLinearType(null);
        }}
        onConfirmAndAddAnother={async (name, width, height, hasToe, toeWidth, toeDepth) => {
          if (!activeScope || !currentFileId || pendingPolylineLength === 0) return;
          const color = getScopeColor(selectedScopes.indexOf(activeScope as ScopeType));
          const sectionName = name.trim() || `Section ${markups.filter(m => m.scope_id === activeScope).length + 1}`;
          await addPolylineMarkup(currentFileId, activeScope, polylinePoints, pendingPolylineLength, width, height, color, currentPage, sectionName, hasToe, toeWidth, toeDepth);
          // Clear drawing state but keep scope and tool active for next segment
          setPolylinePoints([]);
          setPendingPolylineLength(0);
          // Keep activeScope and activeTool so user can immediately continue drawing
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
        currentBeamPoints={currentBeamPoints}
        currentBeamLength={cachedBeamLength}
        currentBeamSegments={cachedBeamSegments}
        discreteInternalBeams={discreteInternalBeams}
        savedEdgeBeams={pendingSlabData?.edgeBeams || []}
        savedInternalBeams={pendingSlabData?.internalBeams || []}
        wafflePodSize={pendingSlabData?.wafflePodSize || '1090x1090'}
        wafflePodThickness={pendingSlabData?.wafflePodThickness || 225}
        wafflePodTopThickness={pendingSlabData?.wafflePodTopThickness || 85}
        wafflePodRibWidth={pendingSlabData?.wafflePodRibWidth || 110}
        onWafflePodDimensionsChange={(size, podThickness, topThickness, ribWidth) =>
          setPendingSlabData(prev => prev ? { ...prev, wafflePodSize: size, wafflePodThickness: podThickness, wafflePodTopThickness: topThickness, wafflePodRibWidth: ribWidth } : null)
        }
        wafflePodCount={pendingSlabData?.wafflePodCount || 0}
        spacer4WayCount={pendingSlabData?.spacer4WayCount || 0}
        spacer2WayCount={pendingSlabData?.spacer2WayCount || 0}
        wafflePodCountingComplete={false} // No longer using counting workflow
        onStartCountingPods={undefined} // No longer using counting workflow
        onStartEdgeBeams={handleStartEdgeBeams}
        onUsePerimeterAsEdgeBeam={handleUsePerimeterAsEdgeBeam}
        onSkipAllBeams={handleSkipAllBeams}
        onSaveBeam={handleSaveBeam}
        onAddAnotherEdgeBeam={handleAddAnotherEdgeBeam}
        onFinishEdgeBeams={handleFinishEdgeBeams}
        onStartInternalBeams={handleStartInternalBeams}
        onAddAnotherInternalBeam={handleAddAnotherInternalBeam}
        onFinishAllBeams={handleFinishAllBeams}
        onCancel={handleCancelSlabWorkflow}
      />

      {/* Edit beam dialog */}
      <EditBeamDialog
        open={!!editingBeam}
        onOpenChange={(open) => !open && setEditingBeam(null)}
        beamType={(editingBeam?.markup_type as 'edge_beam' | 'internal_beam') || 'edge_beam'}
        initialName={editingBeam?.name || ''}
        initialWidth={editingBeam?.width_mm || 450}
        initialDepth={editingBeam?.height_mm || 450}
        length={editingBeam?.length_m || 0}
        onSave={handleSaveBeamEdit}
      />

      {/* Add beam to existing slab dialog */}
      <EditBeamDialog
        open={showAddBeamDimensionsDialog}
        onOpenChange={(open) => {
          if (!open) handleCancelAddingBeamToSlab();
        }}
        beamType={addingBeamType || 'edge_beam'}
        initialName={addingBeamType === 'edge_beam' ? 'EB1' : 'IB1'}
        initialWidth={addingBeamType === 'edge_beam' ? 450 : 300}
        initialDepth={addingBeamType === 'edge_beam' ? 450 : 400}
        length={pendingBeamLength}
        onSave={handleSaveBeamToExistingSlab}
        mode="add"
        slabName={markups.find(m => m.id === addingBeamToSlabId)?.name || 'Slab'}
        existingBeams={existingBeamsForAddDialog}
      />

      {/* Waffle Pod Count Dialog removed - counts are now auto-calculated in SlabBeamMarkupDialog */}
    </div>
  );
}
