import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, ArrowRight, Check, SkipForward, Minus, Plus, Layers } from 'lucide-react';
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
  | 'mark_edge_beam'      // Drawing a single edge beam
  | 'edge_beam_details'   // Name + dimensions for single edge beam
  | 'edge_beams_complete' // Summary of edge beams, option to add more or move to internal
  | 'mark_internal_beam'  // Drawing a single internal beam
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
  // Waffle pod specific
  wafflePodSize?: string;
  wafflePodThickness?: number;
  wafflePodTopThickness?: number;
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

interface SlabBeamMarkupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: SlabWorkflowStep;
  slabName: string;
  onSlabNameChange: (name: string) => void;
  scopeLabel: string;
  scopeId?: string;
  /** Area in sqm from the slab polygon/rectangle */
  slabArea?: number;
  /** Perimeter in meters */
  slabPerimeter?: number;
  /** Current beam being marked (for details step) */
  currentBeamPoints?: { x: number; y: number }[];
  currentBeamLength?: number;
  /** List of already saved edge beams */
  savedEdgeBeams?: BeamData[];
  /** List of already saved internal beams */
  savedInternalBeams?: BeamData[];
  /** Waffle pod dimensions */
  wafflePodSize?: string;
  wafflePodThickness?: number;
  wafflePodTopThickness?: number;
  onWafflePodDimensionsChange?: (size: string, podThickness: number, topThickness: number) => void;
  
  // Actions for slab naming step
  onStartEdgeBeams: () => void;
  onSkipAllBeams: () => void;
  
  // Actions for individual beam details
  onSaveBeam: (beamData: { name: string; width: number; depth: number }) => void;
  
  // Actions for beam completion steps
  onAddAnotherEdgeBeam: () => void;
  onFinishEdgeBeams: () => void;
  onStartInternalBeams: () => void;
  onAddAnotherInternalBeam: () => void;
  onFinishAllBeams: () => void;
  
  onCancel: () => void;
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
  savedEdgeBeams = [],
  savedInternalBeams = [],
  wafflePodSize = '1090x1090',
  wafflePodThickness = 225,
  wafflePodTopThickness = 85,
  onWafflePodDimensionsChange,
  onStartEdgeBeams,
  onSkipAllBeams,
  onSaveBeam,
  onAddAnotherEdgeBeam,
  onFinishEdgeBeams,
  onStartInternalBeams,
  onAddAnotherInternalBeam,
  onFinishAllBeams,
  onCancel,
}: SlabBeamMarkupDialogProps) {
  // Local state for beam details
  const [beamName, setBeamName] = useState('');
  const [beamWidth, setBeamWidth] = useState(450);
  const [beamDepth, setBeamDepth] = useState(450);
  
  // Internal beam type selection mode
  const [beamTypeMode, setBeamTypeMode] = useState<'existing' | 'new'>('new');
  const [selectedBeamTypeKey, setSelectedBeamTypeKey] = useState<string | null>(null);
  
  // Waffle pod state
  const [localPodSize, setLocalPodSize] = useState(wafflePodSize);
  const [localPodThickness, setLocalPodThickness] = useState(wafflePodThickness);
  const [localTopThickness, setLocalTopThickness] = useState(wafflePodTopThickness);

  const isWafflePod = scopeId === 'waffle_pod';

  // Derive existing internal beam types from saved beams
  const existingBeamTypes = useMemo((): BeamType[] => {
    const typeMap = new Map<string, BeamType>();
    savedInternalBeams.forEach(beam => {
      // Extract base name (before hyphen suffix, e.g., "IB1" from "IB1-2")
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

  // Get next suggested type name for new internal beam type
  const nextNewTypeName = useMemo(() => {
    const existingNumbers = existingBeamTypes
      .map(t => t.name)
      .filter(name => /^IB\d+$/.test(name))
      .map(name => parseInt(name.replace('IB', ''), 10));
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `IB${maxNum + 1}`;
  }, [existingBeamTypes]);

  // Generate default beam name based on type and count
  useEffect(() => {
    if (step === 'edge_beam_details') {
      setBeamName(`Edge Beam ${savedEdgeBeams.length + 1}`);
      // Use dimensions from last edge beam if available
      if (savedEdgeBeams.length > 0) {
        const lastBeam = savedEdgeBeams[savedEdgeBeams.length - 1];
        setBeamWidth(lastBeam.width);
        setBeamDepth(lastBeam.depth);
      } else {
        setBeamWidth(450);
        setBeamDepth(450);
      }
    } else if (step === 'internal_beam_details') {
      // Reset mode when entering internal beam details
      if (existingBeamTypes.length > 0) {
        // Default to existing type mode if we have types
        setBeamTypeMode('existing');
        const firstType = existingBeamTypes[0];
        const key = `${firstType.name}-${firstType.width}-${firstType.depth}`;
        setSelectedBeamTypeKey(key);
        // Calculate next beam number for this type
        const beamCount = savedInternalBeams.filter(b => b.name.split('-')[0].trim() === firstType.name).length;
        setBeamName(`${firstType.name}-${beamCount + 1}`);
        setBeamWidth(firstType.width);
        setBeamDepth(firstType.depth);
      } else {
        // No existing types, start fresh
        setBeamTypeMode('new');
        setSelectedBeamTypeKey(null);
        setBeamName(nextNewTypeName);
        setBeamWidth(300);
        setBeamDepth(400);
      }
    }
  }, [step, savedEdgeBeams.length, savedInternalBeams.length, existingBeamTypes, nextNewTypeName]);

  // Handle beam type selection change
  const handleBeamTypeSelect = (key: string) => {
    setSelectedBeamTypeKey(key);
    const selectedType = existingBeamTypes.find(t => `${t.name}-${t.width}-${t.depth}` === key);
    if (selectedType) {
      const beamCount = savedInternalBeams.filter(b => b.name.split('-')[0].trim() === selectedType.name).length;
      setBeamName(`${selectedType.name}-${beamCount + 1}`);
      setBeamWidth(selectedType.width);
      setBeamDepth(selectedType.depth);
    }
  };

  // Handle switching between existing/new type mode
  const handleBeamTypeModeChange = (mode: 'existing' | 'new') => {
    setBeamTypeMode(mode);
    if (mode === 'new') {
      setSelectedBeamTypeKey(null);
      setBeamName(nextNewTypeName);
      setBeamWidth(300);
      setBeamDepth(400);
    } else if (mode === 'existing' && existingBeamTypes.length > 0) {
      const firstType = existingBeamTypes[0];
      handleBeamTypeSelect(`${firstType.name}-${firstType.width}-${firstType.depth}`);
    }
  };

  useEffect(() => {
    setLocalPodSize(wafflePodSize);
    setLocalPodThickness(wafflePodThickness);
    setLocalTopThickness(wafflePodTopThickness);
  }, [wafflePodSize, wafflePodThickness, wafflePodTopThickness]);

  const handleWafflePodSave = () => {
    onWafflePodDimensionsChange?.(localPodSize, localPodThickness, localTopThickness);
    onSkipAllBeams();
  };

  const handleSaveBeam = () => {
    onSaveBeam({
      name: beamName.trim() || (step === 'edge_beam_details' ? `Edge Beam ${savedEdgeBeams.length + 1}` : `Internal Beam ${savedInternalBeams.length + 1}`),
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
      return 'Name This Waffle Pod';
    }
    switch (step) {
      case 'name':
        return 'Name This Slab';
      case 'edge_beam_details':
        return 'Edge Beam Details';
      case 'edge_beams_complete':
        return 'Edge Beams Summary';
      case 'internal_beam_details':
        return 'Internal Beam Details';
      case 'internal_beams_complete':
        return 'Internal Beams Summary';
      default:
        return 'Slab Markup';
    }
  };

  const getStepDescription = () => {
    if (isWafflePod && step === 'name') {
      return 'Give this waffle pod slab a name and select the pod dimensions.';
    }
    switch (step) {
      case 'name':
        return `Give this ${scopeLabel.toLowerCase()} a descriptive name, then add beams if needed.`;
      case 'edge_beam_details':
        return 'Name this edge beam and enter its dimensions.';
      case 'edge_beams_complete':
        return 'Review edge beams or continue to internal beams.';
      case 'internal_beam_details':
        return 'Name this internal beam and enter its dimensions.';
      case 'internal_beams_complete':
        return 'Review all beams for this slab.';
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

              {/* Waffle Pod specific options */}
              {isWafflePod ? (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Pod Module Size</Label>
                      <Select value={localPodSize} onValueChange={setLocalPodSize}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pod size" />
                        </SelectTrigger>
                        <SelectContent>
                          {WAFFLE_POD_MODULE_SIZES.map(size => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Pod Thickness</Label>
                      <Select value={String(localPodThickness)} onValueChange={(v) => setLocalPodThickness(Number(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pod thickness" />
                        </SelectTrigger>
                        <SelectContent>
                          {WAFFLE_POD_THICKNESSES.map(thickness => (
                            <SelectItem key={thickness.value} value={thickness.value}>
                              {thickness.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="top-thickness" className="text-sm font-medium">Top Slab Thickness (mm)</Label>
                      <Input
                        id="top-thickness"
                        type="number"
                        value={localTopThickness}
                        onChange={(e) => setLocalTopThickness(Number(e.target.value))}
                        min={50}
                        max={200}
                        placeholder="85"
                      />
                      <p className="text-xs text-muted-foreground">
                        Concrete topping over waffle pods
                      </p>
                    </div>

                    {/* Total thickness display */}
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Slab Thickness:</span>
                        <span className="font-medium">{totalThickness}mm</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Separator />
                  {/* Edge beam options (raft slab only) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Edge Beams</Label>
                    <p className="text-xs text-muted-foreground">
                      Raft slabs typically have thickened edge beams around the perimeter. Each beam can have its own name and dimensions.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step: Edge Beam Details */}
          {step === 'edge_beam_details' && (
            <div className="space-y-4 py-4">
              {/* Length display */}
              <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Beam Length:</span>
                </div>
                <Badge variant="default">{currentBeamLength.toFixed(2)} m</Badge>
              </div>

              {/* Beam name */}
              <div className="space-y-2">
                <Label htmlFor="beam-name">Beam Name</Label>
                <Input
                  id="beam-name"
                  value={beamName}
                  onChange={(e) => setBeamName(e.target.value)}
                  placeholder="e.g., North Edge, Front Wall"
                  autoFocus
                />
              </div>

              {/* Dimensions */}
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
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Edge Beams Complete Summary */}
          {step === 'edge_beams_complete' && (
            <div className="space-y-4 py-4">
              {/* Edge beams list */}
              {savedEdgeBeams.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Edge Beams Added ({savedEdgeBeams.length})</Label>
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {savedEdgeBeams.map((beam, idx) => (
                      <div key={idx} className="p-2 flex justify-between items-center text-sm">
                        <span className="font-medium">{beam.name}</span>
                        <div className="flex gap-2 text-muted-foreground">
                          <span>{beam.length.toFixed(1)}m</span>
                          <span>•</span>
                          <span>{beam.width}×{beam.depth}mm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 bg-muted rounded-lg flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Edge Beam Length:</span>
                    <span className="font-medium">{totalEdgeLength.toFixed(1)} m</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                  No edge beams added yet
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Internal Beams</Label>
                <p className="text-xs text-muted-foreground">
                  Would you like to add internal beams or thickenings within the slab?
                </p>
              </div>
            </div>
          )}

          {/* Step: Internal Beam Details */}
          {step === 'internal_beam_details' && (
            <div className="space-y-4 py-4">
              {/* Length display */}
              <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Beam Length:</span>
                </div>
                <Badge variant="default">{currentBeamLength.toFixed(2)} m</Badge>
              </div>

              {/* Beam Type Selection - only show if existing types exist */}
              {existingBeamTypes.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Beam Type
                  </Label>
                  <Tabs value={beamTypeMode} onValueChange={(v) => handleBeamTypeModeChange(v as 'existing' | 'new')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="existing">Existing Type</TabsTrigger>
                      <TabsTrigger value="new">New Type</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {beamTypeMode === 'existing' && (
                    <Select value={selectedBeamTypeKey || ''} onValueChange={handleBeamTypeSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select beam type" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingBeamTypes.map(type => {
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
              {(beamTypeMode === 'new' || existingBeamTypes.length === 0) && (
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
              {beamTypeMode === 'existing' && existingBeamTypes.length > 0 && (
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
                    disabled={beamTypeMode === 'existing' && existingBeamTypes.length > 0}
                    className={beamTypeMode === 'existing' && existingBeamTypes.length > 0 ? 'bg-muted' : ''}
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
                    disabled={beamTypeMode === 'existing' && existingBeamTypes.length > 0}
                    className={beamTypeMode === 'existing' && existingBeamTypes.length > 0 ? 'bg-muted' : ''}
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
                  <Label className="text-sm font-medium">Internal Beams ({savedInternalBeams.length})</Label>
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {existingBeamTypes.map((beamType) => {
                      const beamsOfType = savedInternalBeams.filter(
                        b => b.name.split('-')[0].trim() === beamType.name && 
                             b.width === beamType.width && 
                             b.depth === beamType.depth
                      );
                      const typeLength = beamsOfType.reduce((sum, b) => sum + b.length, 0);
                      
                      return (
                        <div key={`${beamType.name}-${beamType.width}-${beamType.depth}`} className="p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">{beamType.name}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {beamType.width}×{beamType.depth}mm
                              </span>
                            </div>
                            <span className="text-sm font-medium">{typeLength.toFixed(1)}m total</span>
                          </div>
                          <div className="pl-2 space-y-1">
                            {beamsOfType.map((beam, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>{beam.name}</span>
                                <span>{beam.length.toFixed(1)}m</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-2 bg-muted rounded-lg flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Internal Beam Length:</span>
                    <span className="font-medium">{totalInternalLength.toFixed(1)} m</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                  No internal beams added yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed footer with responsive buttons */}
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end shrink-0 pt-4 border-t">
          {/* Step: Name */}
          {step === 'name' && isWafflePod && (
            <>
              <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleWafflePodSave} className="w-full sm:w-auto gap-1">
                <Check className="h-4 w-4" />
                Save Waffle Pod
              </Button>
            </>
          )}
          {step === 'name' && !isWafflePod && (
            <>
              <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                variant="secondary" 
                onClick={onSkipAllBeams}
                className="w-full sm:w-auto gap-1"
              >
                <SkipForward className="h-4 w-4" />
                Skip Beams
              </Button>
              <Button onClick={onStartEdgeBeams} className="w-full sm:w-auto gap-1">
                Add Edge Beam
                <ArrowRight className="h-4 w-4" />
              </Button>
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
                Add Edge Beam
              </Button>
              <Button 
                variant="secondary"
                onClick={onFinishEdgeBeams}
                className="w-full sm:w-auto gap-1"
              >
                <Check className="h-4 w-4" />
                Finish (No Internal)
              </Button>
              <Button onClick={onStartInternalBeams} className="w-full sm:w-auto gap-1">
                Add Internal Beam
                <ArrowRight className="h-4 w-4" />
              </Button>
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
                Add Internal Beam
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
}: SlabBeamMarkingBarProps) {
  const beamLabel = beamType === 'edge' ? 'Edge Beam' : 'Internal Beam';
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
