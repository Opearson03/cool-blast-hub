import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, ArrowRight, Check, SkipForward, Minus, Plus, Layers, ArrowLeft } from 'lucide-react';
import { EDGE_BEAM_COLOR, INTERNAL_BEAM_COLOR } from './DrawingCanvas';

// Interface for beam types (groups of beams with same dimensions)
interface BeamType {
  name: string;
  width: number;
  depth: number;
  count: number;
}

export type SlabWorkflowStep = 
  | 'name'
  | 'count_pods'           // Counting waffle pods
  | 'count_4way'           // Counting 4-way spacers
  | 'count_2way'           // Counting 2-way spacers
  | 'mark_edge_beam'       // Drawing a single edge beam
  | 'edge_beam_details'    // Name + dimensions for single edge beam
  | 'edge_beams_complete'  // Summary of edge beams, option to add more or move to internal
  | 'mark_internal_beam'   // Drawing a single internal beam
  | 'internal_beam_details' // Name + dimensions for single internal beam
  | 'internal_beams_complete' // Summary, option to add more or finish
  | 'complete';

// Individual beam data - each beam has its own name and dimensions
export interface BeamData {
  id?: string;
  name: string;
  points: { x: number; y: number }[];
  width: number;
  depth: number;
  length: number;
}

export interface PendingSlabData {
  slabPoints: { x: number; y: number }[];
  slabShapeType: 'polygon' | 'rectangle';
  slabName: string;
  slabMarkupId?: string; // Set after slab is saved
  edgeBeams: BeamData[];
  internalBeams: BeamData[];
  // Page/file the slab was drawn on - ensures markup stays locked to its page
  pageNumber: number;
  fileId: string;
  // Waffle pod specific
  wafflePodSize?: string;
  wafflePodThickness?: number;
  wafflePodTopThickness?: number;
  wafflePodRibWidth?: number;
  // Waffle pod counting data
  wafflePodCount?: number;
  spacer4WayCount?: number;
  spacer2WayCount?: number;
}

// Waffle pod module size options (dimensions in mm)
const WAFFLE_POD_MODULE_SIZES = [
  { value: '1090x1090', label: '1090 x 1090 mm' },
  { value: '1110x1110', label: '1110 x 1110 mm' },
  { value: '1050x1050', label: '1050 x 1050 mm' },
];

// Waffle pod thickness/height options (in mm)
const WAFFLE_POD_THICKNESSES = [
  { value: '225', label: '225mm' },
  { value: '275', label: '275mm' },
  { value: '325', label: '325mm' },
  { value: '375', label: '375mm' },
];

/** Segment data from polyline points */
export interface BeamSegment {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  length: number;
}

interface SlabBeamMarkupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: SlabWorkflowStep;
  slabName: string;
  onSlabNameChange: (name: string) => void;
  scopeLabel: string;
  scopeId?: string;
  slabArea?: number;
  slabPerimeter?: number;
  /** Current beam points being drawn */
  currentBeamPoints?: { x: number; y: number }[];
  /** Calculated length for current beam polyline */
  currentBeamLength?: number;
  /** Individual segment lengths */
  currentBeamSegments?: BeamSegment[];
  /** Discrete internal beams (for point-pair workflow) */
  discreteInternalBeams?: Array<{ startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; length: number }>;
  /** List of already saved edge beams */
  savedEdgeBeams?: BeamData[];
  /** List of already saved internal beams */
  savedInternalBeams?: BeamData[];
  /** Waffle pod dimensions */
  wafflePodSize?: string;
  wafflePodThickness?: number;
  wafflePodTopThickness?: number;
  wafflePodRibWidth?: number;
  onWafflePodDimensionsChange?: (size: string, podThickness: number, topThickness: number, ribWidth: number) => void;
  
  // Waffle pod counting data (after counting is complete)
  wafflePodCount?: number;
  spacer4WayCount?: number;
  spacer2WayCount?: number;
  wafflePodCountingComplete?: boolean;
  
  // Action for waffle pod counting (triggered from name step)
  onStartCountingPods?: () => void;
  
  // Actions for slab naming step
  onStartEdgeBeams: () => void;
  onSkipAllBeams: () => void;
  /** Skip edge beams entirely (go straight to internal beams) */
  onSkipEdgeBeams?: () => void;
  /** Quick action: use slab perimeter as edge beam (skip manual marking) */
  onUsePerimeterAsEdgeBeam?: () => void;
  
  // Actions for individual beam details
  onSaveBeam: (beamData: { name: string; width: number; depth: number }) => void;
  
  // Actions for beam completion steps
  onAddAnotherEdgeBeam: () => void;
  onFinishEdgeBeams: () => void;
  onStartInternalBeams: () => void;
  onAddAnotherInternalBeam: () => void;
  onFinishAllBeams: () => void;
  
  onCancel: () => void;
  /** Current page being viewed */
  currentPage?: number;
  /** Page where the slab was drawn */
  slabPage?: number;
  /** Callback to navigate back to the slab's page */
  onReturnToSlabPage?: () => void;
}

