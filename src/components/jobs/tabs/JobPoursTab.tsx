import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Droplets, Plus, Pencil, Trash2, Calendar, Clock, ChevronRight, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PourFormDialog } from "@/components/jobs/PourFormDialog";
import { PourDetailSheet } from "@/components/jobs/PourDetailSheet";
import { useSubTradeInvites, useSubTradeStats } from "@/hooks/useSubTradeInvites";
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
  created_at: string | null;
}

interface JobPoursTabProps {
  jobId: string;
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

function PourSubbiesBadge({ pourId }: { pourId: string }) {
  const { data: invites } = useSubTradeInvites(pourId);
  const stats = useSubTradeStats(invites);
  
  if (stats.total === 0) return null;
  
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Users className="w-3 h-3" />
      <span className={stats.confirmed === stats.total ? "text-success" : ""}>
        {stats.confirmed}/{stats.total}
      </span>
    </div>
  );
}

export function JobPoursTab({ jobId, jobAddress }: JobPoursTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editPour, setEditPour] = useState<JobPour | null>(null);
  const [selectedPour, setSelectedPour] = useState<JobPour | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: pours = [], isLoading } = useQuery({
    queryKey: ["job-pours", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select("*")
        .eq("job_id", jobId)
        .order("pour_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as JobPour[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_pours").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-pours", jobId] });
      toast.success("Pour deleted");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete pour");
    },
  });

  const handlePourClick = (pour: JobPour) => {
    setSelectedPour(pour);
    setDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading pours...</div>
    );
  }

  if (pours.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <Droplets className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Pours Scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Add individual pours to this job to track concrete deliveries and testing
            </p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pour
            </Button>
          </CardContent>
        </Card>
        <PourFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          jobId={jobId}
        />
      </>
    );
  }

  // Stats
  const scheduledCount = pours.filter((p) => p.status === "scheduled").length;
  const completedCount = pours.filter((p) => p.status === "completed").length;
  const totalM3 = pours.reduce((sum, p) => sum + (p.actual_m3 || p.estimated_m3 || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Scheduled Pours</h3>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Pour
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{pours.length}</div>
            <p className="text-xs text-muted-foreground">Total Pours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-success">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalM3.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Total m³</p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Card layout - now clickable */}
      <div className="sm:hidden space-y-3">
        {pours.map((pour) => (
          <Card 
            key={pour.id} 
            className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handlePourClick(pour)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold truncate">{pour.pour_name}</h4>
                  {pour.pour_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(pour.pour_date), "EEE, d MMM")}</span>
                      {pour.scheduled_time && (
                        <>
                          <Clock className="w-3.5 h-3.5 ml-1" />
                          <span>{pour.scheduled_time.slice(0, 5)}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`shrink-0 ${statusColors[pour.status || "scheduled"]}`}>
                    {statusLabels[pour.status || "scheduled"]}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{pour.actual_m3 || pour.estimated_m3 || "—"}</span> m³
                  </span>
                  <PourSubbiesBadge pourId={pour.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table layout - now clickable rows */}
      <Card className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pour Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>m³</TableHead>
              <TableHead>Subbies</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pours.map((pour) => (
              <TableRow 
                key={pour.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handlePourClick(pour)}
              >
                <TableCell className="font-medium">{pour.pour_name}</TableCell>
                <TableCell>
                  {pour.pour_date ? format(new Date(pour.pour_date), "d MMM yyyy") : "—"}
                  {pour.scheduled_time && ` @ ${pour.scheduled_time.slice(0, 5)}`}
                </TableCell>
                <TableCell>
                  {pour.actual_m3 || pour.estimated_m3 || "—"}
                </TableCell>
                <TableCell>
                  <PourSubbiesBadge pourId={pour.id} />
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[pour.status || "scheduled"]}>
                    {statusLabels[pour.status || "scheduled"]}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditPour(pour);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteId(pour.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pour Detail Sheet */}
      <PourDetailSheet
        pour={selectedPour}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        jobAddress={jobAddress}
      />

      <PourFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditPour(null);
        }}
        jobId={jobId}
        editPour={editPour}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pour?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this pour and any associated test results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
