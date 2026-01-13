import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer2, 
  Ruler,
  Undo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DrawingTool } from '@/types/takeoff';

interface TakeoffToolbarProps {
  activeTool: DrawingTool['type'];
  onToolChange: (tool: DrawingTool['type']) => void;
  onCalibrate: () => void;
  onUndo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  canUndo: boolean;
  canDelete: boolean;
  isCalibrated: boolean;
  zoom: number;
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
  zoom
}: TakeoffToolbarProps) {
  const tools: { type: DrawingTool['type']; icon: React.ReactNode; label: string }[] = [
    { type: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Select' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg flex-wrap">
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

      {/* Calibration */}
      <Button
        variant={isCalibrated ? 'outline' : 'secondary'}
        size="sm"
        onClick={onCalibrate}
        className={cn(
          'gap-1.5 h-8',
          !isCalibrated && 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
        )}
      >
        <Ruler className="h-4 w-4" />
        {isCalibrated ? 'Recalibrate' : 'Calibrate Scale'}
      </Button>

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
