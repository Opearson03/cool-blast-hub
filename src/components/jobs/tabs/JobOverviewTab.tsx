import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, FileText, Package, User, Building2, Phone, Mail, Users, UserPlus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BOQCard } from "@/components/jobs/boq/BOQCard";
import { JobCalendarWidget } from "@/components/jobs/calendar/JobCalendarWidget";

type Job = Tables<"jobs">;

interface JobOverviewTabProps {
  job: Job;
  onNavigateToSubbies?: () => void;
}

interface ScopeConcreteSpec {
  scopeKey: string;
  label: string;
  volume: number;
  strength: string;
  slump?: string;
  supplier?: string;
  finishType?: string;
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

function extractConcreteSpecsFromEstimate(
  scopeData: Record<string, any> | null,
  selectedScopes: string[] | null
): ScopeConcreteSpec[] {
  if (!scopeData || !selectedScopes || selectedScopes.length === 0) {
    return [];
  }

  const specs: ScopeConcreteSpec[] = [];

  for (const scopeKey of selectedScopes) {
    const scopeEntry = scopeData[scopeKey];
    if (!scopeEntry) continue;

    const scopeAnswers = scopeEntry.scopeAnswers || {};
    const moduleAnswers = scopeEntry.moduleAnswers || {};
    const concreteModule = moduleAnswers["concrete-supply"] || {};
    const finishingModule = moduleAnswers["surface-finishing"] || {};

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

    // Get concrete type/strength
    const concreteType = concreteModule.concrete_type || "";
    const strength = concreteType.replace(/MPA/i, "").trim() || "";

    // Get finish type
    const finishType = finishingModule.finish_type?.replace(/_/g, " ") || "";

    if (volume > 0 || strength) {
      specs.push({
        scopeKey,
        label: SCOPE_LABELS[scopeKey] || scopeKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        volume: Math.round(volume * 100) / 100,
        strength,
        slump: concreteModule.slump || "",
        supplier: concreteModule.supplier || "",
        finishType: finishType ? finishType.replace(/\b\w/g, l => l.toUpperCase()) : "",
      });
    }
  }

  return specs;
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

export function JobOverviewTab({ job, onNavigateToSubbies }: JobOverviewTabProps) {
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

  // Fetch sub-trade invite stats for this job
  const { data: subbieStats } = useQuery({
    queryKey: ["job-subbie-stats", job.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_invites")
        .select("id, status, recipient_name, role")
        .eq("job_id", job.id)
        .eq("invite_type", "sub_trade");
      if (error) throw error;
      
      const uniqueSubbies = new Set<string>();
      let confirmed = 0;
      let total = 0;
      
      for (const invite of data || []) {
        const key = `${invite.recipient_name.toLowerCase()}-${invite.role.toLowerCase()}`;
        if (!uniqueSubbies.has(key)) {
          uniqueSubbies.add(key);
          total++;
          if (invite.status === "accepted") confirmed++;
        }
      }
      
      return { total, confirmed, invites: data?.length || 0 };
    },
  });

  const scopeSpecs = sourceEstimate
    ? extractConcreteSpecsFromEstimate(
        sourceEstimate.scope_data as Record<string, any> | null,
        sourceEstimate.selected_scopes as string[] | null
      )
    : [];

  const customerInfo = extractCustomerInfoFromEstimate(sourceEstimate);

  // Calculate totals from scope specs
  const totalEstimatedVolume = scopeSpecs.reduce((sum, s) => sum + s.volume, 0);
  const hasMultipleScopes = scopeSpecs.length > 1;

  // Check if we have any customer info to display
  const hasCustomerInfo = customerInfo && (
    customerInfo.clientName || 
    customerInfo.companyName || 
    customerInfo.clientEmail || 
    customerInfo.clientPhone
  );

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

      {/* Job Details Card */}
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

      {/* Sub-Trades Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sub-Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subbieStats && subbieStats.total > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 ${subbieStats.confirmed === subbieStats.total ? "text-green-500" : "text-muted-foreground"}`}>
                    {subbieStats.confirmed === subbieStats.total ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {subbieStats.confirmed}/{subbieStats.total} confirmed
                    </span>
                  </div>
                </div>
                {onNavigateToSubbies && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onNavigateToSubbies}
                  >
                    View All
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {subbieStats.invites} total invitation{subbieStats.invites !== 1 ? "s" : ""} sent
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No sub-trades invited yet</p>
              {onNavigateToSubbies && (
                <Button variant="outline" size="sm" onClick={onNavigateToSubbies}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Sub-Trade
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concrete Specs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Concrete Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Estimated</p>
              <p className="text-xl font-semibold">
                {job.estimated_m3 ?? (totalEstimatedVolume > 0 ? totalEstimatedVolume.toFixed(1) : "—")} m³
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Strength</p>
              <p className="text-xl font-semibold">
                {job.mpa_strength ?? (scopeSpecs.length === 1 && scopeSpecs[0].strength ? scopeSpecs[0].strength : "—")} MPa
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Slump</p>
              <p className="text-xl font-semibold">
                {job.slump ?? (scopeSpecs.length === 1 && scopeSpecs[0].slump ? scopeSpecs[0].slump : "—")}
              </p>
            </div>
          </div>

          {/* Show per-scope breakdown if multiple scopes from estimate */}
          {hasMultipleScopes && scopeSpecs.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Per Scope Breakdown
              </p>
              <div className="space-y-2">
                {scopeSpecs.map((spec) => (
                  <div
                    key={spec.scopeKey}
                    className="p-3 bg-muted/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{spec.label}</p>
                      <p className="text-sm font-semibold">{spec.volume.toFixed(1)} m³</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {spec.strength && <span>N{spec.strength}</span>}
                      {spec.slump && <span>Slump: {spec.slump}</span>}
                      {spec.finishType && <span>{spec.finishType}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplier and finish type */}
          {(job.concrete_supplier || job.finish_type) && (
            <div className="pt-4 border-t space-y-3">
              {job.concrete_supplier && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Supplier</p>
                  <p className="text-lg font-semibold">{job.concrete_supplier}</p>
                </div>
              )}
              {job.finish_type && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Finish Type</p>
                  <p className="text-lg font-semibold">{job.finish_type}</p>
                </div>
              )}
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
