import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Eye, Archive, Trash2, Search, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SWMSManagementTabProps {
  onCreateNew: () => void;
  onRefresh: () => void;
  onViewSwms: (swms: any) => void;
}

export function SWMSManagementTab({ onCreateNew, onRefresh, onViewSwms }: SWMSManagementTabProps) {
  const { toast } = useToast();
  const [swmsDocuments, setSwmsDocuments] = useState<any[]>([]);
  const [signatureData, setSignatureData] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedSwmsId, setSelectedSwmsId] = useState<string | null>(null);

  useEffect(() => {
    fetchSWMSDocuments();
  }, []);

  const fetchSWMSDocuments = async () => {
    const { data, error } = await supabase
      .from("swms_documents")
      .select(`
        *,
        jobs(job_number, title, status, completion_date)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Auto-archive expired or completed job SWMS
      const now = new Date();
      const updatesToArchive = data
        .filter(swms => {
          const isExpired = swms.valid_to && new Date(swms.valid_to) < now;
          const isJobCompleted = swms.jobs?.status === 'completed';
          return swms.status !== 'archived' && (isExpired || isJobCompleted);
        })
        .map(swms => swms.id);

      if (updatesToArchive.length > 0) {
        await supabase
          .from("swms_documents")
          .update({ status: 'archived' })
          .in('id', updatesToArchive);
        
        // Refetch after auto-archiving
        const { data: refreshedData } = await supabase
          .from("swms_documents")
          .select(`
            *,
            jobs(job_number, title, status, completion_date)
          `)
          .order("created_at", { ascending: false });
        
        setSwmsDocuments(refreshedData || []);
        fetchSignatureData(refreshedData || []);
      } else {
        setSwmsDocuments(data);
        fetchSignatureData(data);
      }
    }
  };

  const fetchSignatureData = async (documents: any[]) => {
    const signatureMap: Record<string, any> = {};
    
    for (const doc of documents) {
      const { data: signoffs } = await supabase
        .from("swms_signoffs")
        .select("*, profiles(full_name)")
        .eq("swms_id", doc.id);

      const signed = signoffs?.filter(s => s.acknowledged) || [];
      const pending = signoffs?.filter(s => !s.acknowledged) || [];
      
      signatureMap[doc.id] = {
        total: signoffs?.length || 0,
        signed: signed.length,
        pending: pending.length,
        pendingSigners: pending.map(s => s.profiles?.full_name || s.signer_name),
      };
    }
    
    setSignatureData(signatureMap);
  };

  const handleArchive = async () => {
    if (!selectedSwmsId) return;

    const { error } = await supabase
      .from("swms_documents")
      .update({ status: 'archived' })
      .eq('id', selectedSwmsId);

    if (error) {
      toast({ title: "Error", description: "Failed to archive SWMS", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "SWMS archived successfully" });
      fetchSWMSDocuments();
      onRefresh();
    }
    setArchiveDialogOpen(false);
    setSelectedSwmsId(null);
  };

  const handleDelete = async () => {
    if (!selectedSwmsId) return;

    const { error } = await supabase
      .from("swms_documents")
      .delete()
      .eq('id', selectedSwmsId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete SWMS", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "SWMS deleted successfully" });
      fetchSWMSDocuments();
      onRefresh();
    }
    setDeleteDialogOpen(false);
    setSelectedSwmsId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "draft": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "archived": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-muted";
    }
  };

  const activeDocuments = swmsDocuments.filter(d => d.status !== 'archived');
  const archivedDocuments = swmsDocuments.filter(d => d.status === 'archived');

  const filterDocuments = (docs: any[]) => {
    if (!searchQuery) return docs;
    const query = searchQuery.toLowerCase();
    return docs.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      doc.swms_number.toLowerCase().includes(query) ||
      doc.jobs?.job_number?.toLowerCase().includes(query)
    );
  };

  const renderDocumentCard = (swms: any, showArchiveButton: boolean = true) => {
    const signatures = signatureData[swms.id] || { total: 0, signed: 0, pending: 0, pendingSigners: [] };
    const isExpired = swms.valid_to && new Date(swms.valid_to) < new Date();
    
    return (
      <Card key={swms.id}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{swms.title}</h3>
                <Badge className={getStatusColor(swms.status)}>
                  {swms.status.toUpperCase()}
                </Badge>
                {isExpired && swms.status !== 'archived' && (
                  <Badge variant="destructive">EXPIRED</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">SWMS Number:</span> {swms.swms_number}
                </p>
                {swms.jobs && (
                  <p>
                    <span className="font-medium">Job:</span> {swms.jobs.job_number} - {swms.jobs.title}
                    {swms.jobs.status === 'completed' && (
                      <Badge variant="outline" className="ml-2">Job Completed</Badge>
                    )}
                  </p>
                )}
                <p>
                  <span className="font-medium">Location:</span> {swms.location || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Valid:</span>{" "}
                  {format(new Date(swms.valid_from), "MMM dd, yyyy")}
                  {swms.valid_to && ` - ${format(new Date(swms.valid_to), "MMM dd, yyyy")}`}
                </p>
              </div>
            </div>
          </div>

          {/* Signature Status */}
          {signatures.total > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Signature Status</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{signatures.signed}/{signatures.total}</span>
                </div>
              </div>
              {signatures.pending > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <span className="font-medium">Pending signatures:</span>{" "}
                    {signatures.pendingSigners.join(", ")}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onViewSwms(swms)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
            {showArchiveButton && swms.status !== 'archived' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { setSelectedSwmsId(swms.id); setArchiveDialogOpen(true); }}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="text-destructive"
              onClick={() => { setSelectedSwmsId(swms.id); setDeleteDialogOpen(true); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">SWMS Documents</h2>
          <p className="text-muted-foreground text-sm">Manage Safe Work Method Statements and track signatures</p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create SWMS
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, SWMS number, or job number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({filterDocuments(activeDocuments).length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({filterDocuments(archivedDocuments).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {filterDocuments(activeDocuments).length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active SWMS Documents</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No documents match your search" : "Create your first Safe Work Method Statement"}
              </p>
              {!searchQuery && (
                <Button onClick={onCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First SWMS
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterDocuments(activeDocuments).map(swms => renderDocumentCard(swms, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          {filterDocuments(archivedDocuments).length === 0 ? (
            <Card className="p-12 text-center">
              <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Archived Documents</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No archived documents match your search" : "Archived SWMS will appear here"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterDocuments(archivedDocuments).map(swms => renderDocumentCard(swms, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive SWMS Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the document to the archived section. You can still view it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SWMS Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the SWMS document and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}