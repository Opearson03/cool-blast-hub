import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Calendar, DollarSign, MoreVertical, Send, CheckCircle, Clock, XCircle, Loader2, Square, Home, Building2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EstimateFormDialog } from "@/components/estimates/EstimateFormDialog";
import { EstimateDetailSheet } from "@/components/estimates/EstimateDetailSheet";
import { DraftProgressTracker } from "@/components/estimates/DraftProgressTracker";
import { EstimateQuotaDialog } from "@/components/estimates/EstimateQuotaDialog";
import { DuplicateEstimateDialog } from "@/components/estimates/DuplicateEstimateDialog";
import { useEstimateQuota } from "@/hooks/useEstimateQuota";

type EstimateStatus = "draft" | "pending" | "sent" | "accepted" | "declined";
type EstimateType = "driveway" | "house_slab" | "commercial_slab";

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  company_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  site_address: string;
  description: string | null;
  total_amount: number;
  status: EstimateStatus;
  created_at: string;
  valid_until: string | null;
  notes: string | null;
  estimate_type: EstimateType;
  scope_data: Record<string, unknown> | null;
  selected_scopes: string[] | null;
  site_visit_date: string | null;
  follow_up_date: string | null;
  deposit_percentage: number | null;
  quote_validity_days: number | null;
  payment_terms_type: string | null;
}

const estimateTypeConfig: Record<EstimateType, { label: string; icon: typeof Square }> = {
  driveway: { label: "Small Slabs", icon: Square },
  house_slab: { label: "House Slab", icon: Home },
  commercial_slab: { label: "Commercial", icon: Building2 },
};

const statusConfig: Record<EstimateStatus, { label: string; docType: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  draft: { label: "Draft", docType: "Estimate", variant: "secondary", icon: FileText },
  pending: { label: "Finalized", docType: "Quote", variant: "outline", icon: Clock },
  sent: { label: "Sent", docType: "Quote", variant: "default", icon: Send },
  accepted: { label: "Accepted", docType: "Quote", variant: "default", icon: CheckCircle },
  declined: { label: "Declined", docType: "Quote", variant: "destructive", icon: XCircle },
};

