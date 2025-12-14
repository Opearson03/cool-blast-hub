import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, CheckCircle, ChevronDown, ChevronRight, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
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

  const finishJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "completed" })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job marked as completed and archived");
    },
    onError: () => {
      toast.error("Failed to complete job");
    },
  });

  const handleFinishJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    finishJobMutation.mutate(jobId);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.site_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.builder_client?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "active") {
      return matchesSearch && (job.status === "scheduled" || job.status === "in_progress");
    }
    if (statusFilter === "all") {
      return matchesSearch;
    }
    return matchesSearch && job.status === statusFilter;
  });

  // Separate active and archived jobs for display
  const activeJobs = filteredJobs.filter(
    (job) => job.status === "scheduled" || job.status === "in_progress"
  );
  const archivedJobs = filteredJobs.filter(
    (job) => job.status === "completed" || job.status === "cancelled"
  );

  const getCrewName = (crewId: string | null) => {
    if (!crewId) return null;
    return crews.find((c) => c.id === crewId)?.name;
  };

  const handleJobClick = (job: Job) => {
    navigate(`/admin/jobs/${job.id}`);
  };

  const JobCard = ({ job, showFinishButton = false }: { job: Job; showFinishButton?: boolean }) => (
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
          <div className="text-right shrink-0 flex flex-col items-end gap-2">
            {job.scheduled_date && (
              <p className="text-sm font-medium">
                {format(new Date(job.scheduled_date), "d MMM")}
              </p>
            )}
            {job.pour_time && (
              <p className="text-xs text-muted-foreground">{job.pour_time}</p>
            )}
            {getCrewName(job.crew_id) && (
              <p className="text-xs text-primary">{getCrewName(job.crew_id)}</p>
            )}
            {showFinishButton && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                onClick={(e) => handleFinishJob(e, job.id)}
                disabled={finishJobMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Finish
              </Button>
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
  );

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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="all">All Jobs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Jobs List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {searchQuery ? "No jobs found matching your search." : "No jobs yet. Create your first job to get started."}
            </CardContent>
          </Card>
        ) : statusFilter === "active" ? (
          <>
            {/* Active Jobs with Archive section */}
            {activeJobs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">Active Jobs ({activeJobs.length})</h2>
                {activeJobs.map((job) => (
                  <JobCard key={job.id} job={job} showFinishButton />
                ))}
              </div>
            )}

            {activeJobs.length === 0 && archivedJobs.length > 0 && (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  No active jobs. All jobs have been completed or archived.
                </CardContent>
              </Card>
            )}

            {/* Archived Jobs */}
            {archivedJobs.length > 0 && (
              <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen} className="mt-6">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      <span>Archived Jobs ({archivedJobs.length})</span>
                    </div>
                    {archiveOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  {archivedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {statusFilter === "all" ? "All Jobs" : statusLabels[statusFilter]} ({filteredJobs.length})
            </h2>
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} showFinishButton={job.status === "scheduled" || job.status === "in_progress"} />
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
    </AdminLayout>
  );
}
