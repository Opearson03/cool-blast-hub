import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tag, ArrowRight, Check, SkipForward, Minus } from 'lucide-react';
import { EDGE_BEAM_COLOR, INTERNAL_BEAM_COLOR } from './DrawingCanvas';

export type SlabWorkflowStep = 
  | 'name'
  | 'mark_edge_beams'
  | 'edge_beam_dimensions'
  | 'mark_internal_beams'
  | 'internal_beam_dimensions'
  | 'complete';

export interface PendingSlabData {
  slabPoints: { x: number; y: number }[];
  slabShapeType: 'polygon' | 'rectangle';
  slabName: string;
  edgeBeamSegments: { x: number; y: number }[][];
  edgeBeamDimensions: { width: number; depth: number } | null;
  internalBeamSegments: { x: number; y: number }[][];
  internalBeamDimensions: { width: number; depth: number } | null;
}

interface SlabBeamMarkupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: SlabWorkflowStep;
  slabName: string;
  onSlabNameChange: (name: string) => void;
  scopeLabel: string;
  /** Area in sqm from the slab polygon/rectangle */
  slabArea?: number;
  /** Perimeter in meters */
  slabPerimeter?: number;
  /** Total edge beam length marked so far */
  edgeBeamLength?: number;
  /** Total internal beam length marked so far */
  internalBeamLength?: number;
  /** Edge beam dimensions */
  edgeBeamWidth?: number;
  edgeBeamDepth?: number;
  onEdgeBeamDimensionsChange?: (width: number, depth: number) => void;
  /** Internal beam dimensions */
  internalBeamWidth?: number;
  internalBeamDepth?: number;
  onInternalBeamDimensionsChange?: (width: number, depth: number) => void;
  
  // Actions
  onAddEdgeBeams: () => void;
  onSkipEdgeBeams: () => void;
  onDoneMarkingEdgeBeams: () => void;
  onAddInternalBeams: () => void;
  onSkipInternalBeams: () => void;
  onDoneMarkingInternalBeams: () => void;
  /** Called to add more internal beams after saving current dimensions */
  onAddMoreInternalBeams: (currentDimensions: { width: number; depth: number }) => void;
  /** Called with final internal beam dimensions to ensure they're captured before save */
  onFinish: (finalInternalBeamDimensions?: { width: number; depth: number }) => void;
  onCancel: () => void;
}

