import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointer2, 
  Ruler,
  Undo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ChevronDown,
  AlertCircle,
  CircleDot,
  Minus
} from 'lucide-react';
import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DrawingTool, TakeoffFile } from '@/types/takeoff';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ToolbarToolType = 'polygon' | 'rectangle' | 'select' | 'pan' | 'calibrate' | 'point' | 'polyline';

interface TakeoffToolbarProps {
  activeTool: ToolbarToolType;
  onToolChange: (tool: ToolbarToolType) => void;
  onCalibrate: () => void;
  onUndo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  canUndo: boolean;
  canDelete: boolean;
  isCalibrated: boolean;
  currentScale: number | null;
  zoom: number;
  files?: TakeoffFile[];
  currentFileId?: string | null;
  onFileChange?: (fileId: string) => void;
  currentPage?: number;
  // Point mode props (piers, bollards, pads)
  isPointMode?: boolean;
  pointCount?: number;
  pointLabel?: string; // e.g. "pier", "bollard", "pad footing"
  onDoneMarkingPoints?: () => void;
  // Polyline mode props (linear elements)
  isPolylineMode?: boolean;
  polylineLength?: number;
  polylineSegmentCount?: number; // Number of segments (points - 1)
  polylineLabel?: string; // e.g. "footing", "kerb"
  onDoneMarkingPolyline?: () => void;
  // Beam marking mode props (edge/internal beams for slabs)
  isBeamMarkingMode?: boolean;
  beamType?: 'edge' | 'internal';
  beamSlabName?: string;
  beamPointCount?: number;
  beamLength?: number;
  discreteBeamCount?: number; // For internal beams: number of discrete beams marked
  onDoneMarkingBeams?: () => void;
  onCancelBeamMarking?: () => void;
  scopeId?: string; // For scope-aware labeling (internal thickening vs internal beam)
  // Joint marking mode props (expansion joints, control joints, saw cuts)
  isJointMode?: boolean;
  jointLabel?: string; // e.g. "expansion joint", "control joint"
  jointSegmentCount?: number; // Number of discrete joint segments
  jointTotalLength?: number; // Total length of all joint segments
  onDoneMarkingJoints?: () => void;
  onCancelJointMarking?: () => void;
}

