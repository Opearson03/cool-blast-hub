import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus, Image, File, Download, Loader2, Trash2, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Document = Tables<"documents">;

interface JobDocumentsTabProps {
  jobId: string;
  businessId: string;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="w-8 h-8" />;
  if (fileType.startsWith("image/")) return <Image className="w-8 h-8 text-blue-500" />;
  if (fileType === "application/pdf") return <FileText className="w-8 h-8 text-red-500" />;
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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
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
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-documents", jobId] });
      toast.success("Document uploaded");
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 20MB)`);
          continue;
        }
        await uploadMutation.mutateAsync(file);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, "_blank");
  };

  const handleCardClick = (doc: Document) => {
    if (isPreviewable(doc.file_type)) {
      setPreviewDoc(doc);
    } else {
      // Non-previewable files just download
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

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Documents Yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload photos and documents for this job
            </p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
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
    </div>
  );
}