export default function AdminEstimates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [viewingEstimate, setViewingEstimate] = useState<Estimate | null>(null);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [duplicatingEstimate, setDuplicatingEstimate] = useState<Estimate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { canCreate, used, limit, resetsAt, tier, refresh: refreshQuota } = useEstimateQuota();

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      const { data, error } = await supabase
        .from("estimates")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Estimate[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, clear any job references to this estimate
      const { error: jobUpdateError } = await supabase
        .from("jobs")
        .update({ source_estimate_id: null })
        .eq("source_estimate_id", id);
      if (jobUpdateError) throw jobUpdateError;

      // Get takeoffs with their plan URLs for storage cleanup
      const { data: takeoffs } = await supabase
        .from("estimate_takeoffs")
        .select("id, plan_url")
        .eq("estimate_id", id);
      
      if (takeoffs && takeoffs.length > 0) {
        const takeoffIds = takeoffs.map(t => t.id);
        
        // Delete related takeoff markups first
        await supabase
          .from("takeoff_markups")
          .delete()
          .in("takeoff_id", takeoffIds);
        
        // Clean up storage files to prevent orphaned files
        for (const takeoff of takeoffs) {
          if (takeoff.plan_url) {
            await supabase.storage
              .from("estimate-plans")
              .remove([takeoff.plan_url]);
          }
        }
      }

      // Delete estimate takeoffs
      await supabase
        .from("estimate_takeoffs")
        .delete()
        .eq("estimate_id", id);

      // Delete estimate items
      await supabase
        .from("estimate_items")
        .delete()
        .eq("estimate_id", id);

      // Finally delete the estimate
      const { error } = await supabase
        .from("estimates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Estimate deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete estimate", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EstimateStatus }) => {
      const { error } = await supabase
        .from("estimates")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const filteredEstimates = estimates.filter(
    (estimate) =>
      estimate.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.estimate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.site_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleEdit = (estimate: Estimate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEstimate(estimate);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingEstimate(null);
    // Refresh quota after form closes in case a new estimate was created
    refreshQuota();
  };

  const handleNewEstimate = () => {
    // Check quota before allowing new estimate creation
    if (!canCreate && limit !== null) {
      setQuotaDialogOpen(true);
      return;
    }
    setFormOpen(true);
  };

  const handleRowClick = (estimate: Estimate) => {
    // For drafts, open the edit form to continue working
    if (estimate.status === "draft") {
      setEditingEstimate(estimate);
      setFormOpen(true);
    } else {
      setViewingEstimate(estimate);
    }
  };

  // Parse estimate scope_data to extract structured data for job creation
  const parseEstimateForJob = (estimate: Estimate) => {
    let estimatedM3 = "";
    let mpaStrength = "";
    let slump = "";
    let finishType = "";
    let concreteSupplier = "";
    const pours: Array<{
      pour_name: string;
      estimated_m3: number;
      mpa_strength: string;
      slump: string;
      notes: string;
    }> = [];

    // Try to extract from structured scope_data first (new modular calculator format)
    if (estimate.scope_data && estimate.selected_scopes) {
      const scopeData = estimate.scope_data as Record<string, any>;
      
      // Calculate total m³ from all scopes
      let totalM3 = 0;
      
      // Iterate through selected scopes to extract data from moduleAnswers
      for (const scopeKey of estimate.selected_scopes) {
        const scopeEntry = scopeData[scopeKey];
        if (!scopeEntry) continue;
        
        const moduleAnswers = scopeEntry.moduleAnswers || {};
        const scopeAnswers = scopeEntry.scopeAnswers || {};
        
        // Extract from concrete-supply module
        const concreteModule = moduleAnswers["concrete-supply"];
        if (concreteModule) {
          const volume = Number(concreteModule.calculated_volume) || 0;
          if (volume > 0) {
            totalM3 += volume;
          }
          
          // Get MPa from concrete type (e.g., "32MPA" -> "32")
          if (concreteModule.concrete_type && !mpaStrength) {
            mpaStrength = concreteModule.concrete_type.replace(/MPA/i, "").trim();
          }
        }
        
        // Extract from surface-finishing module
        const finishModule = moduleAnswers["surface-finishing"];
        if (finishModule && finishModule.finish_type && !finishType) {
          // Convert snake_case to Title Case
          finishType = finishModule.finish_type
            .split("_")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
        
        // Extract slump if stored (check common locations)
        if (scopeAnswers.slump && !slump) {
          slump = String(scopeAnswers.slump);
        } else if (concreteModule?.slump && !slump) {
          slump = String(concreteModule.slump);
        }
        
        // Try to get concrete supplier from scope or module answers
        if (scopeAnswers.concrete_supplier && !concreteSupplier) {
          concreteSupplier = scopeAnswers.concrete_supplier;
        }
        
        // Extract pours if defined in scope
        if (scopeEntry.pours && Array.isArray(scopeEntry.pours)) {
          const scopeLabel = scopeKey.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
          scopeEntry.pours.forEach((pour: any, index: number) => {
            pours.push({
              pour_name: pour.name || `${scopeLabel} Pour ${index + 1}`,
              estimated_m3: Math.round((Number(concreteModule?.calculated_volume) / scopeEntry.pours.length) * 100) / 100,
              mpa_strength: mpaStrength,
              slump: slump,
              notes: `Crew: ${pour.crewSize || 4} | Hours: ${pour.hoursPerMan || 8}h per person`,
            });
          });
        }
      }
      
      // Fallback to old format if no volume found
      if (totalM3 === 0) {
        // Check raft_slab for pours data (legacy format)
        if (estimate.selected_scopes.includes("raft_slab") && scopeData.raft_slab) {
          const raftData = scopeData.raft_slab;
          mpaStrength = mpaStrength || raftData.concreteStrength || "";
          
          const length = parseFloat(raftData.slabLength) || 0;
          const width = parseFloat(raftData.slabWidth) || 0;
          const depth = parseFloat(raftData.slabDepth) || 0;
          const wastage = parseFloat(raftData.wastagePercent) || 5;
          const volume = (length * width * (depth / 1000)) * (1 + wastage / 100);
          totalM3 += volume;
          
          if (raftData.pours && Array.isArray(raftData.pours)) {
            raftData.pours.forEach((pour: any, index: number) => {
              pours.push({
                pour_name: pour.name || `Pour ${index + 1}`,
                estimated_m3: Math.round((volume / raftData.pours.length) * 100) / 100,
                mpa_strength: mpaStrength,
                slump: slump,
                notes: `Crew: ${pour.crewSize || 4} | Hours: ${pour.hoursPerMan || 8}h per person`,
              });
            });
          }
        }
        
        // Check standard_slab or driveway (legacy format)
        const slabScope = estimate.selected_scopes.includes("standard_slab") ? "standard_slab" 
          : estimate.selected_scopes.includes("driveway") ? "driveway" : null;
        if (slabScope && scopeData[slabScope]) {
          const slabData = scopeData[slabScope];
          mpaStrength = mpaStrength || slabData.concreteStrength || "";
          
          const length = parseFloat(slabData.slabLength) || 0;
          const width = parseFloat(slabData.slabWidth) || 0;
          const depth = parseFloat(slabData.slabDepth) || 0;
          const wastage = parseFloat(slabData.wastagePercent) || 5;
          totalM3 += (length * width * (depth / 1000)) * (1 + wastage / 100);
        }
      }
      
      if (totalM3 > 0) {
        estimatedM3 = totalM3.toFixed(2);
      }
    }
    
    // Fallback: Parse the description format if no scope_data
    if (!estimatedM3 && estimate.description) {
      const m3Match = estimate.description.match(/Concrete:\s*([\d.]+)\s*m[³3]/i);
      if (m3Match) {
        estimatedM3 = m3Match[1];
      } else {
        const simpleM3Match = estimate.description.match(/([\d.]+)\s*m[³3]/i);
        if (simpleM3Match) {
          estimatedM3 = simpleM3Match[1];
        }
      }
      
      const mpaMatch = estimate.description.match(/@\s*([\d]+)\s*MPa/i);
      if (mpaMatch) {
        mpaStrength = mpaMatch[1];
      }
    }
    
    // Default slump if not found
    if (!slump && mpaStrength) {
      // Standard slumps based on MPa
      const mpaValue = parseInt(mpaStrength);
      if (mpaValue >= 40) slump = "100";
      else if (mpaValue >= 32) slump = "100";
      else if (mpaValue >= 25) slump = "80";
      else slump = "80";
    }

    // Build comprehensive job notes
    const noteParts = [
      `Converted from estimate ${estimate.estimate_number}`,
      `Quote Total: ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(estimate.total_amount)}`,
    ];
    
    if (estimate.client_email) {
      noteParts.push(`Client Email: ${estimate.client_email}`);
    }
    if (estimate.client_phone) {
      noteParts.push(`Client Phone: ${estimate.client_phone}`);
    }
    if (estimate.description) {
      noteParts.push(`\nScope: ${estimate.description}`);
    }

    return {
      name: `${estimate.client_name} - ${estimate.site_address.split(",")[0]}`,
      site_address: estimate.site_address,
      builder_client: estimate.client_name,
      estimated_m3: estimatedM3,
      mpa_strength: mpaStrength,
      slump: slump,
      finish_type: finishType,
      concrete_supplier: concreteSupplier,
      job_notes: noteParts.join("\n").trim(),
      pours: pours,
      estimate_id: estimate.estimate_number,
      // Link job to source estimate for Project Startup auto-fill
      source_estimate_id: estimate.id,
      scope_data: estimate.scope_data as Record<string, unknown> | undefined,
      selected_scopes: estimate.selected_scopes as string[] | undefined,
      estimate_description: estimate.description,
    };
  };

  const handleConvertToJob = (estimate: Estimate) => {
    const jobData = parseEstimateForJob(estimate);
    // Navigate to jobs page with pre-filled data in URL state
    navigate("/admin/jobs", { state: { createJobFromEstimate: jobData } });
    toast({
      title: "Ready to create job",
      description: "All estimate details have been pre-filled.",
    });
  };

  return (
    <AdminLayout>
      <SEOHead
        title="Quotes | PourHub"
        description="Create and manage job estimates and quotes"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Quotes</h1>
            <p className="text-muted-foreground">Estimates become quotes once sent</p>
          </div>
          <div className="flex items-center gap-3">
            {tier === "free" && limit !== null && (
              <Badge variant="outline" className="text-sm">
                {used}/{limit} quotes this month
              </Badge>
            )}
            <Button className="gap-2" onClick={handleNewEstimate}>
              <Plus className="w-4 h-4" />
              New Estimate
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estimates.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estimates.filter(e => e.status === "draft").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{estimates.filter(e => e.status === "sent").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(estimates.reduce((sum, e) => sum + (e.total_amount || 0), 0))}</p>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Estimates List - Mobile Cards */}
        {!isLoading && (
          <div className="lg:hidden space-y-3">
            {filteredEstimates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {estimates.length === 0 ? "No quotes yet. Create your first estimate!" : "No quotes found"}
                </CardContent>
              </Card>
            ) : (
              filteredEstimates.map((estimate) => {
                const StatusIcon = statusConfig[estimate.status].icon;
                const TypeIcon = estimateTypeConfig[estimate.estimate_type]?.icon || Square;
                return (
                  <Card 
                    key={estimate.id} 
                    className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(estimate)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-muted">
                            <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold">{estimate.estimate_number}</p>
                            <p className="text-sm text-muted-foreground">{estimate.client_name}</p>
                          </div>
                        </div>
                        <Badge variant={statusConfig[estimate.status].variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[estimate.status].label}
                        </Badge>
                      </div>
                      
                      {/* Draft Progress Tracker */}
                      {estimate.status === "draft" && (
                        <DraftProgressTracker estimate={estimate} variant="compact" />
                      )}
                      
                      {estimate.description && <p className="text-sm line-clamp-1">{estimate.description}</p>}
                      <p className="text-xs text-muted-foreground">{estimate.site_address}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(estimate.created_at)}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <DollarSign className="w-3.5 h-3.5" />
                            {formatCurrency(estimate.total_amount || 0)}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEdit(estimate, e)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDuplicatingEstimate(estimate); }}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: estimate.id, status: "sent" }); }}>
                              Mark as Sent
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: estimate.id, status: "accepted" }); }}>
                              Mark as Accepted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: estimate.id, status: "declined" }); }}>
                              Mark as Declined
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(estimate.id); }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Estimates List - Desktop Table */}
        {!isLoading && (
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-muted-foreground">Type</th>
                    <th className="p-4 font-medium text-muted-foreground">Quote #</th>
                    <th className="p-4 font-medium text-muted-foreground">Client</th>
                    <th className="p-4 font-medium text-muted-foreground">Description</th>
                    <th className="p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="p-4 font-medium text-muted-foreground">Status</th>
                    <th className="p-4 font-medium text-muted-foreground">Created</th>
                    <th className="p-4 font-medium text-muted-foreground">Valid Until</th>
                    <th className="p-4 font-medium text-muted-foreground sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEstimates.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        {estimates.length === 0 ? "No quotes yet. Create your first estimate!" : "No quotes found"}
                      </td>
                    </tr>
                  ) : (
                    filteredEstimates.map((estimate) => {
                      const StatusIcon = statusConfig[estimate.status].icon;
                      const TypeIcon = estimateTypeConfig[estimate.estimate_type]?.icon || Square;
                      const typeLabel = estimateTypeConfig[estimate.estimate_type]?.label || "Small Slabs";
                      return (
                        <tr 
                          key={estimate.id} 
                          className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(estimate)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2" title={typeLabel}>
                              <div className="p-1.5 rounded-md bg-muted">
                                <TypeIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium">{estimate.estimate_number}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{estimate.client_name}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{estimate.site_address}</p>
                            </div>
                          </td>
                          <td className="p-4 max-w-[250px] truncate">{estimate.description || "-"}</td>
                          <td className="p-4 font-semibold">{formatCurrency(estimate.total_amount || 0)}</td>
                          <td className="p-4">
                            {estimate.status === "draft" ? (
                              <div className="min-w-[140px]">
                                <DraftProgressTracker estimate={estimate} variant="compact" />
                              </div>
                            ) : (
                              <Badge variant={statusConfig[estimate.status].variant} className="gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[estimate.status].label}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground">{formatDate(estimate.created_at)}</td>
                          <td className="p-4 text-muted-foreground">{formatDate(estimate.valid_until)}</td>
                          <td className="p-4 w-12">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => handleEdit(estimate, e)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDuplicatingEstimate(estimate); }}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: estimate.id, status: "sent" }); }}>
                                  Mark as Sent
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: estimate.id, status: "accepted" }); }}>
                                  Mark as Accepted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: estimate.id, status: "declined" }); }}>
                                  Mark as Declined
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(estimate.id); }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      <EstimateFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        editEstimate={editingEstimate ? {
          ...editingEstimate,
          scope_data: editingEstimate.scope_data as any,
          selected_scopes: editingEstimate.selected_scopes as any,
        } : null}
      />

      <EstimateDetailSheet
        estimate={viewingEstimate}
        open={!!viewingEstimate}
        onOpenChange={(open) => !open && setViewingEstimate(null)}
        onConvertToJob={handleConvertToJob}
      />

      <EstimateQuotaDialog
        open={quotaDialogOpen}
        onOpenChange={setQuotaDialogOpen}
        used={used}
        limit={limit || 1}
        resetsAt={resetsAt}
      />

      <DuplicateEstimateDialog
        estimate={duplicatingEstimate}
        open={!!duplicatingEstimate}
        onOpenChange={(open) => !open && setDuplicatingEstimate(null)}
        onDuplicated={() => refreshQuota()}
      />
    </AdminLayout>
  );
}
