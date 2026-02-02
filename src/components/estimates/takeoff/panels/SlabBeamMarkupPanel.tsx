import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, ArrowRight, Check, SkipForward, Minus, Plus, Layers } from 'lucide-react';
import { EDGE_BEAM_COLOR, INTERNAL_BEAM_COLOR } from '../DrawingCanvas';
import type { SlabWorkflowStep, BeamData, BeamSegment } from '../SlabBeamMarkupDialog';

// Interface for beam types (groups of beams with same dimensions)
interface BeamType {
  name: string;
  width: number;
  depth: number;
  count: number;
}

interface SlabBeamMarkupPanelProps {
  step: SlabWorkflowStep;
  slabName: string;
  onSlabNameChange: (name: string) => void;
  scopeLabel: string;
  scopeId?: string;
  slabArea?: number;
  slabPerimeter?: number;
  currentBeamPoints?: { x: number; y: number }[];
  currentBeamLength?: number;
  currentBeamSegments?: BeamSegment[];
  discreteInternalBeams?: Array<{ startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; length: number }>;
  savedEdgeBeams?: BeamData[];
  savedInternalBeams?: BeamData[];
  wafflePodSize?: string;
  wafflePodThickness?: number;
  wafflePodTopThickness?: number;
  wafflePodRibWidth?: number;
  onWafflePodDimensionsChange?: (size: string, podThickness: number, topThickness: number, ribWidth: number) => void;
  wafflePodCount?: number;
  spacer4WayCount?: number;
  spacer2WayCount?: number;
  wafflePodCountingComplete?: boolean;
  onStartCountingPods?: () => void;
  onStartEdgeBeams: () => void;
  onSkipAllBeams: () => void;
  onUsePerimeterAsEdgeBeam?: () => void;
  onSaveBeam: (beamData: { name: string; width: number; depth: number }) => void;
  onAddAnotherEdgeBeam: () => void;
  onFinishEdgeBeams: () => void;
  onStartInternalBeams: () => void;
  onAddAnotherInternalBeam: () => void;
  onFinishAllBeams: () => void;
  onCancel: () => void;
}

