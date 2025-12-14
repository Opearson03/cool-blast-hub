import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Users } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { SWMSFormDialog } from "../swms/SWMSFormDialog";
import { SWMSDetailSheet } from "../swms/SWMSDetailSheet";

type JobSWMS = Tables<"job_swms">;
type SWMSSignoff = Tables<"swms_signoffs">;

interface JobSWMSTabProps {
  jobId: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  active: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
};

export function JobSWMSTab({ jobId }: JobSWMSTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSwms, setSelectedSwms] = useState<JobSWMS | null>(null);

  const { data: swmsList = [], isLoading } = useQuery({
    queryKey: ["job-swms", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_swms")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as JobSWMS[];
    },
  });

  const { data: signoffs = [] } = useQuery({
    queryKey: ["swms-signoffs", jobId],
    queryFn: async () => {
      if (swmsList.length === 0) return [];
      const swmsIds = swmsList.map((s) => s.id);
      const { data, error } = await supabase
        .from("swms_signoffs")
        .select("*")
        .in("swms_id", swmsIds);
      if (error) throw error;
      return data as SWMSSignoff[];
    },
    enabled: swmsList.length > 0,
  });

  const getSignoffCount = (swmsId: string) => {
    return signoffs.filter((s) => s.swms_id === swmsId).length;
  };

  const getSignoffsForSwms = (swmsId: string) => {
    return signoffs.filter((s) => s.swms_id === swmsId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading SWMS...</div>
    );
  }

  if (swmsList.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No SWMS Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add Safe Work Method Statements for this job
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add SWMS
            </Button>
          </CardContent>
        </Card>
        <SWMSFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} jobId={jobId} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Safe Work Method Statements</h3>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add SWMS
          </Button>
        </div>

        <div className="space-y-3">
          {swmsList.map((swms) => {
            const signoffCount = getSignoffCount(swms.id);
            return (
              <Card 
                key={swms.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedSwms(swms)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{swms.name}</span>
                          <Badge variant="outline" className={statusColors[swms.status || "pending"]}>
                            {swms.status === "completed" ? "Completed" : swms.status === "active" ? "Active" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created: {format(new Date(swms.created_at!), "d MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{signoffCount} signoffs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <SWMSFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} jobId={jobId} />
      <SWMSDetailSheet
        open={!!selectedSwms}
        onOpenChange={(open) => !open && setSelectedSwms(null)}
        swms={selectedSwms}
        signoffs={selectedSwms ? getSignoffsForSwms(selectedSwms.id) : []}
        jobId={jobId}
      />
    </>
  );
}