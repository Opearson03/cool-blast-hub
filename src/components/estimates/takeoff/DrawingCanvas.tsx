import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Group, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { TakeoffMarkup, TakeoffPoint } from '@/types/takeoff';

interface DrawingCanvasProps {
  width: number;
  height: number;
  tool: 'polygon' | 'rectangle' | 'select' | 'pan' | 'calibrate' | 'point' | 'polyline';
  activeScope: string | null;
  activeScopeColor: string;
  markups: TakeoffMarkup[];
  selectedMarkupId: string | null;
  isCalibrated: boolean;
  pixelsPerMeter: number | null;
  isCalibrationMode?: boolean;
  calibrationPoints?: TakeoffPoint[];
  pierPoints?: TakeoffPoint[];
  polylinePoints?: TakeoffPoint[];
  onMarkupComplete: (points: TakeoffPoint[], shapeType: 'polygon' | 'rectangle') => void;
  onPolylineComplete?: (points: TakeoffPoint[], lengthMeters: number) => void;
  onMarkupSelect: (id: string | null) => void;
  onMarkupUpdate: (id: string, points: TakeoffPoint[]) => void;
  onPointsChange?: (points: TakeoffPoint[]) => void;
  onCalibrationPointsChange?: (points: TakeoffPoint[]) => void;
  onPierPointsChange?: (points: TakeoffPoint[]) => void;
  onPolylinePointsChange?: (points: TakeoffPoint[]) => void;
}

