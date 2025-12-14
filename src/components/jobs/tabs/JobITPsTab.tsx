import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, FileCheck, Clock, User } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { ITPFormDialog } from "../itps/ITPFormDialog";
import { ITPDetailSheet } from "../itps/ITPDetailSheet";

type JobITP = Tables<"job_itps">;

interface ITPWithRelations extends JobITP {
  pour?: { id: string; pour_name: string; pour_date: string | null; visit_type: string | null } | null;
  assignee?: { id: string; full_name: string } | null;
}

interface JobITPsTabProps {
  jobId: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
};

const itpTypeLabels: Record<string, string> = {
  formwork: "Formwork",
  reinforcement: "Reinforcement",
  pre_pour: "Pre-Pour",
  post_pour: "Post-Pour",
  custom: "Custom",
};

const visitTypeLabels: Record<string, string> = {
  pour: "Pour",
  earthworks: "Earthworks",
  formwork_place: "Place Formwork",
  formwork_strip: "Strip Formwork",
  cure: "Curing",
  seal: "Sealing",
  other: "Other",
};

export function JobITPsTab({ jobId }: JobITPsTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItp, setSelectedItp] = useState<ITPWithRelations | null>(null);

  const { data: itps = [], isLoading } = useQuery({
    queryKey: ["job-itps", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_itps")
        .select(`
          *,
          pour:job_pours(id, pour_name, pour_date, visit_type)
        `)
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch assignee names separately
      const itpData = data || [];
      const assignedToIds = itpData.filter(i => i.assigned_to).map(i => i.assigned_to);
      
      let assigneeMap: Record<string, string> = {};
      if (assignedToIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", assignedToIds);
        assigneeMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p.full_name }), {});
      }

      return itpData.map(itp => ({
        ...itp,
        assignee: itp.assigned_to ? { id: itp.assigned_to, full_name: assigneeMap[itp.assigned_to] || "Unknown" } : null,
      })) as ITPWithRelations[];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading ITPs...</div>
    );
  }

  if (itps.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No ITPs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add inspection and test plans for this job
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add ITP
            </Button>
          </CardContent>
        </Card>
        <ITPFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} jobId={jobId} />
      </>
    );
  }

  const getProgress = (itp: ITPWithRelations) => {
    const checklist = itp.checklist_data as unknown as Array<{ checked: boolean }>;
    if (!checklist || checklist.length === 0) return 0;
    const completed = checklist.filter((item) => item.checked).length;
    return Math.round((completed / checklist.length) * 100);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Inspection & Test Plans</h3>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add ITP
          </Button>
        </div>

        <div className="space-y-3">
          {itps.map((itp) => {
            const progress = getProgress(itp);
            return (
              <Card
                key={itp.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedItp(itp)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {itp.status === "completed" ? (
                        <FileCheck className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{itp.name}</span>
                          <Badge variant="outline" className={statusColors[itp.status || "pending"]}>
                            {itp.status === "completed" ? "Completed" : itp.status === "in_progress" ? "In Progress" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {itpTypeLabels[itp.itp_type] || itp.itp_type} • {progress}% complete
                        </p>
                        {itp.pour && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {itp.pour.pour_name} • {visitTypeLabels[itp.pour.visit_type || "pour"]}
                            {itp.pour.pour_date && ` • ${format(new Date(itp.pour.pour_date), "d MMM")}`}
                          </p>
                        )}
                        {itp.assignee && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Assigned to: {itp.assignee.full_name}
                          </p>
                        )}
                        {itp.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {format(new Date(itp.completed_at), "d MMM yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ITPFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} jobId={jobId} />
      <ITPDetailSheet
        open={!!selectedItp}
        onOpenChange={(open) => !open && setSelectedItp(null)}
        itp={selectedItp}
        jobId={jobId}
      />
    </>
  );
}
