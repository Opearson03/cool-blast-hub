import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Image, File, Download } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Document = Tables<"documents">;

interface JobDocumentsTabProps {
  jobId: string;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="w-8 h-8" />;
  if (fileType.startsWith("image/")) return <Image className="w-8 h-8 text-blue-500" />;
  if (fileType === "application/pdf") return <FileText className="w-8 h-8 text-red-500" />;
  return <File className="w-8 h-8" />;
}

export function JobDocumentsTab({ jobId }: JobDocumentsTabProps) {
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

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Documents Yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload photos and documents for this job
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Documents & Photos</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getFileIcon(doc.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(doc.created_at!), "d MMM yyyy")}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
