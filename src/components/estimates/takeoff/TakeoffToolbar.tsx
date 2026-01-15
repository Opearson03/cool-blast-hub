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
  polylineLabel?: string; // e.g. "footing", "kerb"
  onDoneMarkingPolyline?: () => void;
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
  polylineLabel = 'element',
  onDoneMarkingPolyline,
}: TakeoffToolbarProps) {
  const tools: { type: ToolbarToolType; icon: React.ReactNode; label: string }[] = [
    { type: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Select' },
  ];

  const currentFile = files.find(f => f.id === currentFileId);

  // If in point mode (piers, bollards, pads), show point-specific UI
  if (isPointMode) {
    return (
      <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/30 rounded-lg flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <CircleDot className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Click on each {pointLabel} location</span>
          {pointCount > 0 && (
            <Badge variant="default" className="ml-2">
              {pointCount} {pointLabel}{pointCount !== 1 ? 's' : ''} marked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToolChange('select')}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onDoneMarkingPoints}
            disabled={pointCount === 0}
          >
            Done Marking {pointLabel.charAt(0).toUpperCase() + pointLabel.slice(1)}s
          </Button>
        </div>
      </div>
    );
  }

  // If in polyline mode (linear elements), show polyline-specific UI
  if (isPolylineMode) {
    return (
      <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/30 rounded-lg flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <Minus className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Click points along the {polylineLabel} path</span>
          {polylineLength > 0 && (
            <Badge variant="default" className="ml-2">
              {polylineLength.toFixed(1)}m drawn
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4 mr-1" /> Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToolChange('select')}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onDoneMarkingPolyline}
            disabled={polylineLength === 0}
          >
            Done — Enter Dimensions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg flex-wrap">
      {/* File selector - show when multiple files */}
      {files.length > 1 && onFileChange && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 max-w-[200px]">
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
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

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
              'h-8 w-8 p-0',
              activeTool === tool.type && 'bg-primary text-primary-foreground'
            )}
          >
            {tool.icon}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Calibration with scale status */}
      <div className="flex items-center gap-2">
        <Button
          variant={isCalibrated ? 'outline' : 'secondary'}
          size="sm"
          onClick={onCalibrate}
          className={cn(
            'gap-1.5 h-8',
            !isCalibrated && 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
          )}
        >
          <Ruler className="h-4 w-4" />
          {isCalibrated ? 'Recalibrate' : 'Set Scale'}
        </Button>
        
        {/* Scale status badge */}
        {isCalibrated && currentScale ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 gap-1">
            Page {currentPage}: {currentScale.toFixed(0)} px/m
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1">
            <AlertCircle className="h-3 w-3" />
            Page {currentPage}: Not calibrated
          </Badge>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="h-8 w-8 p-0"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={!canDelete}
          title="Delete selected"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          title="Zoom out"
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          title="Zoom in"
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFitToScreen}
          title="Fit to screen"
          className="h-8 w-8 p-0"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
