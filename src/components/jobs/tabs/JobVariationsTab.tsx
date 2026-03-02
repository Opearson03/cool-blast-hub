import { useState } from "react";
import { useXeroConnection, useSendToXero } from "@/hooks/useXeroConnection";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreHorizontal, Pencil, Trash2, Send, CheckCircle, XCircle, FileText, Loader2, ArrowUpRight } from "lucide-react";
import { VariationFormDialog } from "@/components/jobs/VariationFormDialog";
import { SendVariationDialog } from "@/components/jobs/SendVariationDialog";
import { QuickQuoteDialog } from "@/components/estimates/QuickQuoteDialog";
import { format } from "date-fns";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface Job {
  id: string;
  name: string;
  job_number: string | null;
  site_address: string;
  builder_client: string | null;
  source_estimate_id?: string | null;
}

interface JobVariationsTabProps {
  jobId: string;
  businessId: string;
  job: Job;
}

interface VariationItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface Variation {
  id: string;
  job_id: string;
  business_id: string;
  variation_number: string;
  description: string;
  reason: string | null;
  items: VariationItem[];
  amount: number;
  status: string;
  submitted_at: string | null;
  submitted_to_email: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approval_reference: string | null;
  days_extension: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  submitted: { label: "Submitted", className: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  approved: { label: "Approved", className: "bg-green-500/20 text-green-600 border-green-500/30" },
  declined: { label: "Declined", className: "bg-red-500/20 text-red-600 border-red-500/30" },
  invoiced: { label: "Invoiced", className: "bg-purple-500/20 text-purple-600 border-purple-500/30" },
};

const reasonLabels: Record<string, string> = {
  client_request: "Client Request",
  site_condition: "Site Condition",
  design_change: "Design Change",
  regulatory: "Regulatory",
  other: "Other",
};

export function JobVariationsTab({ jobId, businessId, job }: JobVariationsTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuoteVariationOpen, setIsQuoteVariationOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [deleteVariation, setDeleteVariation] = useState<Variation | null>(null);
  const [sendVariation, setSendVariation] = useState<Variation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected: isXeroConnected } = useXeroConnection();
  const showXero = useFeatureFlag('xero_integration');
  const sendToXero = useSendToXero();

  // Fetch source estimate for client details pre-fill
  const { data: sourceEstimate } = useQuery({
    queryKey: ["source-estimate", job.source_estimate_id],
    queryFn: async () => {
      if (!job.source_estimate_id) return null;
      const { data } = await supabase
        .from("estimates")
        .select("client_name, client_email, client_phone, site_address")
        .eq("id", job.source_estimate_id)
        .single();
      return data;
    },
    enabled: !!job.source_estimate_id,
  });

