import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { format } from "date-fns";
import { MapPin, Calendar, Clock, Users, Truck, Pencil, Trash2 } from "lucide-react";
import { JobFormDialog } from "./JobFormDialog";

type Job = {
  id: string;
  job_number: string | null;
  name: string;
  site_address: string;
  builder_client: string | null;
  po_number: string | null;
  scheduled_date: string | null;
  pour_time: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  crew_id: string | null;
  estimated_m3: number | null;
  ordered_m3: number | null;
  concrete_supplier: string | null;
  mpa_strength: string | null;
  slump: string | null;
  finish_type: string | null;
  job_notes: string | null;
  created_at: string;
};

type Crew = {
  id: string;
  name: string;
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  in_progress: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-600 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface JobDetailsSheetProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crews: Crew[];
  onDelete: () => void;
}

export function JobDetailsSheet({ job, open, onOpenChange, crews, onDelete }: JobDetailsSheetProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!job) return;
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus as Job["status"] })
        .eq("id", job.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!job) return null;

  const crewName = crews.find((c) => c.id === job.crew_id)?.name;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">{job.job_number}</span>
              <Badge variant="outline" className={statusColors[job.status]}>
                {statusLabels[job.status]}
              </Badge>
            </div>
            <SheetTitle className="text-xl">{job.name}</SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="concrete">Concrete</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Quick Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Site Address</p>
                    <p className="text-sm text-muted-foreground">{job.site_address}</p>
                  </div>
                </div>

                {job.scheduled_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Pour Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(job.scheduled_date), "EEEE, d MMMM yyyy")}
                        {job.pour_time && ` at ${job.pour_time}`}
                      </p>
                    </div>
                  </div>
                )}

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
                        {job.po_number && ` (PO: ${job.po_number})`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Update Status</p>
                <Select value={job.status} onValueChange={(v) => updateStatus.mutate(v)}>
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

              {/* Notes */}
              {job.job_notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.job_notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="concrete" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Estimated</p>
                  <p className="text-lg font-semibold">{job.estimated_m3 ?? "—"} m³</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Ordered</p>
                  <p className="text-lg font-semibold">{job.ordered_m3 ?? "—"} m³</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Strength</p>
                  <p className="text-lg font-semibold">{job.mpa_strength ?? "—"} MPa</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Slump</p>
                  <p className="text-lg font-semibold">{job.slump ?? "—"}</p>
                </div>
              </div>

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
            </TabsContent>

            <TabsContent value="docs" className="space-y-4 mt-4">
              <p className="text-muted-foreground text-sm">ITPs, SWMS, and documents will appear here.</p>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditOpen(true)} className="flex-1 touch-target">
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)} className="touch-target">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <JobFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        crews={crews}
        editJob={job}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{job.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
