import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, ChevronDown, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

export default function AdminJobs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPastJobsOpen, setIsPastJobsOpen] = useState(false);

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

  const filteredJobs = jobs.filter(
    (job) =>
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.site_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.builder_client?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate active and past jobs
  const activeJobs = filteredJobs.filter(
    (job) => job.status === "scheduled" || job.status === "in_progress"
  );
  const pastJobs = filteredJobs.filter(
    (job) => job.status === "completed" || job.status === "cancelled"
  );

  const getCrewName = (crewId: string | null) => {
    if (!crewId) return null;
    return crews.find((c) => c.id === crewId)?.name;
  };

  const handleJobClick = (job: Job) => {
    navigate(`/admin/jobs/${job.id}`);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "badge-scheduled",
      in_progress: "badge-in-progress",
      completed: "badge-completed",
      cancelled: "badge-cancelled",
    };
    const labels: Record<string, string> = {
      scheduled: "Scheduled",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return (
      <span className={`badge-status ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const renderJobCard = (job: Job, isPast: boolean = false) => (
    <Card
      key={job.id}
      className={`cursor-pointer hover:border-primary/50 hover-lift group ${isPast ? "opacity-60" : ""}`}
      onClick={() => handleJobClick(job)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-muted-foreground font-mono">
                {job.job_number || "—"}
              </span>
              {getStatusBadge(job.status)}
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {job.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{job.site_address}</p>
            {job.builder_client && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="text-gray-light">Client:</span> {job.builder_client}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            {job.scheduled_date && (
              <p className="text-sm font-semibold text-foreground">
                {format(new Date(job.scheduled_date), "d MMM")}
              </p>
            )}
            {job.pour_time && (
              <p className="text-xs text-muted-foreground">{job.pour_time}</p>
            )}
            {getCrewName(job.crew_id) && (
              <p className="text-xs text-primary font-medium mt-1">{getCrewName(job.crew_id)}</p>
            )}
          </div>
        </div>
        {(job.estimated_m3 || job.mpa_strength) && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            {job.estimated_m3 && (
              <span className="flex items-center gap-1">
                <span className="text-primary font-semibold">{job.estimated_m3}</span> m³
              </span>
            )}
            {job.mpa_strength && (
              <span className="flex items-center gap-1">
                <span className="text-primary font-semibold">{job.mpa_strength}</span> MPa
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl tracking-wide">JOBS</h1>
              <p className="text-sm text-muted-foreground">Manage your concrete projects</p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="touch-target shadow-glow-sm">
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
              className="pl-10 touch-target bg-secondary/50 border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="icon" className="touch-target">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeJobs.length === 0 && pastJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {searchQuery ? "No jobs found" : "No jobs yet"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Create your first job to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Jobs Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Active Jobs
                </h2>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {activeJobs.length}
                </span>
              </div>
              {activeJobs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No active jobs at the moment
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {activeJobs.map((job) => renderJobCard(job))}
                </div>
              )}
            </div>

            {/* Past Jobs Section */}
            {pastJobs.length > 0 && (
              <Collapsible open={isPastJobsOpen} onOpenChange={setIsPastJobsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-0 hover:bg-transparent group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                        Past Jobs
                      </span>
                      <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                        {pastJobs.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        isPastJobsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  {pastJobs.map((job) => renderJobCard(job, true))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
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
