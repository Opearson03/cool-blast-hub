import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  FileText, 
  FlaskConical, 
  Truck, 
  Calendar, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
  ImageIcon
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface InboxItem {
  id: string;
  type: "plan" | "test" | "docket";
  from_email: string;
  from_name: string | null;
  subject: string | null;
  file_url: string | null;
  file_name: string | null;
  received_at: string;
  status: string;
  linked_id: string | null;
  email_body?: string | null;
}

interface InboxDetailSheetProps {
  item: InboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToLinked: (item: InboxItem) => void;
}

type FileType = 'pdf' | 'image' | 'other';

const getFileType = (fileName: string | null, fileUrl: string | null): FileType => {
  // Try to get extension from filename first
  let ext = '';
  if (fileName) {
    ext = fileName.toLowerCase().split('.').pop() || '';
  }
  
  // If no extension from filename, try from URL (without query params)
  if (!ext && fileUrl) {
    const urlPath = fileUrl.split('?')[0];
    ext = urlPath.toLowerCase().split('.').pop() || '';
  }
  
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  return 'other';
};

export function InboxDetailSheet({ item, open, onOpenChange, onNavigateToLinked }: InboxDetailSheetProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch signed URL when sheet opens
  useEffect(() => {
    if (open && item) {
      fetchSignedUrl();
    } else {
      // Reset state when closed
      setSignedUrl(null);
      setError(null);
      setCurrentPage(1);
      setTotalPages(1);
      setPdfDoc(null);
    }
  }, [open, item?.id]);

  // Render PDF page when document or page changes
  useEffect(() => {
    if (pdfDoc && canvasRef.current && containerRef.current) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage]);

  const fetchSignedUrl = async () => {
    if (!item || !item.file_url) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let url = item.file_url;
      
      // Check if file_url is already a full URL (public or signed)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // It's already a full URL, use it directly
        setSignedUrl(url);
        
        // If PDF, load the document
        if (getFileType(item.file_name, item.file_url) === 'pdf') {
          await loadPdf(url);
        }
      } else {
        // It's a storage path, generate a signed URL
        // Try to determine the bucket from the path
        let bucket = "inbox-documents";
        let filePath = url;
        
        // Check if path contains a bucket prefix
        if (url.includes("/")) {
          const parts = url.split("/");
          // Common bucket names to check
          const knownBuckets = ["inbox-documents", "test-documents", "documents"];
          if (knownBuckets.includes(parts[0])) {
            bucket = parts[0];
            filePath = parts.slice(1).join("/");
          }
        }
        
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600);
        
        if (signError) throw signError;
        if (!data?.signedUrl) throw new Error("Failed to generate URL");
        
        setSignedUrl(data.signedUrl);
        
        // If PDF, load the document
        if (getFileType(item.file_name, item.file_url) === 'pdf') {
          await loadPdf(data.signedUrl);
        }
      }
    } catch (err) {
      console.error("Error fetching signed URL:", err);
      setError("Failed to load attachment");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPdf = async (url: string) => {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Failed to load PDF document");
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Calculate scale to fit container width
      const containerWidth = containerRef.current.clientWidth;
      const viewport = page.getViewport({ scale: 1 });
      const scale = (containerWidth - 16) / viewport.width; // 16px padding
      const scaledViewport = page.getViewport({ scale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;
    } catch (err) {
      console.error("Error rendering page:", err);
    }
  };

  const handleOpenInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "plan":
        return <FileText className="h-4 w-4 text-primary" />;
      case "test":
        return <FlaskConical className="h-4 w-4 text-secondary-foreground" />;
      case "docket":
        return <Truck className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "plan": return "Plan";
      case "test": return "Test Result";
      case "docket": return "Docket";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-primary/10 text-primary">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive">Rejected</Badge>;
      case "converted":
        return <Badge variant="outline" className="bg-accent text-accent-foreground">Converted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!item) return null;

  const fileType = getFileType(item.file_name, item.file_url);
  const hasAttachment = !!item.file_url;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-left pr-8">
            {item.subject || item.file_name || "No subject"}
          </SheetTitle>
          
          {/* From & Date */}
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              From: <span className="text-foreground">{item.from_name || item.from_email}</span>
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(item.received_at), "dd MMM yyyy 'at' h:mm a")}
            </div>
          </div>

          {/* Type & Status Badges */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {getTypeIcon(item.type)}
              {getTypeLabel(item.type)}
            </Badge>
            {getStatusBadge(item.status)}
          </div>
        </SheetHeader>

        {/* Email Body Content */}
        {item.email_body && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {item.email_body}
            </p>
          </div>
        )}

        {/* Document Viewer */}
        {hasAttachment ? (
          <div className="mt-6 space-y-4">
            <div 
              ref={containerRef}
              className="border rounded-lg bg-muted/30 min-h-[300px] flex items-center justify-center overflow-hidden"
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Loading attachment...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-2 text-destructive">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchSignedUrl}>
                    Retry
                  </Button>
                </div>
              ) : fileType === 'pdf' && pdfDoc ? (
                <canvas ref={canvasRef} className="max-w-full" />
              ) : fileType === 'image' && signedUrl ? (
                <img 
                  src={signedUrl} 
                  alt={item.file_name || "Attachment"}
                  className="max-w-full max-h-[500px] object-contain"
                />
              ) : fileType === 'other' && signedUrl ? (
                <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                  <p className="text-sm text-center">
                    Preview not available for this file type
                  </p>
                </div>
              ) : null}
            </div>

            {/* PDF Page Navigation */}
            {fileType === 'pdf' && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* File Info */}
            {item.file_name && (
              <div className="text-sm text-muted-foreground">
                <p>Filename: {item.file_name}</p>
              </div>
            )}

            {/* Open in New Tab */}
            <Button
              variant="outline"
              onClick={handleOpenInNewTab}
              disabled={!signedUrl}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        ) : (
          <div className="mt-6 p-6 border rounded-lg bg-muted/30 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No attachment</p>
          </div>
        )}

        {/* Navigate to linked item */}
        {item.linked_id && (
          <div className="mt-4">
            <Button
              variant="default"
              onClick={() => onNavigateToLinked(item)}
              className="w-full"
            >
              Go to {item.type === "plan" ? "Quote" : "Job"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
