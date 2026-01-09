import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

type Pour = {
  id: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  status: string | null;
  visit_type: string | null;
  job_id: string;
  estimated_m3?: number | null;
  concrete_supplier?: string | null;
  mpa_strength?: string | null;
  slump?: string | null;
  notes?: string | null;
  job?: {
    id: string;
    name: string;
    site_address: string;
    job_number: string | null;
  };
};

interface PourDetailSheetProps {
  pour: Pour | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const visitTypeLabels: Record<string, string> = {
  pour: "Concrete Pour",
  earthworks: "Earthworks",
  formwork_place: "Place Formwork",
  formwork_strip: "Strip Formwork",
  cure: "Cure",
  seal: "Seal",
  other: "Other",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500 text-white",
  in_progress: "bg-orange-500 text-white",
  completed: "bg-green-500 text-white",
  cancelled: "bg-red-500 text-white",
};

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function PourDetailSheet({ pour, open, onOpenChange }: PourDetailSheetProps) {
  // Fetch full pour details
  const { data: pourDetails } = useQuery({
    queryKey: ["pour-details", pour?.id],
    enabled: !!pour?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select(`
          *,
          jobs (id, name, site_address, job_number, builder_client)
        `)
        .eq("id", pour!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!pour) return null;

  const visitType = pour.visit_type || "pour";
  const status = pour.status || "scheduled";
  const details = pourDetails || pour;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{pour.pour_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Status and Type */}
          <div className="flex gap-2">
            <Badge className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
            <Badge variant="outline">
              {visitTypeLabels[visitType]}
            </Badge>
          </div>

          {/* Date and Time */}
          {(pour.pour_date || pour.scheduled_time) && (
            <div className="space-y-2">
              {pour.pour_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(pour.pour_date), "EEEE, MMMM d, yyyy")}</span>
                </div>
              )}
              {pour.scheduled_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{pour.scheduled_time.slice(0, 5)}</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Job Info */}
          {pour.job && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Job Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link 
                    to={`/admin/jobs/${pour.job.id}`} 
                    className="text-primary hover:underline"
                  >
                    {pour.job.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{pour.job.site_address}</span>
                </div>
                {pour.job.job_number && (
                  <p className="text-xs text-muted-foreground pl-6">
                    #{pour.job.job_number}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Concrete Details (if pour type) */}
          {visitType === "pour" && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Concrete Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {details.estimated_m3 && (
                    <div>
                      <p className="text-muted-foreground text-xs">Estimated m³</p>
                      <p>{details.estimated_m3}</p>
                    </div>
                  )}
                  {details.mpa_strength && (
                    <div>
                      <p className="text-muted-foreground text-xs">MPa</p>
                      <p>{details.mpa_strength}</p>
                    </div>
                  )}
                  {details.slump && (
                    <div>
                      <p className="text-muted-foreground text-xs">Slump</p>
                      <p>{details.slump}</p>
                    </div>
                  )}
                  {details.concrete_supplier && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Supplier</p>
                      <p>{details.concrete_supplier}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {details.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground">{details.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/admin/jobs/${pour.job_id}`}>View Job</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
