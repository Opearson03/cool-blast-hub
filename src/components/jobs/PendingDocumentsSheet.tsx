import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Truck,
  Building2,
  FolderOpen
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PendingDocumentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  preselectedJobId?: string;
}

interface PendingDocument {
  id: string;
  business_id: string;
  from_email: string;
  subject: string | null;
  received_at: string;
  file_url: string;
  file_name: string;
  extracted_data: {
    docket_number?: string | null;
    volume_m3?: number | null;
    supplier?: string | null;
    delivery_date?: string | null;
    mix_code?: string | null;
    truck_rego?: string | null;
    site_address?: string | null;
    note?: string;
  };
  document_type: string;
  status: 'pending' | 'approved' | 'rejected';
  linked_job_id: string | null;
  linked_pour_id: string | null;
  created_at: string;
}

interface Job {
  id: string;
  name: string;
  job_number: string | null;
}

interface Pour {
  id: string;
  pour_name: string;
}

const SUBFOLDER_OPTIONS = [
  { value: 'delivery_dockets', label: 'Delivery Dockets' },
  { value: 'plans', label: 'Plans' },
  { value: 'quotes_retentions', label: 'Quotes & Retentions' },
  { value: 'site_photos', label: 'Site Photos' },
  { value: 'general', label: 'Other' },
] as const;

