import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Stage, Layer, Line, Rect, Circle, Group, Text } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Loader2, FileImage, AlertCircle } from 'lucide-react';
import { useTakeoffData } from '@/hooks/useTakeoffData';
import type { TakeoffMarkup, TakeoffPoint } from '@/types/takeoff';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PlanPreviewPanelProps {
  estimateId: string | null;
  businessId: string | null;
  activeScope?: string | null;
}

export function PlanPreviewPanel({
  estimateId,
  businessId,
  activeScope,
}: PlanPreviewPanelProps) {
  const {
    files,
    markups,
    currentFileId,
    isLoading,
    setCurrentFile,
  } = useTakeoffData({ estimateId, businessId });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });

  const currentFile = files.find(f => f.id === currentFileId);
  const currentMarkups = markups.filter(m => m.file_id === currentFileId && m.page_number === pageNumber);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height: height - 60 }); // Account for toolbar
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Load PDF
  useEffect(() => {
    if (!currentFile || currentFile.file_type !== 'pdf') {
      setPdfDoc(null);
      return;
    }

    let cancelled = false;
    const loadPdf = async () => {
      setIsPageLoading(true);
      try {
        const doc = await pdfjs.getDocument(currentFile.file_url).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setPageNumber(1);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [currentFile]);

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    const renderPage = async () => {
      setIsPageLoading(true);
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setDimensions({ width: viewport.width, height: viewport.height });

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    };

    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber]);

  // Handle image load
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setIsPageLoading(false);
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom with scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(z + delta, 0.25), 5));
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Calculate scale to fit container
  const scale = Math.min(
    containerSize.width / dimensions.width,
    containerSize.height / dimensions.height,
    1
  ) * zoom;

  // No files uploaded
  if (!isLoading && files.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <FileImage className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-medium">No plans uploaded</p>
        <p className="text-sm">Upload plans in the Takeoff step to see them here</p>
      </div>
    );
  }

  // Render markup shape
  const renderMarkup = (markup: TakeoffMarkup) => {
    const isActive = activeScope && markup.scope_id === activeScope;
    const strokeWidth = isActive ? 3 : 2;
    const opacity = isActive ? 1 : 0.6;
    const glowColor = isActive ? markup.color : undefined;

    if (markup.shape_type === 'polygon') {
      const points = markup.points.flatMap(p => [p.x, p.y]);
      return (
        <Group key={markup.id}>
          {/* Glow effect for active scope */}
          {isActive && (
            <Line
              points={points}
              closed
              stroke={glowColor}
              strokeWidth={8}
              opacity={0.3}
            />
          )}
          <Line
            points={points}
            closed
            stroke={markup.color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            fill={`${markup.color}20`}
          />
        </Group>
      );
    }

    if (markup.shape_type === 'rectangle' && markup.points.length === 2) {
      const [p1, p2] = markup.points;
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const w = Math.abs(p2.x - p1.x);
      const h = Math.abs(p2.y - p1.y);
      return (
        <Group key={markup.id}>
          {isActive && (
            <Rect
              x={x - 4}
              y={y - 4}
              width={w + 8}
              height={h + 8}
              stroke={glowColor}
              strokeWidth={6}
              opacity={0.3}
            />
          )}
          <Rect
            x={x}
            y={y}
            width={w}
            height={h}
            stroke={markup.color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            fill={`${markup.color}20`}
          />
        </Group>
      );
    }

    if (markup.shape_type === 'point') {
      const center = markup.points[0];
      if (!center) return null;
      return (
        <Group key={markup.id}>
          {isActive && (
            <Circle
              x={center.x}
              y={center.y}
              radius={14}
              stroke={glowColor}
              strokeWidth={4}
              opacity={0.4}
            />
          )}
          <Circle
            x={center.x}
            y={center.y}
            radius={10}
            fill={markup.color}
            stroke="#fff"
            strokeWidth={2}
            opacity={opacity}
          />
        </Group>
      );
    }

    if (markup.shape_type === 'polyline') {
      const points = markup.points.flatMap(p => [p.x, p.y]);
      return (
        <Group key={markup.id}>
          {isActive && (
            <Line
              points={points}
              stroke={glowColor}
              strokeWidth={8}
              opacity={0.3}
              lineCap="round"
              lineJoin="round"
            />
          )}
          <Line
            points={points}
            stroke={markup.color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            lineCap="round"
            lineJoin="round"
          />
        </Group>
      );
    }

    return null;
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-muted/10">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 border-b bg-background/80 backdrop-blur-sm">
        {/* File selector */}
        {files.length > 1 ? (
          <Select value={currentFileId || ''} onValueChange={setCurrentFile}>
            <SelectTrigger className="h-8 text-xs max-w-[180px]">
              <SelectValue placeholder="Select file" />
            </SelectTrigger>
            <SelectContent>
              {files.map(f => (
                <SelectItem key={f.id} value={f.id} className="text-xs">
                  {f.file_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : currentFile ? (
          <span className="text-xs font-medium truncate max-w-[180px]">{currentFile.file_name}</span>
        ) : null}

        {/* Page navigation for PDFs */}
        {currentFile?.file_type === 'pdf' && pdfDoc && pdfDoc.numPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs tabular-nums">{pageNumber}/{pdfDoc.numPages}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPageNumber(p => Math.min(pdfDoc.numPages, p + 1))}
              disabled={pageNumber >= pdfDoc.numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(z => Math.min(5, z + 0.25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={resetView}
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Viewer area */}
      <div
        className="flex-1 overflow-hidden relative flex items-center justify-center"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {(isLoading || isPageLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {currentFile && (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            className="relative"
          >
            {/* Plan image/canvas */}
            {currentFile.file_type === 'pdf' ? (
              <canvas ref={canvasRef} style={{ display: 'block' }} />
            ) : (
              <img
                src={currentFile.file_url}
                alt={currentFile.file_name}
                onLoad={handleImageLoad}
                style={{ display: 'block', maxWidth: 'none' }}
              />
            )}

            {/* Konva overlay for markups */}
            {dimensions.width > 0 && (
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{ width: dimensions.width, height: dimensions.height }}
              >
                <Stage width={dimensions.width} height={dimensions.height}>
                  <Layer>
                    {currentMarkups.map(renderMarkup)}
                  </Layer>
                </Stage>
              </div>
            )}
          </div>
        )}

        {/* Active scope indicator */}
        {activeScope && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
              Viewing: {activeScope.replace(/_/g, ' ')}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
