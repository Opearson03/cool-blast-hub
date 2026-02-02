import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Mail, Building2, MapPin, Loader2, ExternalLink, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PendingPlansSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

interface PendingPlan {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  received_at: string;
  file_url: string;
  file_name: string;
  extracted_data: any;
  status: string;
}

// Helper function to extract storage path from URL
function extractPathFromUrl(url: string, bucketName: string): string {
  // Handle both signed URLs and public URLs
  const bucketMarker = `/${bucketName}/`;
  const startIndex = url.indexOf(bucketMarker);
  if (startIndex === -1) return url;
  
  let path = url.slice(startIndex + bucketMarker.length);
  // Remove query params (signed URL tokens)
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    path = path.slice(0, queryIndex);
  }
  return decodeURIComponent(path);
}

export function PendingPlansSheet({ open, onOpenChange, businessId }: PendingPlansSheetProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PendingPlan | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Form state for conversion
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  const { data: pendingPlans = [], isLoading } = useQuery({
    queryKey: ["pending-plans-list", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_plans")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .order("received_at", { ascending: false });
      
      if (error) throw error;
      return data as PendingPlan[];
    },
    enabled: open && !!businessId
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) throw new Error("No plan selected");

      // 1. Create estimate draft
      const { data: estimate, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          business_id: businessId,
          client_name: clientName || "New Client",
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          site_address: siteAddress || "Address TBD",
          status: "draft",
          estimate_type: "commercial_slab",
          notes: `Plan received via email from ${selectedPlan.from_email}`,
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      // 2. Create takeoff record
      const { data: takeoff, error: takeoffError } = await supabase
        .from("estimate_takeoffs")
        .insert({
          estimate_id: estimate.id,
          plan_url: null,
          plan_type: null,
          page_count: 1,
          current_page: 1
        })
        .select()
        .single();

      if (takeoffError) throw takeoffError;

      // 3. Copy file from test-documents to estimate-plans
      const sourceUrl = selectedPlan.file_url;
      const sourcePath = extractPathFromUrl(sourceUrl, 'test-documents');
      
      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('test-documents')
        .download(sourcePath);
      
      if (downloadError) {
        console.error("Error downloading file:", downloadError);
        throw new Error("Failed to copy plan file");
      }

      // Upload to estimate-plans
      const fileExt = selectedPlan.file_name.split('.').pop()?.toLowerCase() || 'pdf';
      const destPath = `${businessId}/${estimate.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('estimate-plans')
        .upload(destPath, fileData, { upsert: true });
      
      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw new Error("Failed to store plan file");
      }

      // 4. Create takeoff_files record with the storage path (not signed URL)
      const { error: fileRecordError } = await supabase
        .from('takeoff_files')
        .insert({
          takeoff_id: takeoff.id,
          file_url: destPath,
          file_type: fileExt === 'pdf' ? 'pdf' : 'image',
          file_name: selectedPlan.file_name.replace(/\.[^/.]+$/, '') || 'Building Plan',
          page_count: 1,
          sort_order: 0
        });

      if (fileRecordError) {
        console.error("Error creating takeoff file:", fileRecordError);
      }

      // 5. Update pending plan status
      const { error: updateError } = await supabase
        .from("pending_plans")
        .update({
          status: "converted",
          linked_estimate_id: estimate.id,
        })
        .eq("id", selectedPlan.id);

      if (updateError) throw updateError;

      return estimate;
    },
    onSuccess: (estimate) => {
      queryClient.invalidateQueries({ queryKey: ["pending-plans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-plans-list"] });
      toast.success("Estimate created - complete the quote setup");
      setShowConvertDialog(false);
      setSelectedPlan(null);
      onOpenChange(false);
      // Navigate with state to auto-open wizard
      navigate("/admin/estimates", { 
        state: { editEstimateId: estimate.id } 
      });
    },
    onError: (error) => {
      console.error("Error creating estimate:", error);
      toast.error("Failed to create estimate");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) throw new Error("No plan selected");

      const { error } = await supabase
        .from("pending_plans")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null,
        })
        .eq("id", selectedPlan.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-plans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-plans-list"] });
      toast.success("Plan rejected");
      setShowRejectDialog(false);
      setSelectedPlan(null);
      setRejectionReason("");
    },
    onError: (error) => {
      console.error("Error rejecting plan:", error);
      toast.error("Failed to reject plan");
    }
  });

  const openConvertDialog = (plan: PendingPlan) => {
    setSelectedPlan(plan);
    // Pre-fill from extracted data
    const extracted = plan.extracted_data || {};
    setClientName(extracted.client_name || plan.from_name || "");
    setClientEmail(plan.from_email || "");
    setClientPhone(extracted.phone || "");
    setSiteAddress(extracted.site_address || "");
    setShowConvertDialog(true);
  };

  const openRejectDialog = (plan: PendingPlan) => {
    setSelectedPlan(plan);
    setShowRejectDialog(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Plans to Quote
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : pendingPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending plans</p>
                <p className="text-sm mt-1">
                  Share your inbox email with clients to receive plans
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {pendingPlans.map((plan) => {
                  const extracted = plan.extracted_data || {};
                  
                  return (
                    <Card key={plan.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {extracted.project_name || plan.subject || plan.file_name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {plan.from_name || plan.from_email}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(plan.received_at), "d MMM")}
                          </Badge>
                        </div>

                        {/* AI Extracted Data */}
                        {(extracted.site_address || extracted.client_name || extracted.plan_type) && (
                          <>
                            <Separator />
                            <div className="text-sm space-y-1">
                              {extracted.site_address && (
                                <p className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {extracted.site_address}
                                </p>
                              )}
                              {extracted.client_name && (
                                <p className="flex items-center gap-1 text-muted-foreground">
                                  <Building2 className="w-3 h-3" />
                                  {extracted.client_name}
                                </p>
                              )}
                              {extracted.plan_type && (
                                <Badge variant="outline" className="text-xs">
                                  {extracted.plan_type}
                                </Badge>
                              )}
                            </div>
                          </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(plan.file_url, "_blank")}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Plan
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => openConvertDialog(plan)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Start Estimate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openRejectDialog(plan)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Convert to Estimate Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Estimate from Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="e.g., john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="e.g., 0412 345 678"
              />
            </div>
            <div>
              <Label htmlFor="siteAddress">Site Address</Label>
              <Input
                id="siteAddress"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Sydney NSW"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Estimate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reject this plan? This will remove it from your inbox.
            </p>
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Spam, not relevant, duplicate..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
