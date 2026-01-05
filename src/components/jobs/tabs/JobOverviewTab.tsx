import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Truck, FileText, Package } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { BOQCard } from "@/components/jobs/boq/BOQCard";

type Job = Tables<"jobs">;

interface JobOverviewTabProps {
  job: Job;
  crewName?: string;
}

export function JobOverviewTab({ job, crewName }: JobOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
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

          {crewName && (
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Assigned Crew</p>
                <p className="text-sm text-muted-foreground">{crewName}</p>
              </div>
            </div>
          )}

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

      {/* Concrete Specs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Concrete Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Estimated</p>
              <p className="text-xl font-semibold">{job.estimated_m3 ?? "—"} m³</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Ordered</p>
              <p className="text-xl font-semibold">{job.ordered_m3 ?? "—"} m³</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Strength</p>
              <p className="text-xl font-semibold">{job.mpa_strength ?? "—"} MPa</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Slump</p>
              <p className="text-xl font-semibold">{job.slump ?? "—"}</p>
            </div>
          </div>

          {(job.concrete_supplier || job.finish_type) && (
            <div className="mt-4 space-y-3">
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

      {/* Bill of Quantities Card - spans full width */}
      <div className="md:col-span-2">
        <BOQCard jobId={job.id} jobName={job.name} jobNumber={job.job_number ?? undefined} />
      </div>
    </div>
  );
}
