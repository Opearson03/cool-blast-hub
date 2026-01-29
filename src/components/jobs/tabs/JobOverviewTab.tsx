import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, Truck, FileText, Package, User, Building2, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BOQCard } from "@/components/jobs/boq/BOQCard";
import { JobCalendarWidget } from "@/components/jobs/calendar/JobCalendarWidget";
import { useToast } from "@/hooks/use-toast";

type Job = Tables<"jobs">;

interface JobOverviewTabProps {
  job: Job;
  onNavigateToSubbies?: () => void;
}

interface CustomerInfo {
  clientName: string | null;
  companyName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  siteAddress: string | null;
}

const SCOPE_LABELS: Record<string, string> = {
  standard_slab: "Slab on Ground",
  raft_slab: "Raft Slab",
  waffle_pod: "Waffle Pod",
  strip_footings: "Strip Footings",
  piers: "Piers",
  suspended_slab: "Suspended Slab",
  crossovers: "Crossover",
  driveway: "Driveway",
  paths_surrounds: "Paths & Surrounds",
  retaining_wall: "Retaining Wall",
  architectural: "Architectural Concrete",
};

// All available scopes that can be selected for a job
const ALL_SCOPES = [
  "standard_slab",
  "raft_slab",
  "waffle_pod",
  "strip_footings",
  "piers",
  "suspended_slab",
  "crossovers",
  "driveway",
  "paths_surrounds",
  "retaining_wall",
  "architectural",
] as const;

function calculateTotalVolumeFromEstimate(
  scopeData: Record<string, any> | null,
  selectedScopes: string[] | null
): number {
  if (!scopeData || !selectedScopes || selectedScopes.length === 0) {
    return 0;
  }

  let totalVolume = 0;

  for (const scopeKey of selectedScopes) {
    const scopeEntry = scopeData[scopeKey];
    if (!scopeEntry) continue;

    const scopeAnswers = scopeEntry.scopeAnswers || {};
    const moduleAnswers = scopeEntry.moduleAnswers || {};
    const concreteModule = moduleAnswers["concrete-supply"] || {};

    // Get volume from concrete-supply module or calculate from scope answers
    let volume = concreteModule.calculated_volume || 0;
    
    // Fallback: calculate from scope answers if no module data
    if (!volume && scopeAnswers.area && scopeAnswers.thickness) {
      const area = Number(scopeAnswers.area) || 0;
      const thickness = (Number(scopeAnswers.thickness) || 100) / 1000;
      const wastage = (Number(concreteModule.wastage_percent) || 5) / 100;
      volume = area * thickness * (1 + wastage);
    }

    // For piers, calculate from pier data
    if (scopeKey === "piers" && !volume && scopeAnswers.num_piers) {
      const count = Number(scopeAnswers.num_piers) || 0;
      const diameter = (Number(scopeAnswers.diameter) || 450) / 1000;
      const depth = (Number(scopeAnswers.depth) || 1000) / 1000;
      const radius = diameter / 2;
      volume = count * Math.PI * radius * radius * depth * 1.1; // 10% wastage
    }

    totalVolume += volume;
  }

  return Math.round(totalVolume * 10) / 10;
}

function extractCustomerInfoFromEstimate(estimate: {
  client_name: string | null;
  company_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  site_address: string | null;
} | null): CustomerInfo | null {
  if (!estimate) return null;
  
  return {
    clientName: estimate.client_name,
    companyName: estimate.company_name,
    clientEmail: estimate.client_email,
    clientPhone: estimate.client_phone,
    siteAddress: estimate.site_address,
  };
}