export function TakeoffToolbar({
  activeTool,
  onToolChange,
  onCalibrate,
  onUndo,
  onDelete,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  canUndo,
  canDelete,
  isCalibrated,
  currentScale,
  zoom,
  files = [],
  currentFileId,
  onFileChange,
  currentPage = 1,
  isPointMode = false,
  pointCount = 0,
  pointLabel = 'pier',
  onDoneMarkingPoints,
  isPolylineMode = false,
  polylineLength = 0,
  polylineSegmentCount = 0,
  polylineLabel = 'element',
  onDoneMarkingPolyline,
  isBeamMarkingMode = false,
  beamType = 'edge',
  beamSlabName = 'Slab',
  beamPointCount = 0,
  beamLength = 0,
  discreteBeamCount,
  onDoneMarkingBeams,
  onCancelBeamMarking,
  scopeId,
  isJointMode = false,
  jointLabel = 'joint',
  jointSegmentCount = 0,
  jointTotalLength = 0,
  onDoneMarkingJoints,
  onCancelJointMarking,
}: TakeoffToolbarProps) {
  const tools: { type: ToolbarToolType; icon: React.ReactNode; label: string }[] = [
    { type: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Select' },
  ];

  const currentFile = files.find(f => f.id === currentFileId);

  // If in point mode (piers, bollards, pads), show point-specific UI
  if (isPointMode) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 sm:p-2 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <CircleDot className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium">Tap each {pointLabel} location</span>
          {pointCount > 0 && (
            <Badge variant="default" className="ml-auto sm:ml-2">
              {pointCount} marked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pointCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              className="h-11 sm:h-8 px-3"
            >
              <Undo2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToolChange('select')}
            className="flex-1 sm:flex-none h-11 sm:h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onDoneMarkingPoints}
            disabled={pointCount === 0}
            className="flex-1 sm:flex-none h-11 sm:h-8"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  // If in joint marking mode (expansion joints, control joints, saw cuts), show joint-specific UI
  if (isJointMode) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 sm:p-2 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <Scissors className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium">
            {jointSegmentCount === 0 
              ? `Tap to mark ${jointLabel} lines`
              : `Continue marking ${jointLabel} lines`}
          </span>
          {jointTotalLength > 0 && (
            <Badge variant="default" className="ml-auto sm:ml-2">
              {jointSegmentCount} {jointSegmentCount === 1 ? 'line' : 'lines'} • {jointTotalLength.toFixed(1)}m
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-11 sm:h-8 px-3"
          >
            <Undo2 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelJointMarking}
            className="h-11 sm:h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onDoneMarkingJoints}
            disabled={jointSegmentCount === 0}
            className="h-11 sm:h-8"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  // If in polyline mode (linear elements), show polyline-specific UI
  if (isPolylineMode) {
    const segmentCount = polylineSegmentCount ?? 0;
    const hasMultipleSegments = segmentCount > 1;
    
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 sm:p-2 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <Minus className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium">
            {segmentCount === 0 
              ? `Tap to start ${polylineLabel} path`
              : `Continue adding ${polylineLabel} segments`}
          </span>
          {polylineLength > 0 && (
            <Badge variant="default" className="ml-auto sm:ml-2">
              {hasMultipleSegments 
                ? `${segmentCount} segs • ${polylineLength.toFixed(1)}m`
                : `${polylineLength.toFixed(1)}m`}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-11 sm:h-8 px-3"
          >
            <Undo2 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToolChange('select')}
            className="h-11 sm:h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onDoneMarkingPolyline}
            disabled={polylineLength === 0}
            className="h-11 sm:h-8"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  // If in beam marking mode (edge/internal beams for slabs), show beam-specific UI
  if (isBeamMarkingMode) {
    // Determine label based on scope and beam type
    const getBeamTypeLabel = () => {
      if (beamType === 'edge') {
        const edgeThickeningScopes = ['driveway', 'crossovers', 'paths_surrounds', 'standard_slab'];
        return edgeThickeningScopes.includes(scopeId || '') ? 'Edge Thickening' : 'Edge Beam';
      } else {
        return scopeId === 'standard_slab' ? 'Internal Thickening' : 'Internal Beam';
      }
    };
    const beamTypeLabel = getBeamTypeLabel();
    const isInternalBeam = beamType === 'internal';
    const hasDiscreteBeams = isInternalBeam && discreteBeamCount !== undefined && discreteBeamCount > 0;
    const showDoneButton = isInternalBeam ? hasDiscreteBeams : beamPointCount >= 2;
    
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 sm:p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <Minus className="h-5 w-5 text-orange-500 shrink-0" />
          <span className="text-sm font-medium">
            {isInternalBeam ? 'Tap 2 points per beam' : `Marking ${beamTypeLabel}`}
          </span>
          <Badge variant="secondary" className="text-xs">
            {beamSlabName}
          </Badge>
          {hasDiscreteBeams && (
            <Badge variant="default" className="ml-auto sm:ml-2 bg-orange-500 hover:bg-orange-500">
              {discreteBeamCount} beam{discreteBeamCount !== 1 ? 's' : ''} • {beamLength.toFixed(1)}m
            </Badge>
          )}
          {!isInternalBeam && beamPointCount > 0 && (
            <Badge variant="default" className="ml-auto sm:ml-2 bg-orange-500 hover:bg-orange-500">
              {beamPointCount} pts | {beamLength.toFixed(1)}m
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(hasDiscreteBeams || beamPointCount > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              className="h-11 sm:h-8 px-3"
            >
              <Undo2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelBeamMarking}
            className="h-11 sm:h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onDoneMarkingBeams}
            disabled={!showDoneButton}
            className="h-11 sm:h-8 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-muted/50 rounded-lg">
      {/* File selector - show when multiple files */}
      {files.length > 1 && onFileChange && (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-10 sm:h-8 flex-1 sm:flex-none sm:max-w-[200px]">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentFile?.file_name || 'Select file'}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {files.map((file) => (
                <DropdownMenuItem
                  key={file.id}
                  onClick={() => onFileChange(file.id)}
                  className={cn(
                    "gap-2",
                    file.id === currentFileId && "bg-accent"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  <span className="truncate">{file.file_name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
        </div>
      )}

      {/* Main toolbar row */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Drawing tools */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <Button
              key={tool.type}
              variant={activeTool === tool.type ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange(tool.type)}
              title={tool.label}
              className={cn(
                'h-10 w-10 sm:h-8 sm:w-8 p-0',
                activeTool === tool.type && 'bg-primary text-primary-foreground'
              )}
            >
              {tool.icon}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Calibration with scale status */}
        <div className="flex items-center gap-2">
          <Button
            variant={isCalibrated ? 'outline' : 'secondary'}
            size="sm"
            onClick={onCalibrate}
            className={cn(
              'gap-1.5 h-10 sm:h-8',
              !isCalibrated && 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
            )}
          >
            <Ruler className="h-4 w-4" />
            <span className="hidden xs:inline">{isCalibrated ? 'Recalibrate' : 'Set Scale'}</span>
          </Button>
          
          {/* Scale status badge */}
          {isCalibrated && currentScale ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 gap-1 hidden sm:flex">
              Page {currentPage}: {currentScale.toFixed(0)} px/m
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Page {currentPage}:</span> Not set
            </Badge>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="h-10 w-10 sm:h-8 sm:w-8 p-0"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={!canDelete}
            title="Delete selected"
            className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            title="Zoom out"
            className="h-10 w-10 sm:h-8 sm:w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[40px] text-center hidden sm:block">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            title="Zoom in"
            className="h-10 w-10 sm:h-8 sm:w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFitToScreen}
            title="Fit to screen"
            className="h-10 w-10 sm:h-8 sm:w-8 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