export function SlabBeamMarkupDialog({
  open,
  onOpenChange,
  step,
  slabName,
  onSlabNameChange,
  scopeLabel,
  slabArea = 0,
  slabPerimeter = 0,
  edgeBeamLength = 0,
  internalBeamLength = 0,
  edgeBeamWidth = 450,
  edgeBeamDepth = 450,
  onEdgeBeamDimensionsChange,
  internalBeamWidth = 300,
  internalBeamDepth = 400,
  onInternalBeamDimensionsChange,
  onAddEdgeBeams,
  onSkipEdgeBeams,
  onDoneMarkingEdgeBeams,
  onAddInternalBeams,
  onSkipInternalBeams,
  onDoneMarkingInternalBeams,
  onAddMoreInternalBeams,
  onFinish,
  onCancel,
}: SlabBeamMarkupDialogProps) {
  const [localEdgeWidth, setLocalEdgeWidth] = useState(edgeBeamWidth);
  const [localEdgeDepth, setLocalEdgeDepth] = useState(edgeBeamDepth);
  const [localInternalWidth, setLocalInternalWidth] = useState(internalBeamWidth);
  const [localInternalDepth, setLocalInternalDepth] = useState(internalBeamDepth);

  // Sync local state with props
  useEffect(() => {
    setLocalEdgeWidth(edgeBeamWidth);
    setLocalEdgeDepth(edgeBeamDepth);
  }, [edgeBeamWidth, edgeBeamDepth]);

  useEffect(() => {
    setLocalInternalWidth(internalBeamWidth);
    setLocalInternalDepth(internalBeamDepth);
  }, [internalBeamWidth, internalBeamDepth]);

  const handleEdgeDimensionsSave = () => {
    onEdgeBeamDimensionsChange?.(localEdgeWidth, localEdgeDepth);
  };

  const handleInternalDimensionsSave = () => {
    onInternalBeamDimensionsChange?.(localInternalWidth, localInternalDepth);
  };

  // Don't render dialog during marking steps - show floating bar instead
  if (step === 'mark_edge_beams' || step === 'mark_internal_beams' || step === 'complete') {
    return null;
  }

  const getStepTitle = () => {
    switch (step) {
      case 'name':
        return 'Name This Slab';
      case 'edge_beam_dimensions':
        return 'Edge Beam Dimensions';
      case 'internal_beam_dimensions':
        return 'Internal Beam Dimensions';
      default:
        return 'Slab Markup';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'name':
        return `Give this ${scopeLabel.toLowerCase()} a descriptive name, then add edge beams if needed.`;
      case 'edge_beam_dimensions':
        return 'Enter the dimensions for the edge beams you marked.';
      case 'internal_beam_dimensions':
        return 'Enter the dimensions for the internal beams you marked.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Name */}
        {step === 'name' && (
          <div className="space-y-4 py-4">
            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="slab-name">Slab Name</Label>
              <Input
                id="slab-name"
                value={slabName}
                onChange={(e) => onSlabNameChange(e.target.value)}
                placeholder="e.g., Main Slab, Garage, Patio"
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

            <Separator />

            {/* Edge beam options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Edge Beams</Label>
              <p className="text-xs text-muted-foreground">
                Raft slabs typically have thickened edge beams around the perimeter. Would you like to mark them?
              </p>
            </div>
          </div>
        )}

        {/* Step: Edge Beam Dimensions */}
        {step === 'edge_beam_dimensions' && (
          <div className="space-y-4 py-4">
            {/* Length summary */}
            <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Edge Beam Length:</span>
              </div>
              <Badge variant="default">{edgeBeamLength.toFixed(1)} m</Badge>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edge-width">Width (mm)</Label>
                <Input
                  id="edge-width"
                  type="number"
                  value={localEdgeWidth}
                  onChange={(e) => setLocalEdgeWidth(Number(e.target.value))}
                  min={100}
                  max={1000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edge-depth">Depth (mm)</Label>
                <Input
                  id="edge-depth"
                  type="number"
                  value={localEdgeDepth}
                  onChange={(e) => setLocalEdgeDepth(Number(e.target.value))}
                  min={100}
                  max={1500}
                />
              </div>
            </div>

            <Separator />

            {/* Internal beam options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Internal Beams</Label>
              <p className="text-xs text-muted-foreground">
                Would you like to mark internal beams or thickenings within the slab?
              </p>
            </div>
          </div>
        )}

        {/* Step: Internal Beam Dimensions */}
        {step === 'internal_beam_dimensions' && (
          <div className="space-y-4 py-4">
            {/* Length summary */}
            <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Internal Beam Length:</span>
              </div>
              <Badge variant="default">{internalBeamLength.toFixed(1)} m</Badge>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="internal-width">Width (mm)</Label>
                <Input
                  id="internal-width"
                  type="number"
                  value={localInternalWidth}
                  onChange={(e) => setLocalInternalWidth(Number(e.target.value))}
                  min={100}
                  max={1000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internal-depth">Depth (mm)</Label>
                <Input
                  id="internal-depth"
                  type="number"
                  value={localInternalDepth}
                  onChange={(e) => setLocalInternalDepth(Number(e.target.value))}
                  min={100}
                  max={1500}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Step: Name */}
          {step === 'name' && (
            <>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                variant="secondary" 
                onClick={onSkipEdgeBeams}
                className="gap-1"
              >
                <SkipForward className="h-4 w-4" />
                No Beams, Just Save
              </Button>
              <Button onClick={onAddEdgeBeams} className="gap-1">
                Add Edge Beams
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Step: Edge Beam Dimensions */}
          {step === 'edge_beam_dimensions' && (
            <>
              <Button 
                variant="secondary" 
                onClick={() => {
                  handleEdgeDimensionsSave();
                  onSkipInternalBeams();
                }}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Finish
              </Button>
              <Button 
                onClick={() => {
                  handleEdgeDimensionsSave();
                  onAddInternalBeams();
                }} 
                className="gap-1"
              >
                Add Internal Beams
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Step: Internal Beam Dimensions */}
          {step === 'internal_beam_dimensions' && (
            <>
              <Button 
                variant="secondary"
                onClick={() => {
                  // Save current dimensions and go back to mark more internal beams
                  onAddMoreInternalBeams({ width: localInternalWidth, depth: localInternalDepth });
                }} 
                className="gap-1"
              >
                <ArrowRight className="h-4 w-4" />
                Add More Internal Beams
              </Button>
              <Button 
                onClick={() => {
                  // Pass dimensions directly to onFinish to avoid React state timing issues
                  onFinish({ width: localInternalWidth, depth: localInternalDepth });
                }} 
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Save All
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Floating bar component for when user is marking beams
interface SlabBeamMarkingBarProps {
  slabName: string;
  beamType: 'edge' | 'internal';
  segmentCount: number;
  currentLength: number;
  onUndo: () => void;
  canUndo: boolean;
  onDone: () => void;
  onCancel: () => void;
}

export function SlabBeamMarkingBar({
  slabName,
  beamType,
  segmentCount,
  currentLength,
  onUndo,
  canUndo,
  onDone,
  onCancel,
}: SlabBeamMarkingBarProps) {
  const beamLabel = beamType === 'edge' ? 'Edge Beams' : 'Internal Beams';
  const beamColor = beamType === 'edge' ? EDGE_BEAM_COLOR : INTERNAL_BEAM_COLOR;
  
  return (
    <div className="bg-card border-2 shadow-xl rounded-xl overflow-hidden" style={{ borderColor: beamColor }}>
      {/* Header with context */}
      <div className="px-4 py-2 border-b" style={{ backgroundColor: `${beamColor}20`, borderColor: `${beamColor}40` }}>
        <div className="flex items-center gap-2">
          <Minus className="h-5 w-5 shrink-0" style={{ color: beamColor }} />
          <span className="font-semibold text-foreground">
            Marking {beamLabel}
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
            <span className="font-bold text-foreground">{segmentCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <span className="text-xs text-muted-foreground">Length:</span>
            <span className="font-bold text-foreground">{currentLength.toFixed(1)}m</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Click to add points along the beam, then click Done
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canUndo && (
            <Button variant="outline" size="sm" onClick={onUndo} className="h-9">
              Undo Point
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-9 text-muted-foreground">
            Cancel
          </Button>
          <Button 
            size="lg" 
            onClick={onDone} 
            className="h-11 px-6 font-semibold text-base shadow-lg gap-2 text-white"
            style={{ backgroundColor: beamColor }}
          >
            <Check className="h-5 w-5" />
            Done with {beamLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
