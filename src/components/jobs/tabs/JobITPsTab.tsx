import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, FileCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type JobITP = Tables<"job_itps">;

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

export function JobITPsTab({ jobId }: JobITPsTabProps) {
  const { data: itps = [], isLoading } = useQuery({
    queryKey: ["job-itps", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_itps")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as JobITP[];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading ITPs...</div>
    );
  }

  if (itps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No ITPs Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add inspection and test plans for this job
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add ITP
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Inspection & Test Plans</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add ITP
        </Button>
      </div>

      <div className="space-y-3">
        {itps.map((itp) => (
          <Card key={itp.id} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {itp.status === "completed" ? (
                    <FileCheck className="w-5 h-5 text-success mt-0.5" />
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
                      {itpTypeLabels[itp.itp_type] || itp.itp_type}
                    </p>
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
        ))}
      </div>
    </div>
  );
}
