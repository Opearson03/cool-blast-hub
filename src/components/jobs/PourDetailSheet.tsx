import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Droplets, Truck, Pencil, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { SubTradesList } from "@/components/jobs/SubTradesList";
import { PourFormDialog } from "@/components/jobs/PourFormDialog";

interface JobPour {
  id: string;
  job_id: string;
  pour_name: string;
  visit_type: string | null;
  pour_date: string | null;
  scheduled_time: string | null;
  estimated_m3: number | null;
  actual_m3: number | null;
  concrete_supplier: string | null;
  mpa_strength: string | null;
  slump: string | null;
  notes: string | null;
  status: string | null;
}

interface PourDetailSheetProps {
  pour: JobPour | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobAddress?: string;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function PourDetailSheet({ pour, open, onOpenChange, jobAddress }: PourDetailSheetProps) {
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch linked approved dockets for this pour
  const { data: linkedDockets } = useQuery({
    queryKey: ["pour-dockets", pour?.id],
    queryFn: async () => {
      if (!pour?.id) return [];
      const { data, error } = await supabase
        .from("pending_documents")
        .select("id, file_name, extracted_data")
        .eq("linked_pour_id", pour.id)
        .eq("status", "approved")
        .eq("document_type", "delivery_docket");
      if (error) throw error;
      return data || [];
    },
    enabled: !!pour?.id && open,
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!pour) return;
      const { error } = await supabase
        .from("job_pours")
        .update({ status: newStatus })
        .eq("id", pour.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-pours", pour?.job_id] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  if (!pour) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={statusColors[pour.status || "scheduled"]}>
                {statusLabels[pour.status || "scheduled"]}
              </Badge>
            </div>
            <SheetTitle className="text-xl">{pour.pour_name}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Quick Info */}
            <div className="space-y-3">
              {pour.pour_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(pour.pour_date), "EEEE, d MMMM yyyy")}
                      {pour.scheduled_time && ` at ${pour.scheduled_time.slice(0, 5)}`}
                    </p>
                  </div>
                </div>
              )}

              {jobAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{jobAddress}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Concrete Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Concrete Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Estimated</p>
                    <p className="text-lg font-semibold">{pour.estimated_m3 ?? "—"} m³</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Actual</p>
                    <p className="text-lg font-semibold">{pour.actual_m3 ?? "—"} m³</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Strength</p>
                    <p className="text-lg font-semibold">{pour.mpa_strength ?? "—"} MPa</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Slump</p>
                    <p className="text-lg font-semibold">{pour.slump ?? "—"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Docket Breakdown */}
              {linkedDockets && linkedDockets.length > 0 && (
                <div className="mt-3 rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">Docket Breakdown</p>
                  </div>
                  <div className="space-y-1 text-sm font-mono">
                    {linkedDockets.map((docket, index) => {
                      const extractedData = docket.extracted_data as Record<string, unknown> | null;
                      const volume = extractedData?.volume_m3;
                      const docketNum = extractedData?.docket_number || docket.file_name;
                      const isLast = index === linkedDockets.length - 1;
                      return (
                        <div key={docket.id} className="flex items-center text-muted-foreground">
                          <span className="mr-2">{isLast ? "└─" : "├─"}</span>
                          <span className="flex-1 truncate">#{String(docketNum)}</span>
                          <span className="font-medium text-foreground">
                            {volume != null ? `${volume} m³` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pour.concrete_supplier && (
                <div className="flex items-start gap-3 mt-3">
                  <Truck className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Supplier</p>
                    <p className="text-sm text-muted-foreground">{pour.concrete_supplier}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Subbies Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sub-Trades
              </h3>
              <SubTradesList
                jobId={pour.job_id}
                pourId={pour.id}
                pourName={pour.pour_name}
                pourDate={pour.pour_date}
                expanded
              />
            </div>

            {/* Notes */}
            {pour.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {pour.notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Status Update */}
            <div>
              <p className="text-sm font-medium mb-2">Update Status</p>
              <Select
                value={pour.status || "scheduled"}
                onValueChange={(v) => updateStatus.mutate(v)}
              >
                <SelectTrigger className="touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="w-full touch-target"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Pour
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <PourFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        jobId={pour.job_id}
        editPour={pour}
      />
    </>
  );
}
