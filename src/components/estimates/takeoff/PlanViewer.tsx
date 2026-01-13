import { useState, useEffect, useRef, useCallback } from 'react';
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
  children,
}: PlanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
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
        className="aspect-[4/3] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
              {children}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