export function SlabBeamMarkupDialog({
  open,
  onOpenChange,
  step,
  slabName,
  onSlabNameChange,
  scopeLabel,
  scopeId,
  slabArea = 0,
  slabPerimeter = 0,
  currentBeamPoints = [],
  currentBeamLength = 0,
  currentBeamSegments = [],
  discreteInternalBeams = [],
  savedEdgeBeams = [],
  savedInternalBeams = [],
  wafflePodSize = '1090x1090',
  wafflePodThickness = 225,
  wafflePodTopThickness = 85,
  wafflePodRibWidth = 110,
  onWafflePodDimensionsChange,
  wafflePodCount = 0,
  spacer4WayCount = 0,
  spacer2WayCount = 0,
  wafflePodCountingComplete = false,
  onStartCountingPods,
  onStartEdgeBeams,
  onSkipAllBeams,
  onSkipEdgeBeams,
  onUsePerimeterAsEdgeBeam,
  onSaveBeam,
  onAddAnotherEdgeBeam,
  onFinishEdgeBeams,
  onStartInternalBeams,
  onAddAnotherInternalBeam,
  onFinishAllBeams,
  onCancel,
  currentPage,
  slabPage,
  onReturnToSlabPage,
}: SlabBeamMarkupDialogProps) {
  // Local state for beam details
  const [beamName, setBeamName] = useState('');
  
  const [beamWidth, setBeamWidth] = useState(450);
  const [beamDepth, setBeamDepth] = useState(450);
  
  // Edge beam type selection mode
  const [edgeBeamTypeMode, setEdgeBeamTypeMode] = useState<'existing' | 'new'>('new');
  const [selectedEdgeBeamTypeKey, setSelectedEdgeBeamTypeKey] = useState<string | null>(null);
  
  // Internal beam type selection mode
  const [internalBeamTypeMode, setInternalBeamTypeMode] = useState<'existing' | 'new'>('new');
  const [selectedInternalBeamTypeKey, setSelectedInternalBeamTypeKey] = useState<string | null>(null);
  
  // Waffle pod state
  const [localPodSize, setLocalPodSize] = useState(wafflePodSize);
  const [localPodThickness, setLocalPodThickness] = useState(wafflePodThickness);
  const [localTopThickness, setLocalTopThickness] = useState(wafflePodTopThickness);
  const [localRibWidth, setLocalRibWidth] = useState(wafflePodRibWidth);

  const isWafflePod = scopeId === 'waffle_pod';
  const isStandardSlab = scopeId === 'standard_slab';
  const isDriveway = scopeId === 'driveway';
  // Scopes that use "Edge Thickening" terminology (driveway, crossovers, paths_surrounds, standard_slab)
  const edgeThickeningScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
  const isEdgeThickeningScope = edgeThickeningScopes.includes(scopeId || '');
  // Scopes that DON'T support internal beams (crossovers, paths_surrounds only)
  const noInternalBeamScopes = ['crossovers', 'paths_surrounds'];
  const hideInternalBeams = noInternalBeamScopes.includes(scopeId || '');
  
  // Check if viewing wrong page
  const isOnWrongPage = slabPage !== undefined && currentPage !== undefined && slabPage !== currentPage;
  
  // Helper to get edge beam label (uses "Edge Thickening" for driveway/crossovers/paths_surrounds/standard_slab)
  const getEdgeLabel = (plural: boolean = true) => {
    if (isEdgeThickeningScope) return 'Edge Thickening';
    return plural ? 'Edge Beams' : 'Edge Beam';
  };
  
  // Helper to get internal beam label (uses "Internal Thickening" for standard_slab and driveway)
  const getInternalLabel = (plural: boolean = true) => {
    if (isStandardSlab || isDriveway) return 'Internal Thickening';
    return plural ? 'Internal Beams' : 'Internal Beam';
  };

  // Derive existing edge beam types from saved beams
  const existingEdgeBeamTypes = useMemo((): BeamType[] => {
    const typeMap = new Map<string, BeamType>();
    savedEdgeBeams.forEach(beam => {
      const baseName = beam.name.split('-')[0].trim();
      const key = `${baseName}-${beam.width}-${beam.depth}`;
      if (!typeMap.has(key)) {
        typeMap.set(key, { name: baseName, width: beam.width, depth: beam.depth, count: 1 });
      } else {
        typeMap.get(key)!.count++;
      }
    });
    return Array.from(typeMap.values());
  }, [savedEdgeBeams]);

  // Derive existing internal beam types from saved beams
  const existingInternalBeamTypes = useMemo((): BeamType[] => {
    const typeMap = new Map<string, BeamType>();
    savedInternalBeams.forEach(beam => {
      const baseName = beam.name.split('-')[0].trim();
      const key = `${baseName}-${beam.width}-${beam.depth}`;
      if (!typeMap.has(key)) {
        typeMap.set(key, { name: baseName, width: beam.width, depth: beam.depth, count: 1 });
      } else {
        typeMap.get(key)!.count++;
      }
    });
    return Array.from(typeMap.values());
  }, [savedInternalBeams]);

  // Get next suggested type name for new edge beam type
  const nextNewEdgeTypeName = useMemo(() => {
    const existingNumbers = existingEdgeBeamTypes
      .map(t => t.name)
      .filter(name => /^EB\d+$/.test(name))
      .map(name => parseInt(name.replace('EB', ''), 10));
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `EB${maxNum + 1}`;
  }, [existingEdgeBeamTypes]);

  // Get next suggested type name for new internal beam type
  const nextNewInternalTypeName = useMemo(() => {
    const existingNumbers = existingInternalBeamTypes
      .map(t => t.name)
      .filter(name => /^IB\d+$/.test(name))
      .map(name => parseInt(name.replace('IB', ''), 10));
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `IB${maxNum + 1}`;
  }, [existingInternalBeamTypes]);

  // Generate default beam name based on type and count
  useEffect(() => {
    if (step === 'edge_beam_details') {
      // Reset mode when entering edge beam details
      if (existingEdgeBeamTypes.length > 0) {
        setEdgeBeamTypeMode('existing');
        const firstType = existingEdgeBeamTypes[0];
        const key = `${firstType.name}-${firstType.width}-${firstType.depth}`;
        setSelectedEdgeBeamTypeKey(key);
        const beamCount = savedEdgeBeams.filter(b => b.name.split('-')[0].trim() === firstType.name).length;
        setBeamName(`${firstType.name}-${beamCount + 1}`);
        setBeamWidth(firstType.width);
        setBeamDepth(firstType.depth);
      } else {
        setEdgeBeamTypeMode('new');
        setSelectedEdgeBeamTypeKey(null);
        setBeamName(nextNewEdgeTypeName);
        setBeamWidth(450);
        setBeamDepth(450);
      }
    } else if (step === 'internal_beam_details') {
      // Reset mode when entering internal beam details
      if (existingInternalBeamTypes.length > 0) {
        setInternalBeamTypeMode('existing');
        const firstType = existingInternalBeamTypes[0];
        const key = `${firstType.name}-${firstType.width}-${firstType.depth}`;
        setSelectedInternalBeamTypeKey(key);
        const beamCount = savedInternalBeams.filter(b => b.name.split('-')[0].trim() === firstType.name).length;
        setBeamName(`${firstType.name}-${beamCount + 1}`);
        setBeamWidth(firstType.width);
        setBeamDepth(firstType.depth);
      } else {
        setInternalBeamTypeMode('new');
        setSelectedInternalBeamTypeKey(null);
        setBeamName(nextNewInternalTypeName);
        // Waffle pod uses 110mm default internal beam width
        setBeamWidth(isWafflePod ? 110 : 300);
        setBeamDepth(400);
      }
    }
  }, [step, savedEdgeBeams.length, savedInternalBeams.length, existingEdgeBeamTypes, existingInternalBeamTypes, nextNewEdgeTypeName, nextNewInternalTypeName, isWafflePod]);

  // Handle edge beam type selection change
  const handleEdgeBeamTypeSelect = (key: string) => {
    setSelectedEdgeBeamTypeKey(key);
    const selectedType = existingEdgeBeamTypes.find(t => `${t.name}-${t.width}-${t.depth}` === key);
    if (selectedType) {
      const beamCount = savedEdgeBeams.filter(b => b.name.split('-')[0].trim() === selectedType.name).length;
      setBeamName(`${selectedType.name}-${beamCount + 1}`);
      setBeamWidth(selectedType.width);
      setBeamDepth(selectedType.depth);
    }
  };

  // Handle internal beam type selection change
  const handleInternalBeamTypeSelect = (key: string) => {
    setSelectedInternalBeamTypeKey(key);
    const selectedType = existingInternalBeamTypes.find(t => `${t.name}-${t.width}-${t.depth}` === key);
    if (selectedType) {
      const beamCount = savedInternalBeams.filter(b => b.name.split('-')[0].trim() === selectedType.name).length;
      setBeamName(`${selectedType.name}-${beamCount + 1}`);
      setBeamWidth(selectedType.width);
      setBeamDepth(selectedType.depth);
    }
  };

  // Handle switching between existing/new type mode for edge beams
  const handleEdgeBeamTypeModeChange = (mode: 'existing' | 'new') => {
    setEdgeBeamTypeMode(mode);
    if (mode === 'new') {
      setSelectedEdgeBeamTypeKey(null);
      setBeamName(nextNewEdgeTypeName);
      setBeamWidth(450);
      setBeamDepth(450);
    } else if (mode === 'existing' && existingEdgeBeamTypes.length > 0) {
      const firstType = existingEdgeBeamTypes[0];
      handleEdgeBeamTypeSelect(`${firstType.name}-${firstType.width}-${firstType.depth}`);
    }
  };

  // Handle switching between existing/new type mode for internal beams
  const handleInternalBeamTypeModeChange = (mode: 'existing' | 'new') => {
    setInternalBeamTypeMode(mode);
    if (mode === 'new') {
      setSelectedInternalBeamTypeKey(null);
      setBeamName(nextNewInternalTypeName);
      // Waffle pod uses 110mm default internal beam width
      setBeamWidth(isWafflePod ? 110 : 300);
      setBeamDepth(400);
    } else if (mode === 'existing' && existingInternalBeamTypes.length > 0) {
      const firstType = existingInternalBeamTypes[0];
      handleInternalBeamTypeSelect(`${firstType.name}-${firstType.width}-${firstType.depth}`);
    }
  };

  useEffect(() => {
    setLocalPodSize(wafflePodSize);
    setLocalPodThickness(wafflePodThickness);
    setLocalTopThickness(wafflePodTopThickness);
    setLocalRibWidth(wafflePodRibWidth);
  }, [wafflePodSize, wafflePodThickness, wafflePodTopThickness, wafflePodRibWidth]);


  // Save waffle pod dimensions and skip beams (used when user chooses to skip)
  const handleWafflePodSkipBeams = () => {
    onWafflePodDimensionsChange?.(localPodSize, localPodThickness, localTopThickness, localRibWidth);
    onSkipAllBeams();
  };

  // Save waffle pod dimensions and proceed to edge beams
  const handleWafflePodStartEdgeBeams = () => {
    onWafflePodDimensionsChange?.(localPodSize, localPodThickness, localTopThickness, localRibWidth);
    onStartEdgeBeams();
  };

  const handleSaveBeam = () => {
    const fallbackName = step === 'edge_beam_details' 
      ? `Edge Beam ${savedEdgeBeams.length + 1}` 
      : `${getInternalLabel(false)} ${savedInternalBeams.length + 1}`;
    onSaveBeam({
      name: beamName.trim() || fallbackName,
      width: beamWidth,
      depth: beamDepth,
    });
  };

  // Calculate totals
  const totalEdgeLength = savedEdgeBeams.reduce((sum, b) => sum + b.length, 0);
  const totalInternalLength = savedInternalBeams.reduce((sum, b) => sum + b.length, 0);
  const totalThickness = localPodThickness + localTopThickness;

  // Don't render dialog during marking steps
  if (step === 'mark_edge_beam' || step === 'mark_internal_beam' || step === 'complete') {
    return null;
  }

  const getStepTitle = () => {
    if (isWafflePod && step === 'name') {
      return 'Name Waffle Pod Slab';
    }
    if (isDriveway && step === 'name') {
      return 'Name This Driveway';
    }
    switch (step) {
      case 'name':
        return 'Name This Slab';
      case 'edge_beam_details':
        return isDriveway ? 'Edge Thickening Details' : 'Edge Beam Details';
      case 'edge_beams_complete':
        return isDriveway ? 'Edge Thickening Summary' : 'Edge Beams Summary';
      case 'internal_beam_details':
        return `${getInternalLabel(false)} Details`;
      case 'internal_beams_complete':
        return `${getInternalLabel()} Summary`;
      default:
        return 'Slab Markup';
    }
  };

  const getStepDescription = () => {
    if (isWafflePod && step === 'name') {
      return 'Give this waffle pod slab a name, then mark the edge beams.';
    }
    if (isDriveway && step === 'name') {
      return 'Give this driveway a descriptive name, then add edge thickening if needed.';
    }
    switch (step) {
      case 'name':
        return `Give this ${scopeLabel.toLowerCase()} a descriptive name, then add beams if needed.`;
      case 'edge_beam_details':
        return isDriveway 
          ? 'Name this edge thickening and enter its dimensions.' 
          : 'Name this edge beam and enter its dimensions.';
      case 'edge_beams_complete':
        return isDriveway 
          ? 'Review edge thickening for this driveway.' 
          : 'Review edge beams or continue to internal beams.';
      case 'internal_beam_details':
        return `Name this ${getInternalLabel(false).toLowerCase()} and enter its dimensions.`;
      case 'internal_beams_complete':
        return `Review all ${getInternalLabel().toLowerCase()} for this slab.`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100] flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Wrong page warning */}
        {isOnWrongPage && onReturnToSlabPage && (
          <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="flex items-center justify-between gap-2">
              <span className="text-sm text-amber-700 dark:text-amber-400">
                Your slab is on Sheet {slabPage}.
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onReturnToSlabPage}
                className="shrink-0 gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <ArrowLeft className="h-3 w-3" />
                Return
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Step: Name */}
          {step === 'name' && (
            <div className="space-y-4 py-4">
              {/* Name input */}
              <div className="space-y-2">
                <Label htmlFor="slab-name">{isWafflePod ? 'Waffle Pod Name' : 'Slab Name'}</Label>
                <Input
                  id="slab-name"
                  value={slabName}
                  onChange={(e) => onSlabNameChange(e.target.value)}
                  placeholder={isWafflePod ? 'e.g., Main House, Extension' : 'e.g., Main Slab, Garage, Patio'}
                  autoFocus
                />
              </div>

              {/* Slab stats */}
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Area:</span>
                  <span className="font-medium">{slabArea.toFixed(2)} m²</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Perimeter:</span>
                  <span className="font-medium">{slabPerimeter.toFixed(2)} m</span>
                </div>
              </div>


              {/* Edge beam/thickening options - shown for all slab types including waffle pod */}
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">{getEdgeLabel()}</Label>
                <p className="text-xs text-muted-foreground">
                  {isEdgeThickeningScope
                    ? 'Slabs can have thickened edges around the perimeter.'
                    : isWafflePod
                      ? 'Waffle pod slabs have edge beams around the perimeter.'
                      : 'Raft slabs typically have thickened edge beams around the perimeter.'}
                </p>
                
                {/* Quick option: Full perimeter */}
                <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                  <p className="text-sm font-medium">
                    Does the {isDriveway ? 'edge thickening' : 'edge beam'} run the full perimeter?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="default"
                      onClick={onUsePerimeterAsEdgeBeam}
                      className="flex-1 gap-2"
                      disabled={!onUsePerimeterAsEdgeBeam}
                    >
                      <Check className="h-4 w-4" />
                      Yes ({slabPerimeter.toFixed(1)}m)
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={onStartEdgeBeams}
                      className="flex-1"
                    >
                      No, Mark Manually
                    </Button>
                  </div>
                  {onSkipEdgeBeams && (
                    <Button 
                      variant="ghost"
                      onClick={onSkipEdgeBeams}
                      className="w-full text-muted-foreground"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      No Edge Beams
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step: Edge Beam Details */}
          {step === 'edge_beam_details' && (
            <div className="space-y-4 py-4">
              {/* Length display with segments */}
              <div className="p-3 bg-primary/10 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {currentBeamSegments.length > 1 
                        ? `${currentBeamSegments.length} segments`
                        : 'Beam Length'}:
                    </span>
                  </div>
                  <Badge variant="default">{currentBeamLength.toFixed(2)} m</Badge>
                </div>
                {currentBeamSegments.length > 1 && (
                  <div className="text-xs text-muted-foreground border-t border-primary/20 pt-2 mt-2">
                    {currentBeamSegments.map((seg, i) => (
                      <span key={i}>
                        {seg.length.toFixed(2)}m{i < currentBeamSegments.length - 1 ? ' + ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Beam Type Selection - only show if existing types exist */}
              {existingEdgeBeamTypes.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Beam Type
                  </Label>
                  <Tabs value={edgeBeamTypeMode} onValueChange={(v) => handleEdgeBeamTypeModeChange(v as 'existing' | 'new')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="existing">Existing Type</TabsTrigger>
                      <TabsTrigger value="new">New Type</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {edgeBeamTypeMode === 'existing' && (
                    <Select value={selectedEdgeBeamTypeKey || ''} onValueChange={handleEdgeBeamTypeSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select beam type" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingEdgeBeamTypes.map(type => {
                          const key = `${type.name}-${type.width}-${type.depth}`;
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{type.name}</span>
                                <span className="text-muted-foreground">
                                  ({type.width}×{type.depth}mm) - {type.count} beam{type.count !== 1 ? 's' : ''}
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <Separator />

              {/* Type Name - for new types or if no existing types */}
              {(edgeBeamTypeMode === 'new' || existingEdgeBeamTypes.length === 0) && (
                <div className="space-y-2">
                  <Label htmlFor="edge-beam-type-name">Type Name</Label>
                  <Input
                    id="edge-beam-type-name"
                    value={beamName}
                    onChange={(e) => setBeamName(e.target.value)}
                    placeholder="e.g., EB1, EB2"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    This creates a new beam type. Future beams can reuse these dimensions.
                  </p>
                </div>
              )}

              {/* Show read-only name for existing type */}
              {edgeBeamTypeMode === 'existing' && existingEdgeBeamTypes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Beam Name</Label>
                  <div className="p-2 bg-muted rounded-lg">
                    <span className="font-medium">{beamName}</span>
                  </div>
                </div>
              )}

              {/* Dimensions - editable for new, read-only for existing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="beam-width">Width (mm)</Label>
                  <Input
                    id="beam-width"
                    type="number"
                    value={beamWidth}
                    onChange={(e) => setBeamWidth(Number(e.target.value))}
                    min={100}
                    max={1000}
                    disabled={edgeBeamTypeMode === 'existing' && existingEdgeBeamTypes.length > 0}
                    className={edgeBeamTypeMode === 'existing' && existingEdgeBeamTypes.length > 0 ? 'bg-muted' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beam-depth">Depth (mm)</Label>
                  <Input
                    id="beam-depth"
                    type="number"
                    value={beamDepth}
                    onChange={(e) => setBeamDepth(Number(e.target.value))}
                    min={100}
                    max={1500}
                    disabled={edgeBeamTypeMode === 'existing' && existingEdgeBeamTypes.length > 0}
                    className={edgeBeamTypeMode === 'existing' && existingEdgeBeamTypes.length > 0 ? 'bg-muted' : ''}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Edge Beams Complete Summary */}
          {step === 'edge_beams_complete' && (
            <div className="space-y-4 py-4">
              {/* Edge beams grouped by type */}
              {savedEdgeBeams.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{getEdgeLabel()} ({savedEdgeBeams.length})</Label>
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {existingEdgeBeamTypes.map((beamType) => {
                      const beamsOfType = savedEdgeBeams.filter(
                        b => b.name.split('-')[0].trim() === beamType.name && 
                             b.width === beamType.width && 
                             b.depth === beamType.depth
                      );
                      const typeLength = beamsOfType.reduce((sum, b) => sum + b.length, 0);
                      
                      const typeVolume = typeLength * (beamType.width / 1000) * (beamType.depth / 1000);
                      const itemLabel = isDriveway ? 'thickening' : 'beam';
                      
                      return (
                        <div key={`${beamType.name}-${beamType.width}-${beamType.depth}`} className="p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">{beamType.name}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {beamType.width}×{beamType.depth}mm
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{beamsOfType.length} {itemLabel}{beamsOfType.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Length:</span>
                              <span className="font-medium">{typeLength.toFixed(2)}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Volume:</span>
                              <span className="font-medium">{typeVolume.toFixed(2)}m³</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-2 bg-muted rounded-lg flex justify-between text-sm">
                    <span className="text-muted-foreground">Total {isDriveway ? 'Edge Thickening' : 'Edge Beam'} Length:</span>
                    <span className="font-medium">{totalEdgeLength.toFixed(1)} m</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                  No {isDriveway ? 'edge thickening' : 'edge beams'} added yet
                </div>
              )}

              {/* Only show internal beam option for scopes that support it */}
              {!hideInternalBeams && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{getInternalLabel()}</Label>
                    <p className="text-xs text-muted-foreground">
                      Would you like to add {getInternalLabel().toLowerCase()} within the slab?
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step: Internal Beam Details */}
          {step === 'internal_beam_details' && (
            <div className="space-y-4 py-4">
              {/* Length display - for discrete internal beams */}
              <div className="p-3 bg-primary/10 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {discreteInternalBeams.length > 1 
                        ? `${discreteInternalBeams.length} beams`
                        : discreteInternalBeams.length === 1 ? '1 beam' : 'Beam Length'}:
                    </span>
                  </div>
                  <Badge variant="default">
                    {discreteInternalBeams.length > 0 
                      ? discreteInternalBeams.reduce((sum, b) => sum + b.length, 0).toFixed(2)
                      : currentBeamLength.toFixed(2)} m
                  </Badge>
                </div>
                {discreteInternalBeams.length > 1 && (
                  <div className="text-xs text-muted-foreground border-t border-primary/20 pt-2 mt-2">
                    {discreteInternalBeams.map((beam, i) => (
                      <span key={i}>
                        {beam.length.toFixed(2)}m{i < discreteInternalBeams.length - 1 ? ' + ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Beam Type Selection - only show if existing types exist */}
              {existingInternalBeamTypes.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Beam Type
                  </Label>
                  <Tabs value={internalBeamTypeMode} onValueChange={(v) => handleInternalBeamTypeModeChange(v as 'existing' | 'new')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="existing">Existing Type</TabsTrigger>
                      <TabsTrigger value="new">New Type</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {internalBeamTypeMode === 'existing' && (
                    <Select value={selectedInternalBeamTypeKey || ''} onValueChange={handleInternalBeamTypeSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select beam type" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingInternalBeamTypes.map(type => {
                          const key = `${type.name}-${type.width}-${type.depth}`;
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{type.name}</span>
                                <span className="text-muted-foreground">
                                  ({type.width}×{type.depth}mm) - {type.count} beam{type.count !== 1 ? 's' : ''}
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <Separator />

              {/* Type Name - for new types or if no existing types */}
              {(internalBeamTypeMode === 'new' || existingInternalBeamTypes.length === 0) && (
                <div className="space-y-2">
                  <Label htmlFor="beam-type-name">Type Name</Label>
                  <Input
                    id="beam-type-name"
                    value={beamName}
                    onChange={(e) => setBeamName(e.target.value)}
                    placeholder="e.g., IB1, IB2"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    This creates a new beam type. Future beams can reuse these dimensions.
                  </p>
                </div>
              )}

              {/* Show read-only name for existing type */}
              {internalBeamTypeMode === 'existing' && existingInternalBeamTypes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Beam Name</Label>
                  <div className="p-2 bg-muted rounded-lg">
                    <span className="font-medium">{beamName}</span>
                  </div>
                </div>
              )}

              {/* Dimensions - editable for new, read-only for existing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="beam-width">Width (mm)</Label>
                  <Input
                    id="beam-width"
                    type="number"
                    value={beamWidth}
                    onChange={(e) => setBeamWidth(Number(e.target.value))}
                    min={100}
                    max={1000}
                    disabled={internalBeamTypeMode === 'existing' && existingInternalBeamTypes.length > 0}
                    className={internalBeamTypeMode === 'existing' && existingInternalBeamTypes.length > 0 ? 'bg-muted' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beam-depth">Depth (mm)</Label>
                  <Input
                    id="beam-depth"
                    type="number"
                    value={beamDepth}
                    onChange={(e) => setBeamDepth(Number(e.target.value))}
                    min={100}
                    max={1500}
                    disabled={internalBeamTypeMode === 'existing' && existingInternalBeamTypes.length > 0}
                    className={internalBeamTypeMode === 'existing' && existingInternalBeamTypes.length > 0 ? 'bg-muted' : ''}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Internal Beams Complete Summary */}
          {step === 'internal_beams_complete' && (
            <div className="space-y-4 py-4">
              {/* Edge beams summary */}
              {savedEdgeBeams.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Edge Beams ({savedEdgeBeams.length})</Label>
                  <div className="p-2 bg-muted rounded-lg flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Length:</span>
                    <span className="font-medium">{totalEdgeLength.toFixed(1)} m</span>
                  </div>
                </div>
              )}

              {/* Internal beams grouped by type */}
              {savedInternalBeams.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{getInternalLabel()} ({savedInternalBeams.length})</Label>
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {existingInternalBeamTypes.map((beamType) => {
                      const beamsOfType = savedInternalBeams.filter(
                        b => b.name.split('-')[0].trim() === beamType.name && 
                             b.width === beamType.width && 
                             b.depth === beamType.depth
                      );
                      const typeLength = beamsOfType.reduce((sum, b) => sum + b.length, 0);
                      
                      const typeVolume = typeLength * (beamType.width / 1000) * (beamType.depth / 1000);
                      
                      return (
                        <div key={`${beamType.name}-${beamType.width}-${beamType.depth}`} className="p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">{beamType.name}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {beamType.width}×{beamType.depth}mm
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{beamsOfType.length} beam{beamsOfType.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Length:</span>
                              <span className="font-medium">{typeLength.toFixed(2)}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Volume:</span>
                              <span className="font-medium">{typeVolume.toFixed(2)}m³</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-2 bg-muted rounded-lg flex justify-between text-sm">
                    <span className="text-muted-foreground">Total {getInternalLabel(false)} Length:</span>
                    <span className="font-medium">{totalInternalLength.toFixed(1)} m</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                  No {getInternalLabel().toLowerCase()} added yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed footer with responsive buttons */}
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end shrink-0 pt-4 border-t">
          {/* Step: Name */}
          {step === 'name' && (
            <>
              <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
              {isWafflePod ? (
                wafflePodCountingComplete ? (
                  // After counting: show beam workflow options
                  <>
                    <Button 
                      variant="secondary" 
                      onClick={handleWafflePodSkipBeams}
                      className="w-full sm:w-auto gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Finish (No Beams)
                    </Button>
                    <Button onClick={onStartEdgeBeams} className="w-full sm:w-auto gap-1">
                      Add Edge Beam
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  // Show Next button to proceed to beams
                  <>
                    <Button 
                      variant="secondary" 
                      onClick={handleWafflePodSkipBeams}
                      className="w-full sm:w-auto gap-1"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip All
                    </Button>
                    <Button onClick={handleWafflePodStartEdgeBeams} className="w-full sm:w-auto gap-1">
                      Mark edge beams
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )
              ) : (
                // Standard slab/driveway flow - only show Cancel/Skip, main actions are inline
                <>
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={onSkipAllBeams}
                    className="w-full sm:w-auto gap-1"
                  >
                    <SkipForward className="h-4 w-4" />
                    {isDriveway ? 'Skip Thickening' : 'Skip Beams'}
                  </Button>
                </>
              )}
            </>
          )}

          {/* Step: Edge Beam Details */}
          {step === 'edge_beam_details' && (
            <>
              <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSaveBeam} className="w-full sm:w-auto gap-1">
                <Check className="h-4 w-4" />
                Save Beam
              </Button>
            </>
          )}

          {/* Step: Edge Beams Complete */}
          {step === 'edge_beams_complete' && (
            <>
              <Button 
                variant="outline"
                onClick={onAddAnotherEdgeBeam}
                className="w-full sm:w-auto gap-1"
              >
                <Plus className="h-4 w-4" />
                {isDriveway ? 'Add Edge Thickening' : 'Add Edge Beam'}
              </Button>
              {isDriveway ? (
                // Driveway: just Finish button, no internal beams
                <Button onClick={onFinishEdgeBeams} className="w-full sm:w-auto gap-1">
                  <Check className="h-4 w-4" />
                  Finish
                </Button>
              ) : (
                // Other slabs: option to finish or add internal beams
                <>
                  <Button 
                    variant="secondary"
                    onClick={onFinishEdgeBeams}
                    className="w-full sm:w-auto gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Finish (No Internal)
                  </Button>
                  <Button onClick={onStartInternalBeams} className="w-full sm:w-auto gap-1">
                    Add {getInternalLabel(false)}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </>
          )}

          {/* Step: Internal Beam Details */}
          {step === 'internal_beam_details' && (
            <>
              <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSaveBeam} className="w-full sm:w-auto gap-1">
                <Check className="h-4 w-4" />
                Save Beam
              </Button>
            </>
          )}

          {/* Step: Internal Beams Complete */}
          {step === 'internal_beams_complete' && (
            <>
              <Button 
                variant="outline"
                onClick={onAddAnotherInternalBeam}
                className="w-full sm:w-auto gap-1"
              >
              <Plus className="h-4 w-4" />
                Add {getInternalLabel(false)}
              </Button>
              <Button onClick={onFinishAllBeams} className="w-full sm:w-auto gap-1">
                <Check className="h-4 w-4" />
                Finish Slab
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Floating bar component for when user is marking a single beam
interface SlabBeamMarkingBarProps {
  slabName: string;
  beamType: 'edge' | 'internal';
  beamNumber: number;
  currentLength: number;
  pointCount: number;
  onUndo: () => void;
  canUndo: boolean;
  onDone: () => void;
  onCancel: () => void;
  scopeId?: string;
}

export function SlabBeamMarkingBar({
  slabName,
  beamType,
  beamNumber,
  currentLength,
  pointCount,
  onUndo,
  canUndo,
  onDone,
  onCancel,
  scopeId,
}: SlabBeamMarkingBarProps) {
  // Get appropriate label based on scope and beam type
  const getBeamLabel = () => {
    if (beamType === 'edge') {
      // Edge thickening for driveway/crossovers/paths/standard_slab
      const edgeThickeningScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
      return edgeThickeningScopes.includes(scopeId || '') ? 'Edge Thickening' : 'Edge Beam';
    } else {
      // Internal thickening for standard_slab, otherwise internal beam
      return scopeId === 'standard_slab' ? 'Internal Thickening' : 'Internal Beam';
    }
  };
  const beamLabel = getBeamLabel();
  const beamColor = beamType === 'edge' ? EDGE_BEAM_COLOR : INTERNAL_BEAM_COLOR;
  
  return (
    <div className="bg-card border-2 shadow-xl rounded-xl overflow-hidden" style={{ borderColor: beamColor }}>
      {/* Header with context */}
      <div className="px-4 py-2 border-b" style={{ backgroundColor: `${beamColor}20`, borderColor: `${beamColor}40` }}>
        <div className="flex items-center gap-2">
          <Minus className="h-5 w-5 shrink-0" style={{ color: beamColor }} />
          <span className="font-semibold text-foreground">
            Drawing {beamLabel} #{beamNumber}
          </span>
          <span className="text-muted-foreground">for</span>
          <Badge variant="secondary">{slabName || 'Slab'}</Badge>
        </div>
      </div>
      
      {/* Stats and actions */}
      <div className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Stats */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <span className="text-xs text-muted-foreground">Points:</span>
            <span className="font-bold text-foreground">{pointCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <span className="text-xs text-muted-foreground">Length:</span>
            <span className="font-bold text-foreground">{currentLength.toFixed(2)}m</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Click to add points, then Done to name this beam
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canUndo && (
            <Button variant="outline" size="sm" onClick={onUndo} className="h-9">
              Undo
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-9 text-muted-foreground">
            Cancel
          </Button>
          <Button 
            size="lg" 
            onClick={onDone} 
            disabled={pointCount < 2}
            className="h-11 px-6 font-semibold text-base shadow-lg gap-2 text-white"
            style={{ backgroundColor: beamColor }}
          >
            <Check className="h-5 w-5" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
