import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Droplets, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PourFormDialog } from "@/components/jobs/PourFormDialog";
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

export function JobPoursTab({ jobId }: JobPoursTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editPour, setEditPour] = useState<JobPour | null>(null);
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
            <div className="text-2xl font-bold text-blue-400">{totalM3.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Total m³</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pour Name</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>m³</TableHead>
              <TableHead className="hidden md:table-cell">Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pours.map((pour) => (
              <TableRow key={pour.id}>
                <TableCell className="font-medium">{pour.pour_name}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {pour.pour_date ? format(new Date(pour.pour_date), "d MMM yyyy") : "—"}
                  {pour.scheduled_time && ` @ ${pour.scheduled_time.slice(0, 5)}`}
                </TableCell>
                <TableCell>
                  {pour.actual_m3 || pour.estimated_m3 || "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {pour.concrete_supplier || "—"}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[pour.status || "scheduled"]}>
                    {statusLabels[pour.status || "scheduled"]}
                  </Badge>
                </TableCell>
                <TableCell>
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