export function JobOverviewTab({ job }: JobOverviewTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch source estimate if job was converted from a quote
  const { data: sourceEstimate } = useQuery({
    queryKey: ["source-estimate-full", job.source_estimate_id],
    queryFn: async () => {
      if (!job.source_estimate_id) return null;
      const { data, error } = await supabase
        .from("estimates")
        .select("scope_data, selected_scopes, client_name, company_name, client_email, client_phone, site_address")
        .eq("id", job.source_estimate_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!job.source_estimate_id,
  });

  // Get scopes from estimate or use empty array - this is editable
  const estimateScopes = (sourceEstimate?.selected_scopes as string[] | null) || [];
  
  // Local state for scope checkboxes - initialized from job's scope_data or estimate
  const [selectedScopes, setSelectedScopes] = useState<string[]>(() => {
    // Check if job has its own scopes stored
    const jobScopeData = (job as any).scope_data as Record<string, any> | null;
    if (jobScopeData && jobScopeData.selectedScopes) {
      return jobScopeData.selectedScopes as string[];
    }
    return estimateScopes;
  });

  // Update mutation for saving scopes to job
  const updateScopesMutation = useMutation({
    mutationFn: async (scopes: string[]) => {
      // Store scopes in job's metadata - we'll use a JSON column or similar approach
      // For now, we can update the job_notes or create a proper field
      // Since jobs table doesn't have a dedicated scopes field, we'll store in scope_data
      const { error } = await supabase
        .from("jobs")
        .update({ 
          // Using the existing job structure - we'll need to handle this gracefully
          job_notes: job.job_notes // Keep existing notes
        })
        .eq("id", job.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
    },
  });

  const handleScopeToggle = (scopeKey: string, checked: boolean) => {
    const newScopes = checked 
      ? [...selectedScopes, scopeKey]
      : selectedScopes.filter(s => s !== scopeKey);
    
    setSelectedScopes(newScopes);
    // Note: For now, scopes are managed in local state 
    // A proper implementation would require a database migration to add a scopes column
  };

  // Calculate total volume from estimate
  const totalEstimatedVolume = sourceEstimate
    ? calculateTotalVolumeFromEstimate(
        sourceEstimate.scope_data as Record<string, any> | null,
        sourceEstimate.selected_scopes as string[] | null
      )
    : 0;

  const customerInfo = extractCustomerInfoFromEstimate(sourceEstimate);

  // Check if we have any customer info to display
  const hasCustomerInfo = customerInfo && (
    customerInfo.clientName || 
    customerInfo.companyName || 
    customerInfo.clientEmail || 
    customerInfo.clientPhone
  );

  // Display volume - prefer job's own value, fallback to calculated from estimate
  const displayVolume = job.estimated_m3 ?? (totalEstimatedVolume > 0 ? totalEstimatedVolume : null);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Customer Info Card - auto-populated from quote */}
      {hasCustomerInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Details
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                From Quote
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerInfo.clientName && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Contact Name</p>
                  <p className="text-sm text-muted-foreground">{customerInfo.clientName}</p>
                </div>
              </div>
            )}

            {customerInfo.companyName && (
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p className="text-sm text-muted-foreground">{customerInfo.companyName}</p>
                </div>
              </div>
            )}

            {customerInfo.clientEmail && (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href={`mailto:${customerInfo.clientEmail}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {customerInfo.clientEmail}
                  </a>
                </div>
              </div>
            )}

            {customerInfo.clientPhone && (
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a 
                    href={`tel:${customerInfo.clientPhone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {customerInfo.clientPhone}
                  </a>
                </div>
              </div>
            )}

            {customerInfo.siteAddress && (
              <div className="flex items-start gap-3 pt-3 border-t">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Site Address</p>
                  <p className="text-sm text-muted-foreground">{customerInfo.siteAddress}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Details Card - now includes volume and scopes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Job Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Site Address</p>
              <p className="text-sm text-muted-foreground">{job.site_address}</p>
            </div>
          </div>

          {job.builder_client && (
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Client</p>
                <p className="text-sm text-muted-foreground">
                  {job.builder_client}
                  {job.po_number && (
                    <span className="block text-xs">PO: {job.po_number}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Estimated Total Volume */}
          <div className="flex items-start gap-3">
            <Package className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Estimated Total Volume</p>
              <p className="text-2xl font-bold text-primary">
                {displayVolume !== null ? `${displayVolume} m³` : "—"}
              </p>
            </div>
          </div>

          {/* Scopes Checklist */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Scopes</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_SCOPES.map((scopeKey) => {
                const isSelected = selectedScopes.includes(scopeKey);
                const isFromEstimate = estimateScopes.includes(scopeKey);
                
                return (
                  <div key={scopeKey} className="flex items-center gap-2">
                    <Checkbox
                      id={`scope-${scopeKey}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleScopeToggle(scopeKey, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`scope-${scopeKey}`}
                      className={`text-sm cursor-pointer ${isFromEstimate ? 'font-medium' : 'text-muted-foreground'}`}
                    >
                      {SCOPE_LABELS[scopeKey]}
                    </Label>
                  </div>
                );
              })}
            </div>
            {estimateScopes.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Bold scopes are from the original quote
              </p>
            )}
          </div>

          {job.job_notes && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-1">Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {job.job_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Calendar Widget - spans full width */}
      <JobCalendarWidget jobId={job.id} businessId={job.business_id} />

      {/* Bill of Quantities Card - spans full width */}
      <div className="md:col-span-2">
        <BOQCard jobId={job.id} jobName={job.name} jobNumber={job.job_number ?? undefined} />
      </div>
    </div>
  );
}