export function PendingDocumentsSheet({
  open,
  onOpenChange,
  businessId,
  preselectedJobId
}: PendingDocumentsSheetProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(preselectedJobId || null);
  const [selectedPourId, setSelectedPourId] = useState<string | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>('delivery_dockets');
  const [rejectionReason, setRejectionReason] = useState("");
  const queryClient = useQueryClient();

  // Fetch pending documents
  const { data: pendingDocs = [], isLoading } = useQuery({
    queryKey: ["pending-documents", businessId, preselectedJobId],
    queryFn: async () => {
      let query = supabase
        .from("pending_documents")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .order("received_at", { ascending: false });
      
      if (preselectedJobId) {
        query = supabase
          .from("pending_documents")
          .select("*")
          .eq("business_id", businessId)
          .eq("status", "pending")
          .or(`match_status.eq.pending,linked_job_id.eq.${preselectedJobId}`)
          .order("received_at", { ascending: false });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PendingDocument[];
    },
    enabled: open
  });

  // Update selectedJobId when a pre-matched document is selected
  useEffect(() => {
    if (selectedDocId) {
      const doc = pendingDocs.find(d => d.id === selectedDocId);
      if (doc?.linked_job_id && !selectedJobId) {
        setSelectedJobId(doc.linked_job_id);
      }
      if (doc?.linked_pour_id && !selectedPourId) {
        setSelectedPourId(doc.linked_pour_id);
      }
    }
  }, [selectedDocId, pendingDocs]);

  // Fetch jobs for linking
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-for-linking", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, name, job_number")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Job[];
    },
    enabled: open
  });

  // Fetch pours for selected job
  const { data: pours = [] } = useQuery({
    queryKey: ["pours-for-job", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      
      const { data, error } = await supabase
        .from("job_pours")
        .select("id, pour_name")
        .eq("job_id", selectedJobId);
      
      if (error) throw error;
      return data as Pour[];
    },
    enabled: !!selectedJobId
  });

  // Approve mutation - moves document to documents table and saves docket number to pour
  const approveMutation = useMutation({
    mutationFn: async (doc: PendingDocument) => {
      if (!selectedJobId) throw new Error("Please select a job");

      // Insert into documents table
      const { error: docError } = await supabase
        .from("documents")
        .insert({
          business_id: businessId,
          file_name: doc.file_name,
          file_url: doc.file_url,
          file_type: 'application/pdf',
          category: 'job',
          reference_id: selectedJobId,
          subfolder: selectedSubfolder
        });

      if (docError) throw docError;

      // If linked to a pour and we have a docket number, save it to the pour for future matching
      if (selectedPourId && doc.extracted_data.docket_number) {
        // Fetch current docket_numbers array
        const { data: currentPour, error: fetchError } = await supabase
          .from("job_pours")
          .select("docket_numbers, batch_ticket_refs")
          .eq("id", selectedPourId)
          .single();

        if (!fetchError && currentPour) {
          const currentDockets = currentPour.docket_numbers || [];
          const docketNum = doc.extracted_data.docket_number;
          
          // Only add if not already present
          if (!currentDockets.includes(docketNum)) {
            const { error: updatePourError } = await supabase
              .from("job_pours")
              .update({
                docket_numbers: [...currentDockets, docketNum]
              })
              .eq("id", selectedPourId);

            if (updatePourError) {
              console.warn('Failed to save docket number to pour:', updatePourError);
            } else {
              console.log('Saved docket number to pour:', docketNum);
            }
          }
        }
      }

      // Update pending document status
      const { error: updateError } = await supabase
        .from("pending_documents")
        .update({
          status: "approved",
          linked_job_id: selectedJobId,
          linked_pour_id: selectedPourId,
          approved_at: new Date().toISOString()
        })
        .eq("id", doc.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Document approved and filed");
      queryClient.invalidateQueries({ queryKey: ["pending-documents"] });
      queryClient.invalidateQueries({ queryKey: ["job-documents"] });
      queryClient.invalidateQueries({ queryKey: ["job-pours"] }); // Refresh pour data
      setSelectedDocId(null);
      setSelectedJobId(preselectedJobId || null);
      setSelectedPourId(null);
      setSelectedSubfolder('delivery_dockets');
    },
    onError: (error) => {
      toast.error("Failed to approve: " + error.message);
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("pending_documents")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null
        })
        .eq("id", docId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-documents"] });
      setSelectedDocId(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error("Failed to reject: " + error.message);
    }
  });

  const selectedDoc = pendingDocs.find(d => d.id === selectedDocId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Pending Delivery Dockets
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingDocs.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No pending dockets</h3>
              <p className="text-sm text-muted-foreground">
                Delivery dockets emailed to your business address will appear here
              </p>
            </div>
          ) : selectedDoc ? (
            // Detail view
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocId(null)}
              >
                ← Back to list
              </Button>

              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{selectedDoc.subject || "(No subject)"}</p>
                      <p className="text-sm text-muted-foreground">{selectedDoc.from_email}</p>
                    </div>
                    <Badge variant="secondary">
                      {format(new Date(selectedDoc.received_at), "d MMM HH:mm")}
                    </Badge>
                  </div>

                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href={selectedDoc.file_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      View Document
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Extracted Data
                    </h4>
                    
                    {selectedDoc.extracted_data.note ? (
                      <p className="text-sm text-muted-foreground italic">
                        {selectedDoc.extracted_data.note}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Docket #:</span>
                          <p className="font-medium">{selectedDoc.extracted_data.docket_number || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Volume:</span>
                          <p className="font-medium">
                            {selectedDoc.extracted_data.volume_m3 
                              ? `${selectedDoc.extracted_data.volume_m3} m³` 
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Supplier:</span>
                          <p className="font-medium">{selectedDoc.extracted_data.supplier || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mix Code:</span>
                          <p className="font-medium">{selectedDoc.extracted_data.mix_code || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delivery Date:</span>
                          <p className="font-medium">
                            {selectedDoc.extracted_data.delivery_date 
                              ? format(new Date(selectedDoc.extracted_data.delivery_date), "d MMM yyyy")
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Truck Rego:</span>
                          <p className="font-medium">{selectedDoc.extracted_data.truck_rego || "—"}</p>
                        </div>
                        {selectedDoc.extracted_data.site_address && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Site Address:</span>
                            <p className="font-medium">{selectedDoc.extracted_data.site_address}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Link to Job
                    </h4>

                    <div>
                      <Label>Job *</Label>
                      <Select value={selectedJobId || ""} onValueChange={setSelectedJobId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobs.map(job => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.job_number ? `${job.job_number} - ` : ""}{job.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedJobId && pours.length > 0 && (
                      <div>
                        <Label>Pour (optional)</Label>
                        <Select value={selectedPourId || ""} onValueChange={setSelectedPourId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Link to a specific pour" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No specific pour</SelectItem>
                            {pours.map(pour => (
                              <SelectItem key={pour.id} value={pour.id}>
                                {pour.pour_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        File to Folder
                      </Label>
                      <Select value={selectedSubfolder} onValueChange={setSelectedSubfolder}>
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
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => approveMutation.mutate(selectedDoc)}
                      disabled={!selectedJobId || approveMutation.isPending}
                      className="flex-1"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve & File
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(selectedDoc.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // List view
            <div className="space-y-3">
              {pendingDocs.map(doc => (
                <Card 
                  key={doc.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedDocId(doc.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {doc.subject || "(No subject)"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.from_email}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(doc.received_at), "d MMM yyyy HH:mm")}
                          <span>•</span>
                          <FileText className="w-3 h-3" />
                          {doc.file_name}
                        </div>
                      </div>
                      {doc.extracted_data.docket_number && (
                        <Badge variant="outline" className="shrink-0">
                          #{doc.extracted_data.docket_number}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