export function SlabBeamMarkupPanel({
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
  onUsePerimeterAsEdgeBeam,
  onSaveBeam,
  onAddAnotherEdgeBeam,
  onFinishEdgeBeams,
  onStartInternalBeams,
  onAddAnotherInternalBeam,
  onFinishAllBeams,
  onCancel,
}: SlabBeamMarkupPanelProps) {
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
  const edgeThickeningScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
  const isEdgeThickeningScope = edgeThickeningScopes.includes(scopeId || '');
  const noInternalBeamScopes = ['crossovers', 'paths_surrounds'];
  const hideInternalBeams = noInternalBeamScopes.includes(scopeId || '');
  
  const getEdgeLabel = (plural: boolean = true) => {
    if (isEdgeThickeningScope) return 'Edge Thickening';
    return plural ? 'Edge Beams' : 'Edge Beam';
  };
  
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
        setBeamWidth(isWafflePod ? 110 : 300);
        setBeamDepth(400);
      }
    }
  }, [step, savedEdgeBeams.length, savedInternalBeams.length, existingEdgeBeamTypes, existingInternalBeamTypes, nextNewEdgeTypeName, nextNewInternalTypeName, isWafflePod]);

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

  const handleInternalBeamTypeModeChange = (mode: 'existing' | 'new') => {
    setInternalBeamTypeMode(mode);
    if (mode === 'new') {
      setSelectedInternalBeamTypeKey(null);
      setBeamName(nextNewInternalTypeName);
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

  const handleWafflePodSkipBeams = () => {
    onWafflePodDimensionsChange?.(localPodSize, localPodThickness, localTopThickness, localRibWidth);
    onSkipAllBeams();
  };

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

  const totalEdgeLength = savedEdgeBeams.reduce((sum, b) => sum + b.length, 0);
  const totalInternalLength = savedInternalBeams.reduce((sum, b) => sum + b.length, 0);

  // Don't render during marking steps
  if (step === 'mark_edge_beam' || step === 'mark_internal_beam' || step === 'complete') {
    return null;
  }

  const getStepTitle = () => {
    if (isWafflePod && step === 'name') return 'Name Waffle Pod Slab';
    if (isDriveway && step === 'name') return 'Name This Driveway';
    switch (step) {
      case 'name': return 'Name This Slab';
      case 'edge_beam_details': return isDriveway ? 'Edge Thickening Details' : 'Edge Beam Details';
      case 'edge_beams_complete': return isDriveway ? 'Edge Thickening Summary' : 'Edge Beams Summary';
      case 'internal_beam_details': return `${getInternalLabel(false)} Details`;
      case 'internal_beams_complete': return `${getInternalLabel()} Summary`;
      default: return 'Slab Markup';
    }
  };

  const getStepDescription = () => {
    if (isWafflePod && step === 'name') return 'Give this waffle pod slab a name, then mark the edge beams.';
    if (isDriveway && step === 'name') return 'Give this driveway a descriptive name, then add edge thickening if needed.';
    switch (step) {
      case 'name': return `Give this ${scopeLabel.toLowerCase()} a descriptive name, then add beams if needed.`;
      case 'edge_beam_details': return isDriveway ? 'Name this edge thickening and enter its dimensions.' : 'Name this edge beam and enter its dimensions.';
      case 'edge_beams_complete': return isDriveway ? 'Review edge thickening for this driveway.' : 'Review edge beams or continue to internal beams.';
      case 'internal_beam_details': return `Name this ${getInternalLabel(false).toLowerCase()} and enter its dimensions.`;
      case 'internal_beams_complete': return `Review all ${getInternalLabel().toLowerCase()} for this slab.`;
      default: return '';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{getStepTitle()}</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{getStepDescription()}</p>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step: Name */}
        {step === 'name' && (
          <div className="space-y-4">
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

            <Separator />
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">{getEdgeLabel()}</Label>
              <p className="text-xs text-muted-foreground">
                {isDriveway 
                  ? 'Driveways can have thickened edges around the perimeter.'
                  : isWafflePod
                    ? 'Waffle pod slabs have edge beams around the perimeter.'
                    : 'Raft slabs typically have thickened edge beams around the perimeter.'}
              </p>
              
              <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                <p className="text-sm font-medium">
                  Does the {isDriveway ? 'edge thickening' : 'edge beam'} run the full perimeter?
                </p>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="default"
                    onClick={onUsePerimeterAsEdgeBeam}
                    className="w-full gap-2"
                    disabled={!onUsePerimeterAsEdgeBeam}
                  >
                    <Check className="h-4 w-4" />
                    Yes ({slabPerimeter.toFixed(1)}m)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={onStartEdgeBeams}
                    className="w-full"
                  >
                    No, Mark Manually
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Edge Beam Details */}
        {step === 'edge_beam_details' && (
          <div className="space-y-4">
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
            </div>

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
                                ({type.width}×{type.depth}mm)
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

            {edgeBeamTypeMode === 'existing' && existingEdgeBeamTypes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Beam Name</Label>
                <div className="p-2 bg-muted rounded-lg">
                  <span className="font-medium">{beamName}</span>
                </div>
              </div>
            )}

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
          <div className="space-y-4">
            {savedEdgeBeams.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{getEdgeLabel()} ({savedEdgeBeams.length})</Label>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
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
          <div className="space-y-4">
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
            </div>

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
                                ({type.width}×{type.depth}mm)
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

            {internalBeamTypeMode === 'existing' && existingInternalBeamTypes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Beam Name</Label>
                <div className="p-2 bg-muted rounded-lg">
                  <span className="font-medium">{beamName}</span>
                </div>
              </div>
            )}

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
          <div className="space-y-4">
            {savedEdgeBeams.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Edge Beams ({savedEdgeBeams.length})</Label>
                <div className="p-2 bg-muted rounded-lg flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Length:</span>
                  <span className="font-medium">{totalEdgeLength.toFixed(1)} m</span>
                </div>
              </div>
            )}

            {savedInternalBeams.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{getInternalLabel()} ({savedInternalBeams.length})</Label>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
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
                  <span className="text-muted-foreground">Total {getInternalLabel()} Length:</span>
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

      {/* Footer with action buttons */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30 flex flex-col gap-2">
        {/* Step: Name */}
        {step === 'name' && (
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}

        {/* Step: Edge Beam Details */}
        {step === 'edge_beam_details' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveBeam} className="flex-1 gap-1">
              <Check className="h-4 w-4" />
              Save Beam
            </Button>
          </div>
        )}

        {/* Step: Edge Beams Complete */}
        {step === 'edge_beams_complete' && (
          <>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onAddAnotherEdgeBeam} className="flex-1 gap-1">
                <Plus className="h-4 w-4" />
                Add {getEdgeLabel(false)}
              </Button>
              {!hideInternalBeams ? (
                <Button onClick={onStartInternalBeams} className="flex-1 gap-1">
                  <ArrowRight className="h-4 w-4" />
                  {getInternalLabel()}
                </Button>
              ) : (
                <Button onClick={onFinishAllBeams} className="flex-1 gap-1">
                  <Check className="h-4 w-4" />
                  Finish
                </Button>
              )}
            </div>
            {!hideInternalBeams && (
              <Button variant="secondary" onClick={onFinishAllBeams} className="w-full gap-1">
                <SkipForward className="h-4 w-4" />
                Skip {getInternalLabel()}, Finish Slab
              </Button>
            )}
          </>
        )}

        {/* Step: Internal Beam Details */}
        {step === 'internal_beam_details' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveBeam} className="flex-1 gap-1">
              <Check className="h-4 w-4" />
              Save Beam
            </Button>
          </div>
        )}

        {/* Step: Internal Beams Complete */}
        {step === 'internal_beams_complete' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onAddAnotherInternalBeam} className="flex-1 gap-1">
              <Plus className="h-4 w-4" />
              Add {getInternalLabel(false)}
            </Button>
            <Button onClick={onFinishAllBeams} className="flex-1 gap-1">
              <Check className="h-4 w-4" />
              Finish Slab
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