  const { data: variations = [], isLoading } = useQuery({
    queryKey: ["job-variations", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_variations")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((v) => ({
        ...v,
        items: (v.items as unknown as VariationItem[]) || [],
      })) as Variation[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_variations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-variations", jobId] });
      toast({ title: "Variation deleted" });
      setDeleteVariation(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, extra }: { id: string; status: string; extra?: Record<string, unknown> }) => {
      const update: Record<string, unknown> = { status, ...extra };
      if (status === "approved") {
        update.approved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("job_variations").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-variations", jobId] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const totalVariations = variations.length;
  const approvedTotal = variations
    .filter((v) => v.status === "approved" || v.status === "invoiced")
    .reduce((sum, v) => sum + Number(v.amount), 0);
  const pendingTotal = variations
    .filter((v) => v.status === "draft" || v.status === "submitted")
    .reduce((sum, v) => sum + Number(v.amount), 0);

  const handleEdit = (variation: Variation) => {
    setEditingVariation(variation);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVariation(null);
  };

  // When a new variation is created, open the send dialog immediately
  const handleVariationCreated = (variation: { 
    id: string; 
    variation_number: string; 
    description: string; 
    reason: string | null; 
    items: VariationItem[]; 
    amount: number; 
    days_extension: number; 
    notes: string | null; 
  }) => {
    setSendVariation(variation as Variation);
  };

  const formatCurrency = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return amount < 0 ? `-${formatted}` : formatted;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Variations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalVariations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${approvedTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(approvedTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${pendingTotal >= 0 ? "text-foreground" : "text-red-600"}`}>
              {formatCurrency(pendingTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsQuoteVariationOpen(true)} className="touch-target">
          <Send className="w-4 h-4 mr-2" />
          Quote Variation
        </Button>
        <Button onClick={() => setIsFormOpen(true)} className="touch-target">
          <Plus className="w-4 h-4 mr-2" />
          Add Variation
        </Button>
      </div>

      {/* Variations List */}
      {variations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No Variations</p>
            <p className="text-sm text-muted-foreground mb-4">
              Track contract changes by adding variations
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Variation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="block md:hidden space-y-3">
            {variations.map((variation) => (
              <Card key={variation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">
                        {variation.variation_number}
                      </p>
                      <p className="font-medium">{variation.description}</p>
                    </div>
                    <Badge variant="outline" className={statusConfig[variation.status]?.className}>
                      {statusConfig[variation.status]?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className={`text-lg font-semibold ${Number(variation.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(Number(variation.amount))}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {variation.status === "draft" && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(variation)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSendVariation(variation)}>
                              <Send className="w-4 h-4 mr-2" />
                              Send to Client
                            </DropdownMenuItem>
                          </>
                        )}
                        {variation.status === "submitted" && (
                          <>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: variation.id, status: "approved" })}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Approved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: variation.id, status: "declined" })}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Mark Declined
                            </DropdownMenuItem>
                          </>
                        )}
                        {variation.status === "approved" && (
                          <>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: variation.id, status: "invoiced" })}>
                              <FileText className="w-4 h-4 mr-2" />
                              Mark Invoiced
                            </DropdownMenuItem>
                            {showXero && isXeroConnected && (
                              <DropdownMenuItem
                                disabled={sendToXero.isPending}
                                onClick={() => {
                                  sendToXero.mutate({
                                    sourceType: "variation",
                                    sourceId: variation.id,
                                    clientName: sourceEstimate?.client_name || job.builder_client || "Client",
                                    clientEmail: sourceEstimate?.client_email,
                                    clientPhone: sourceEstimate?.client_phone,
                                    lineItems: variation.items.map((item) => ({
                                      description: item.description,
                                      quantity: item.quantity,
                                      unit_price: item.unit_price,
                                    })),
                                    reference: `${job.job_number || ""} ${variation.variation_number}`.trim(),
                                  });
                                }}
                              >
                                <ArrowUpRight className="w-4 h-4 mr-2" />
                                Send to Xero
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {(variation.status === "draft" || variation.status === "declined") && (
                          <DropdownMenuItem
                            onClick={() => setDeleteVariation(variation)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variation #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variations.map((variation) => (
                    <TableRow key={variation.id}>
                      <TableCell className="font-mono">{variation.variation_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{variation.description}</TableCell>
                      <TableCell>{variation.reason ? reasonLabels[variation.reason] || variation.reason : "—"}</TableCell>
                      <TableCell className={`text-right font-medium ${Number(variation.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(Number(variation.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[variation.status]?.className}>
                          {statusConfig[variation.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(variation.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {variation.status === "draft" && (
                              <>
                                <DropdownMenuItem onClick={() => handleEdit(variation)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSendVariation(variation)}>
                                  <Send className="w-4 h-4 mr-2" />
                                  Send to Client
                                </DropdownMenuItem>
                              </>
                            )}
                            {variation.status === "submitted" && (
                              <>
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: variation.id, status: "approved" })}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark Approved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: variation.id, status: "declined" })}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Mark Declined
                                </DropdownMenuItem>
                              </>
                            )}
                            {variation.status === "approved" && (
                              <>
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: variation.id, status: "invoiced" })}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Mark Invoiced
                                </DropdownMenuItem>
                                {showXero && isXeroConnected && (
                                  <DropdownMenuItem
                                    disabled={sendToXero.isPending}
                                    onClick={() => {
                                      sendToXero.mutate({
                                        sourceType: "variation",
                                        sourceId: variation.id,
                                        clientName: sourceEstimate?.client_name || job.builder_client || "Client",
                                        clientEmail: sourceEstimate?.client_email,
                                        clientPhone: sourceEstimate?.client_phone,
                                        lineItems: variation.items.map((item) => ({
                                          description: item.description,
                                          quantity: item.quantity,
                                          unit_price: item.unit_price,
                                        })),
                                        reference: `${job.job_number || ""} ${variation.variation_number}`.trim(),
                                      });
                                    }}
                                  >
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    Send to Xero
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {(variation.status === "draft" || variation.status === "declined") && (
                              <DropdownMenuItem
                                onClick={() => setDeleteVariation(variation)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}

      {/* Form Dialog */}
      <VariationFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        jobId={jobId}
        businessId={businessId}
        existingCount={variations.length}
        editVariation={editingVariation}
        onCreated={editingVariation ? undefined : handleVariationCreated}
      />

      {/* Quick Quote Variation Dialog */}
      <QuickQuoteDialog
        open={isQuoteVariationOpen}
        onOpenChange={setIsQuoteVariationOpen}
        preselectedJobId={jobId}
        preselectedJobName={`${job.job_number ? `${job.job_number} - ` : ""}${job.name}`}
        defaultClientName={sourceEstimate?.client_name || job.builder_client || ""}
        defaultClientEmail={sourceEstimate?.client_email || ""}
        defaultClientPhone={sourceEstimate?.client_phone || ""}
        defaultSiteAddress={sourceEstimate?.site_address || job.site_address || ""}
      />

      {/* Send to Client Dialog */}
      {sendVariation && (
        <SendVariationDialog
          open={!!sendVariation}
          onOpenChange={() => setSendVariation(null)}
          variation={sendVariation}
          job={job}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteVariation} onOpenChange={() => setDeleteVariation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete variation "{deleteVariation?.variation_number}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVariation && deleteMutation.mutate(deleteVariation.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
