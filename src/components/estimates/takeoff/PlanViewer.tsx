import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PlanViewerProps {
  planUrl: string;
  planType: 'pdf' | 'image';
  pageNumber: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onPagesLoaded?: (count: number) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  onZoomChange?: (zoom: number) => void;
  children?: React.ReactNode;
}

export function PlanViewer({
  planUrl,
  planType,
  pageNumber,
  totalPages,
  zoom,
  onPageChange,
  onPagesLoaded,
  onDimensionsChange,
  onZoomChange,
  children,
}: PlanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  
  // Pan state - now controlled by parent when drawing is active
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Pinch-to-zoom state
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number>(1);
  const [pinchCenter, setPinchCenter] = useState<{ x: number; y: number } | null>(null);

  // Load PDF document
  useEffect(() => {
    if (planType !== 'pdf') return;

    let cancelled = false;
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const doc = await pdfjs.getDocument(planUrl).promise;
        if (cancelled) return;
        
        setPdfDoc(doc);
        onPagesLoaded?.(doc.numPages);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error loading PDF:', err);
          setError(err.message || 'Failed to load PDF');
        }
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [planUrl, planType, onPagesLoaded]);

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    const renderPage = async () => {
      setIsLoading(true);
      
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        // Set canvas dimensions to natural size
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        setNaturalDimensions({ width: viewport.width, height: viewport.height });
        onDimensionsChange?.({ width: viewport.width, height: viewport.height });

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
        
        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error rendering PDF page:', err);
          setError(err.message || 'Failed to render page');
          setIsLoading(false);
        }
      }
    };

    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber, onDimensionsChange]);

  // Handle image loading
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    onDimensionsChange?.({ width: img.naturalWidth, height: img.naturalHeight });
    setIsLoading(false);
  }, [onDimensionsChange]);

  // Pan handlers with drag detection (5px threshold)
  const DRAG_THRESHOLD = 5;
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartPos) return;
    
    // Check if we've moved past the drag threshold
    const dx = Math.abs(e.clientX - dragStartPos.x);
    const dy = Math.abs(e.clientY - dragStartPos.y);
    
    if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
      setIsDragging(true);
      setIsPanning(true);
    }
    
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDragStartPos(null);
    setIsDragging(false);
    setIsPanning(false);
  };

  // Helper to calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Helper to get center point between two touches
  const getTouchCenter = (touches: React.TouchList, rect: DOMRect): { x: number; y: number } => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left - rect.width / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top - rect.height / 2,
    };
  };

  // Touch event handlers for mobile/tablet panning and pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    // Pinch-to-zoom: two fingers
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent browser zoom
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      setInitialPinchDistance(getTouchDistance(e.touches));
      setInitialPinchZoom(zoom);
      setPinchCenter(getTouchCenter(e.touches, rect));
      // Clear single-finger pan state
      setDragStartPos(null);
      setIsDragging(false);
      setIsPanning(false);
      return;
    }
    
    // Single finger: panning
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setDragStartPos({ x: touch.clientX, y: touch.clientY });
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      // Clear pinch state
      setInitialPinchDistance(null);
      setPinchCenter(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Pinch-to-zoom handling
    if (e.touches.length === 2 && initialPinchDistance !== null && pinchCenter !== null) {
      e.preventDefault(); // Prevent browser zoom
      const container = containerRef.current;
      if (!container) return;
      
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.min(Math.max(initialPinchZoom * scale, 0.25), 5);
      
      // Zoom toward the pinch center
      const zoomRatio = newZoom / zoom;
      const newPanX = pinchCenter.x - (pinchCenter.x - panOffset.x) * zoomRatio;
      const newPanY = pinchCenter.y - (pinchCenter.y - panOffset.y) * zoomRatio;
      
      setPanOffset({ x: newPanX, y: newPanY });
      onZoomChange?.(newZoom);
      return;
    }
    
    // Single finger panning
    if (e.touches.length !== 1 || !dragStartPos) return;
    const touch = e.touches[0];

    const dx = Math.abs(touch.clientX - dragStartPos.x);
    const dy = Math.abs(touch.clientY - dragStartPos.y);

    if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
      setIsDragging(true);
      setIsPanning(true);
    }

    if (isPanning) {
      e.preventDefault(); // Prevent page scroll during pan
      setPanOffset({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setDragStartPos(null);
    setIsDragging(false);
    setIsPanning(false);
    setInitialPinchDistance(null);
    setPinchCenter(null);
  };

  // Scroll wheel zoom handler - requires Shift key, zooms toward cursor
  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom when Shift is held
    if (!e.shiftKey) return;
    
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    // Mouse position relative to container center
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const zoomFactor = 0.15;
    const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
    const newZoom = Math.min(Math.max(zoom + delta, 0.25), 5);
    const zoomRatio = newZoom / zoom;

    // Adjust pan offset so the point under the cursor stays fixed
    const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
    const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;

    setPanOffset({ x: newPanX, y: newPanY });
    onZoomChange?.(newZoom);
  };

  // Reset pan when zoom changes
  useEffect(() => {
    if (zoom === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  const displayWidth = naturalDimensions.width * zoom;
  const displayHeight = naturalDimensions.height * zoom;

  return (
    <Card className="relative overflow-hidden bg-muted/30">
      {/* Page navigation for PDFs */}
      {planType === 'pdf' && totalPages > 1 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium">
            {pageNumber} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onPageChange(Math.min(totalPages, pageNumber + 1))}
            disabled={pageNumber >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main viewer container */}
      <div
        ref={containerRef}
        className="aspect-[4/3] flex items-center justify-center overflow-hidden relative"
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Plan content with transform */}
        <div
          className="relative"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {planType === 'pdf' ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
              style={{ display: isLoading && !naturalDimensions.width ? 'none' : 'block' }}
            />
          ) : (
            <img
              src={planUrl}
              alt="Building plan"
              className="max-w-full max-h-full"
              onLoad={handleImageLoad}
              onError={() => {
                setError('Failed to load image');
                setIsLoading(false);
              }}
              style={{ display: isLoading ? 'none' : 'block' }}
            />
          )}

          {/* Overlay for drawing canvas - positioned over the plan */}
          {naturalDimensions.width > 0 && children && (
            <div
              className="absolute top-0 left-0 pointer-events-auto"
              style={{
                width: naturalDimensions.width,
                height: naturalDimensions.height,
              }}
            >
              {React.isValidElement(children) 
                ? React.cloneElement(children as React.ReactElement<any>, { isPanning: isDragging })
                : children}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
