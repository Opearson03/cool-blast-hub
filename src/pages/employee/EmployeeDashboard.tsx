import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, FileCheck, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ITPDetailSheet } from "@/components/jobs/itps/ITPDetailSheet";
import type { Tables } from "@/integrations/supabase/types";

type JobITP = Tables<"job_itps">;

interface ITPWithDetails extends JobITP {
  job?: { id: string; name: string; job_number: string; site_address: string } | null;
  pour?: { id: string; pour_name: string; pour_date: string; visit_type: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  completed: "bg-green-500/20 text-green-600 border-green-500/30",
};

export default function EmployeeDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedItp, setSelectedItp] = useState<ITPWithDetails | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch ITPs assigned to this user
  const { data: assignedItps = [], isLoading } = useQuery({
    queryKey: ["my-assigned-itps", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("job_itps")
        .select(`
          *,
          job:jobs(id, name, job_number, site_address),
          pour:job_pours(id, pour_name, pour_date, visit_type)
        `)
        .eq("assigned_to", userId)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ITPWithDetails[];
    },
    enabled: !!userId,
  });

  // Fetch completed ITPs
  const { data: completedItps = [] } = useQuery({
    queryKey: ["my-completed-itps", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("job_itps")
        .select(`
          *,
          job:jobs(id, name, job_number, site_address),
          pour:job_pours(id, pour_name, pour_date, visit_type)
        `)
        .eq("assigned_to", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as ITPWithDetails[];
    },
    enabled: !!userId,
  });

  const visitTypeLabels: Record<string, string> = {
    pour: "Pour",
    earthworks: "Earthworks",
    formwork_place: "Place Formwork",
    formwork_strip: "Strip Formwork",
    cure: "Curing",
    seal: "Sealing",
    other: "Other",
  };

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>

        {/* Assigned ITPs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              My Assigned ITPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : assignedItps.length === 0 ? (
              <p className="text-muted-foreground">No ITPs assigned to you.</p>
            ) : (
              <div className="space-y-3">
                {assignedItps.map((itp) => (
                  <Card
                    key={itp.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedItp(itp)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {itp.status === "in_progress" ? (
                            <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                          ) : (
                            <ClipboardList className="w-5 h-5 text-muted-foreground mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{itp.name}</span>
                              <Badge variant="outline" className={statusColors[itp.status || "pending"]}>
                                {itp.status === "in_progress" ? "In Progress" : "Pending"}
                              </Badge>
                            </div>
                            {itp.job && (
                              <p className="text-sm text-muted-foreground">
                                {itp.job.job_number} - {itp.job.name}
                              </p>
                            )}
                            {itp.pour && (
                              <p className="text-sm text-muted-foreground">
                                {itp.pour.pour_name} • {visitTypeLabels[itp.pour.visit_type || "pour"]}
                                {itp.pour.pour_date && ` • ${format(new Date(itp.pour.pour_date), "d MMM")}`}
                              </p>
                            )}
                            {itp.job?.site_address && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {itp.job.site_address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Completed */}
        {completedItps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Recently Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedItps.map((itp) => (
                  <div
                    key={itp.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{itp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {itp.job?.job_number} - {itp.job?.name}
                      </p>
                    </div>
                    {itp.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(itp.completed_at), "d MMM")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ITP Detail Sheet */}
      <ITPDetailSheet
        open={!!selectedItp}
        onOpenChange={(open) => !open && setSelectedItp(null)}
        itp={selectedItp}
        jobId={selectedItp?.job_id || ""}
      />
    </EmployeeLayout>
  );
}
