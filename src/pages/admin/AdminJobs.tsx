import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { JobDetailsSheet } from "@/components/jobs/JobDetailsSheet";
import { format } from "date-fns";

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

export default function AdminJobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("scheduled_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Job[];
    },
  });

  const { data: crews = [] } = useQuery({
    queryKey: ["crews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crews").select("id, name");
      if (error) throw error;
      return data as Crew[];
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job deleted successfully" });
      setIsDetailsOpen(false);
      setSelectedJob(null);
    },
    onError: (error) => {
      toast({ title: "Error deleting job", description: error.message, variant: "destructive" });
    },
  });

  const filteredJobs = jobs.filter(
    (job) =>
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.site_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.builder_client?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCrewName = (crewId: string | null) => {
    if (!crewId) return null;
    return crews.find((c) => c.id === crewId)?.name;
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Jobs</h1>
          <Button onClick={() => setIsCreateOpen(true)} className="touch-target">
            <Plus className="w-5 h-5 mr-2" />
            New Job
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 touch-target"
            />
          </div>
          <Button variant="outline" size="icon" className="touch-target">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {searchQuery ? "No jobs found matching your search." : "No jobs yet. Create your first job to get started."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleJobClick(job)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          {job.job_number}
                        </span>
                        <Badge variant="outline" className={statusColors[job.status]}>
                          {statusLabels[job.status]}
                        </Badge>
                      </div>
                      <h3 className="font-semibold truncate">{job.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{job.site_address}</p>
                      {job.builder_client && (
                        <p className="text-sm text-muted-foreground">Client: {job.builder_client}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {job.scheduled_date && (
                        <p className="text-sm font-medium">
                          {format(new Date(job.scheduled_date), "d MMM")}
                        </p>
                      )}
                      {job.pour_time && (
                        <p className="text-xs text-muted-foreground">{job.pour_time}</p>
                      )}
                      {getCrewName(job.crew_id) && (
                        <p className="text-xs text-primary mt-1">{getCrewName(job.crew_id)}</p>
                      )}
                    </div>
                  </div>
                  {(job.estimated_m3 || job.mpa_strength) && (
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {job.estimated_m3 && <span>{job.estimated_m3}m³</span>}
                      {job.mpa_strength && <span>{job.mpa_strength} MPa</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Job Dialog */}
      <JobFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        crews={crews}
      />

      {/* Job Details Sheet */}
      <JobDetailsSheet
        job={selectedJob}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        crews={crews}
        onDelete={() => selectedJob && deleteJob.mutate(selectedJob.id)}
      />
    </AdminLayout>
  );
}