export function DrawingCanvas({
  width,
  height,
  tool,
  activeScope,
  activeScopeColor,
  markups,
  selectedMarkupId,
  isCalibrated,
  pixelsPerMeter,
  isCalibrationMode,
  calibrationPoints = [],
  pierPoints = [],
  polylinePoints = [],
  onMarkupComplete,
  onPolylineComplete,
  onMarkupSelect,
  onMarkupUpdate,
  onPointsChange,
  onCalibrationPointsChange,
  onPierPointsChange,
  onPolylinePointsChange,
}: DrawingCanvasProps) {
  const [drawingPoints, setDrawingPoints] = useState<TakeoffPoint[]>([]);
  const [rectStart, setRectStart] = useState<TakeoffPoint | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<TakeoffPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<any>(null);

  // Clear stale drawing state when activeScope changes to null or dimensions change significantly
  useEffect(() => {
    if (activeScope === null) {
      setDrawingPoints([]);
      setRectStart(null);
      setCurrentMousePos(null);
      onPointsChange?.([]);
    }
  }, [activeScope, onPointsChange]);

  // Reset state when dimensions change (e.g., on reopen)
  useEffect(() => {
    setDrawingPoints([]);
    setRectStart(null);
    setCurrentMousePos(null);
  }, [width, height]);

  const isDrawing = tool === 'polygon' || tool === 'rectangle' || tool === 'point' || tool === 'polyline';

  // Calculate centroid of a polygon for label positioning
  const getCentroid = (points: TakeoffPoint[]): TakeoffPoint => {
    if (points.length === 0) return { x: 0, y: 0 };
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  // Get rectangle center
  const getRectCenter = (points: TakeoffPoint[]): TakeoffPoint => {
    if (points.length !== 2) return { x: 0, y: 0 };
    return {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2,
    };
  };

  // Format area for display
  const formatArea = (area: number | null): string => {
    if (area === null) return '';
    return `${area.toFixed(1)} m²`;
  };

  // Handle stage click
  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const point: TakeoffPoint = { x: pos.x, y: pos.y };

    // Handle calibration mode clicks
    if (isCalibrationMode && calibrationPoints.length < 2) {
      const newPoints = [...calibrationPoints, point];
      onCalibrationPointsChange?.(newPoints);
      return;
    }

    // Handle pier/bollard point tool
    if (tool === 'point' && activeScope) {
      const newPierPoints = [...pierPoints, point];
      onPierPointsChange?.(newPierPoints);
      return;
    }

    // Handle polyline tool for linear elements
    if (tool === 'polyline' && activeScope) {
      const newPolylinePoints = [...polylinePoints, point];
      onPolylinePointsChange?.(newPolylinePoints);
      return;
    }

    if (tool === 'select') {
      // Clicking on stage background deselects
      if (e.target === stage) {
        onMarkupSelect(null);
      }
      return;
    }

    if (tool === 'polygon' && activeScope) {
      // Check if clicking near first point to close polygon
      if (drawingPoints.length >= 3) {
        const firstPoint = drawingPoints[0];
        const distance = Math.sqrt(
          Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2)
        );
        
        if (distance < 15) {
          // Close polygon
          onMarkupComplete(drawingPoints, 'polygon');
          setDrawingPoints([]);
          onPointsChange?.([]);
          return;
        }
      }

      // Add point
      const newPoints = [...drawingPoints, point];
      setDrawingPoints(newPoints);
      onPointsChange?.(newPoints);
    }
  }, [tool, activeScope, drawingPoints, onMarkupComplete, onMarkupSelect, onPointsChange, isCalibrationMode, calibrationPoints, onCalibrationPointsChange, pierPoints, onPierPointsChange]);

  // Handle double click to close polygon
  const handleDoubleClick = useCallback(() => {
    if (tool === 'polygon' && drawingPoints.length >= 3) {
      onMarkupComplete(drawingPoints, 'polygon');
      setDrawingPoints([]);
      onPointsChange?.([]);
    }
  }, [tool, drawingPoints, onMarkupComplete, onPointsChange]);

  // Handle mouse down for rectangle drawing
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (tool !== 'rectangle' || !activeScope) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    setRectStart({ x: pos.x, y: pos.y });
  }, [tool, activeScope]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    setCurrentMousePos({ x: pos.x, y: pos.y });
  }, []);

  // Handle mouse up for rectangle drawing
  const handleMouseUp = useCallback(() => {
    if (tool === 'rectangle' && rectStart && currentMousePos) {
      const minX = Math.min(rectStart.x, currentMousePos.x);
      const minY = Math.min(rectStart.y, currentMousePos.y);
      const maxX = Math.max(rectStart.x, currentMousePos.x);
      const maxY = Math.max(rectStart.y, currentMousePos.y);

      const width = maxX - minX;
      const height = maxY - minY;

      // Only create if rectangle is large enough
      if (width > 10 && height > 10) {
        const points: TakeoffPoint[] = [
          { x: minX, y: minY },
          { x: maxX, y: maxY },
        ];
        onMarkupComplete(points, 'rectangle');
      }

      setRectStart(null);
    }
  }, [tool, rectStart, currentMousePos, onMarkupComplete]);

  // Undo last point
  const handleUndo = useCallback(() => {
    if (drawingPoints.length > 0) {
      const newPoints = drawingPoints.slice(0, -1);
      setDrawingPoints(newPoints);
      onPointsChange?.(newPoints);
    }
  }, [drawingPoints, onPointsChange]);

  // Get cursor style
  const getCursor = (): string => {
    if (isCalibrationMode) return 'crosshair';
    if (tool === 'pan') return 'grab';
    if (tool === 'select') return 'pointer';
    if (isDrawing) return 'crosshair';
    return 'default';
  };

  // Render calibration points and line
  const renderCalibrationOverlay = () => {
    if (!isCalibrationMode && calibrationPoints.length === 0) return null;

    return (
      <Group>
        {/* Line between calibration points */}
        {calibrationPoints.length === 2 && (
          <Line
            points={flattenPoints(calibrationPoints)}
            stroke="#f97316"
            strokeWidth={3}
            dash={[8, 4]}
          />
        )}
        {/* Preview line to mouse */}
        {calibrationPoints.length === 1 && currentMousePos && (
          <Line
            points={[calibrationPoints[0].x, calibrationPoints[0].y, currentMousePos.x, currentMousePos.y]}
            stroke="#f97316"
            strokeWidth={2}
            dash={[5, 5]}
            opacity={0.7}
          />
        )}
        {/* Calibration points */}
        {calibrationPoints.map((point, index) => (
          <Group key={index}>
            <Circle
              x={point.x}
              y={point.y}
              radius={8}
              fill="#f97316"
              stroke="#fff"
              strokeWidth={2}
            />
            <Text
              x={point.x + 12}
              y={point.y - 8}
              text={`Point ${index + 1}`}
              fontSize={12}
              fontStyle="bold"
              fill="#f97316"
              stroke="#fff"
              strokeWidth={0.5}
            />
          </Group>
        ))}
      </Group>
    );
  };

  // Render pier point markers
  const renderPierPoints = () => {
    if (tool !== 'point' || pierPoints.length === 0) return null;

    return (
      <Group>
        {pierPoints.map((point, index) => (
          <Group key={index}>
            <Circle
              x={point.x}
              y={point.y}
              radius={12}
              fill={activeScopeColor}
              stroke="#fff"
              strokeWidth={2}
              opacity={0.9}
            />
            <Text
              x={point.x}
              y={point.y}
              text={String(index + 1)}
              fontSize={10}
              fontStyle="bold"
              fill="#fff"
              offsetX={index < 9 ? 3 : 6}
              offsetY={5}
            />
          </Group>
        ))}
      </Group>
    );
  };

  // Render polyline for linear elements
  const renderPolylinePreview = () => {
    if (tool !== 'polyline' || polylinePoints.length === 0) return null;

    const points = currentMousePos 
      ? [...polylinePoints, currentMousePos]
      : polylinePoints;

    return (
      <Group>
        {/* Polyline path */}
        <Line
          points={flattenPoints(points)}
          stroke={activeScopeColor}
          strokeWidth={3}
          dash={[10, 5]}
          lineCap="round"
          lineJoin="round"
        />
        {/* Vertex points */}
        {polylinePoints.map((point, index) => (
          <Circle
            key={index}
            x={point.x}
            y={point.y}
            radius={6}
            fill={index === 0 ? activeScopeColor : 'white'}
            stroke={activeScopeColor}
            strokeWidth={2}
          />
        ))}
      </Group>
    );
  };

  // Flatten points for Konva Line
  const flattenPoints = (points: TakeoffPoint[]): number[] => {
    return points.flatMap(p => [p.x, p.y]);
  };

  // Render preview of current drawing
  const renderDrawingPreview = () => {
    if (tool === 'polygon' && drawingPoints.length > 0) {
      const points = currentMousePos 
        ? [...drawingPoints, currentMousePos]
        : drawingPoints;

      return (
        <Group>
          {/* Preview line */}
          <Line
            points={flattenPoints(points)}
            stroke={activeScopeColor}
            strokeWidth={2}
            dash={[5, 5]}
            closed={false}
          />
          {/* Points */}
          {drawingPoints.map((point, index) => (
            <Circle
              key={index}
              x={point.x}
              y={point.y}
              radius={index === 0 && drawingPoints.length >= 3 ? 8 : 5}
              fill={index === 0 ? activeScopeColor : 'white'}
              stroke={activeScopeColor}
              strokeWidth={2}
            />
          ))}
        </Group>
      );
    }

    if (tool === 'rectangle' && rectStart && currentMousePos) {
      const x = Math.min(rectStart.x, currentMousePos.x);
      const y = Math.min(rectStart.y, currentMousePos.y);
      const w = Math.abs(currentMousePos.x - rectStart.x);
      const h = Math.abs(currentMousePos.y - rectStart.y);

      return (
        <Rect
          x={x}
          y={y}
          width={w}
          height={h}
          stroke={activeScopeColor}
          strokeWidth={2}
          dash={[5, 5]}
          fill={`${activeScopeColor}33`}
        />
      );
    }

    return null;
  };

  // Render existing markups
  const renderMarkups = () => {
    return markups.map((markup) => {
      const isSelected = markup.id === selectedMarkupId;
      const fillOpacity = isSelected ? 0.4 : 0.25;
      const strokeWidth = isSelected ? 3 : 2;

      if (markup.shape_type === 'polygon') {
        const centroid = getCentroid(markup.points);
        
        return (
          <Group key={markup.id}>
            <Line
              points={flattenPoints(markup.points)}
              stroke={markup.color}
              strokeWidth={strokeWidth}
              fill={`${markup.color}${Math.round(fillOpacity * 255).toString(16).padStart(2, '0')}`}
              closed={true}
              onClick={() => tool === 'select' && onMarkupSelect(markup.id)}
              onTap={() => tool === 'select' && onMarkupSelect(markup.id)}
            />
            {markup.area_sqm && (
              <Text
                x={centroid.x}
                y={centroid.y}
                text={formatArea(markup.area_sqm)}
                fontSize={14}
                fontStyle="bold"
                fill="#fff"
                stroke="#000"
                strokeWidth={0.5}
                offsetX={25}
                offsetY={7}
              />
            )}
            {isSelected && markup.points.map((point, index) => (
              <Circle
                key={index}
                x={point.x}
                y={point.y}
                radius={6}
                fill="white"
                stroke={markup.color}
                strokeWidth={2}
              />
            ))}
          </Group>
        );
      }

      if (markup.shape_type === 'rectangle' && markup.points.length === 2) {
        const [p1, p2] = markup.points;
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        const center = getRectCenter(markup.points);

        return (
          <Group key={markup.id}>
            <Rect
              x={x}
              y={y}
              width={w}
              height={h}
              stroke={markup.color}
              strokeWidth={strokeWidth}
              fill={`${markup.color}${Math.round(fillOpacity * 255).toString(16).padStart(2, '0')}`}
              onClick={() => tool === 'select' && onMarkupSelect(markup.id)}
              onTap={() => tool === 'select' && onMarkupSelect(markup.id)}
            />
            {markup.area_sqm && (
              <Text
                x={center.x}
                y={center.y}
                text={formatArea(markup.area_sqm)}
                fontSize={14}
                fontStyle="bold"
                fill="#fff"
                stroke="#000"
                strokeWidth={0.5}
                offsetX={25}
                offsetY={7}
              />
            )}
            {isSelected && (
              <>
                <Circle x={x} y={y} radius={6} fill="white" stroke={markup.color} strokeWidth={2} />
                <Circle x={x + w} y={y} radius={6} fill="white" stroke={markup.color} strokeWidth={2} />
                <Circle x={x} y={y + h} radius={6} fill="white" stroke={markup.color} strokeWidth={2} />
                <Circle x={x + w} y={y + h} radius={6} fill="white" stroke={markup.color} strokeWidth={2} />
              </>
            )}
          </Group>
        );
      }

      // Handle point markups (piers/bollards/pads)
      if (markup.shape_type === 'point' && markup.points.length > 0) {
        return (
          <Group key={markup.id}>
            {markup.points.map((point, index) => (
              <Group key={index}>
                <Circle
                  x={point.x}
                  y={point.y}
                  radius={isSelected ? 14 : 12}
                  fill={markup.color}
                  stroke={isSelected ? '#fff' : '#000'}
                  strokeWidth={isSelected ? 3 : 1}
                  opacity={0.85}
                  onClick={() => tool === 'select' && onMarkupSelect(markup.id)}
                  onTap={() => tool === 'select' && onMarkupSelect(markup.id)}
                />
                <Text
                  x={point.x}
                  y={point.y}
                  text={String(index + 1)}
                  fontSize={10}
                  fontStyle="bold"
                  fill="#fff"
                  offsetX={index < 9 ? 3 : 6}
                  offsetY={5}
                />
              </Group>
            ))}
          </Group>
        );
      }

      // Handle polyline markups (linear elements like footings, kerbs)
      if (markup.shape_type === 'polyline' && markup.points.length > 1) {
        // Get midpoint for label
        const midIndex = Math.floor(markup.points.length / 2);
        const midPoint = markup.points[midIndex] || markup.points[0];
        
        return (
          <Group key={markup.id}>
            <Line
              points={flattenPoints(markup.points)}
              stroke={markup.color}
              strokeWidth={isSelected ? 5 : 4}
              lineCap="round"
              lineJoin="round"
              onClick={() => tool === 'select' && onMarkupSelect(markup.id)}
              onTap={() => tool === 'select' && onMarkupSelect(markup.id)}
            />
            {markup.length_m && (
              <Text
                x={midPoint.x}
                y={midPoint.y - 15}
                text={`${markup.length_m.toFixed(1)}m`}
                fontSize={14}
                fontStyle="bold"
                fill="#fff"
                stroke="#000"
                strokeWidth={0.5}
                offsetX={20}
              />
            )}
            {isSelected && markup.points.map((point, index) => (
              <Circle
                key={index}
                x={point.x}
                y={point.y}
                radius={6}
                fill="white"
                stroke={markup.color}
                strokeWidth={2}
              />
            ))}
          </Group>
        );
      }

      return null;
    });
  };

  if (width === 0 || height === 0) return null;

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      style={{ cursor: getCursor() }}
      onClick={handleStageClick}
      onDblClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Layer>
        {renderMarkups()}
        {renderDrawingPreview()}
        {renderPierPoints()}
        {renderPolylinePreview()}
        {renderCalibrationOverlay()}
      </Layer>
    </Stage>
  );
}
