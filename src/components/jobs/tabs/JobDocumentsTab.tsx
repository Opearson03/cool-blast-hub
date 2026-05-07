import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Image, File, Download, Loader2, Trash2, ExternalLink, FolderOpen, Truck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { PendingDocumentsSheet } from "@/components/jobs/PendingDocumentsSheet";
import { SiteDiarySection } from "@/components/jobs/tabs/diary/SiteDiarySection";

type Document = Tables<"documents"> & { subfolder?: string };

interface JobDocumentsTabProps {
  jobId: string;
  businessId: string;
}

const FOLDER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'site_diary', label: 'Site Diary' },
  { value: 'delivery_dockets', label: 'Dockets' },
  { value: 'plans', label: 'Plans' },
  { value: 'quotes_retentions', label: 'Quotes' },
  { value: 'site_photos', label: 'Photos' },
  { value: 'general', label: 'Other' },
] as const;

const SUBFOLDER_OPTIONS = [
  { value: 'delivery_dockets', label: 'Delivery Dockets' },
  { value: 'plans', label: 'Plans' },
  { value: 'quotes_retentions', label: 'Quotes & Retentions' },
  { value: 'site_photos', label: 'Site Photos' },
  { value: 'general', label: 'Other' },
] as const;

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="w-8 h-8" />;
  if (fileType.startsWith("image/")) return <Image className="w-8 h-8 text-primary" />;
  if (fileType === "application/pdf") return <FileText className="w-8 h-8 text-destructive" />;
  return <File className="w-8 h-8" />;
}

function isPreviewable(fileType: string | null): boolean {
  if (!fileType) return false;
  return fileType.startsWith("image/") || fileType === "application/pdf";
}

export function JobDocumentsTab({ jobId, businessId }: JobDocumentsTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [uploadSubfolder, setUploadSubfolder] = useState<string>('general');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDocsSheetOpen, setPendingDocsSheetOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["job-documents", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("reference_id", jobId)
        .eq("category", "job")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  // Fetch job-matched pending documents (delivery dockets matched to this job)
  const { data: jobMatchedDockets = [] } = useQuery({
    queryKey: ["job-matched-documents", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_documents")
        .select("id, subject, from_email, received_at, extracted_data, match_status, match_confidence, file_url, file_name")
        .eq("linked_job_id", jobId)
        .eq("status", "pending")
        .in("match_status", ["job_matched", "auto_matched"])
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  // Filter documents based on active folder
  const filteredDocuments = activeFolder === 'all' 
    ? documents 
    : documents.filter(doc => (doc.subfolder || 'general') === activeFolder);

  // Count documents per folder
  const folderCounts = FOLDER_TABS.reduce((acc, tab) => {
    if (tab.value === 'all') {
      acc[tab.value] = documents.length;
    } else {
      acc[tab.value] = documents.filter(doc => (doc.subfolder || 'general') === tab.value).length;
    }
    return acc;
  }, {} as Record<string, number>);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, subfolder }: { file: File; subfolder: string }) => {
      const fileName = `${jobId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("documents").insert({
        business_id: businessId,
        file_name: file.name,
        file_type: file.type,
        file_url: urlData.publicUrl,
        category: "job",
        reference_id: jobId,
        subfolder: subfolder,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-documents", jobId] });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: Document) => {
      // Extract file path from URL
      const pathMatch = doc.file_url.match(/documents\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("documents").remove([pathMatch[1]]);
      }

      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-documents", jobId] });
      toast.success("Document deleted");
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 20MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setPendingFiles(validFiles);
      setShowUploadDialog(true);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmUpload = async () => {
    setUploading(true);
    try {
      for (const file of pendingFiles) {
        await uploadMutation.mutateAsync({ file, subfolder: uploadSubfolder });
      }
      toast.success(`${pendingFiles.length} file(s) uploaded to ${SUBFOLDER_OPTIONS.find(o => o.value === uploadSubfolder)?.label}`);
    } finally {
      setUploading(false);
      setShowUploadDialog(false);
      setPendingFiles([]);
      setUploadSubfolder('general');
    }
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, "_blank");
  };

  const handleCardClick = (doc: Document) => {
    if (isPreviewable(doc.file_type)) {
      setPreviewDoc(doc);
    } else {
      handleDownload(doc);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Documents & Photos</h3>
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Job-matched pending dockets awaiting pour assignment */}
      {jobMatchedDockets.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-medium text-sm">Incoming Delivery Dockets ({jobMatchedDockets.length})</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              These delivery dockets matched this job's address and need to be reviewed and filed.
            </p>
            <div className="space-y-2">
              {jobMatchedDockets.slice(0, 3).map((doc) => {
                const extracted = doc.extracted_data as any;
                return (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-md bg-background border cursor-pointer hover:bg-muted/50"
                    onClick={() => setPendingDocsSheetOpen(true)}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {extracted?.docket_number || doc.file_name || "Delivery Docket"}
                      </span>
                      {doc.match_status === 'auto_matched' && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                          Auto-matched
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                );
              })}
            </div>
            {jobMatchedDockets.length > 3 && (
              <Button 
                variant="link" 
                size="sm" 
                className="mt-2 p-0 h-auto"
                onClick={() => setPendingDocsSheetOpen(true)}
              >
                View all {jobMatchedDockets.length} pending dockets
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Folder tabs */}
      <Tabs value={activeFolder} onValueChange={setActiveFolder}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          {FOLDER_TABS.map(tab => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="text-xs px-2 py-1.5"
            >
              {tab.label}
              {folderCounts[tab.value] > 0 && (
                <span className="ml-1 text-muted-foreground">({folderCounts[tab.value]})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {activeFolder === 'all' ? 'No Documents Yet' : `No ${FOLDER_TABS.find(t => t.value === activeFolder)?.label}`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeFolder === 'all' 
                ? 'Upload photos and documents for this job'
                : 'No documents in this folder yet'}
            </p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className="hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => handleCardClick(doc)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getFileIcon(doc.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_at!), "d MMM yyyy")}
                    </p>
                    {doc.subfolder && doc.subfolder !== 'general' && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                        {SUBFOLDER_OPTIONS.find(o => o.value === doc.subfolder)?.label || doc.subfolder}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(doc);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload folder selection dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Choose Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Select which folder to save {pendingFiles.length} file(s) to:
            </p>
            <Select value={uploadSubfolder} onValueChange={setUploadSubfolder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBFOLDER_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowUploadDialog(false);
                setPendingFiles([]);
              }}>
                Cancel
              </Button>
              <Button onClick={handleConfirmUpload} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="truncate pr-4">
                {previewDoc?.file_name}
              </DialogTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewDoc && handleDownload(previewDoc)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-muted/30">
            {previewDoc?.file_type?.startsWith("image/") && (
              <div className="flex items-center justify-center p-4 min-h-[300px]">
                <img
                  src={previewDoc.file_url}
                  alt={previewDoc.file_name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            )}
            
            {previewDoc?.file_type === "application/pdf" && (
              <iframe
                src={previewDoc.file_url}
                className="w-full h-[75vh] border-0"
                title={previewDoc.file_name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending documents sheet */}
      <PendingDocumentsSheet
        open={pendingDocsSheetOpen}
        onOpenChange={setPendingDocsSheetOpen}
        businessId={businessId}
        preselectedJobId={jobId}
      />
    </div>
  );
}
