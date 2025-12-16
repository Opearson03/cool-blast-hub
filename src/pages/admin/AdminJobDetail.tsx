import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { JobOverviewTab } from "@/components/jobs/tabs/JobOverviewTab";
import { JobProjectStartupTab } from "@/components/jobs/tabs/JobProjectStartupTab";
import { JobPoursTab } from "@/components/jobs/tabs/JobPoursTab";
import { JobITPsTab } from "@/components/jobs/tabs/JobITPsTab";
import { JobSWMSTab } from "@/components/jobs/tabs/JobSWMSTab";
import { JobTestResultsTab } from "@/components/jobs/tabs/JobTestResultsTab";
import { JobDocumentsTab } from "@/components/jobs/tabs/JobDocumentsTab";
import { JobEquipmentTab } from "@/components/jobs/tabs/JobEquipmentTab";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;
type Crew = { id: string; name: string };

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

export default function AdminJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Job;
    },
    enabled: !!id,
  });

  const { data: crews = [] } = useQuery({
    queryKey: ["crews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crews").select("id, name");
      if (error) throw error;
      return data as Crew[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus as Job["status"] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job deleted" });
      navigate("/admin/jobs");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!job) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job not found</p>
          <Button variant="link" onClick={() => navigate("/admin/jobs")}>
            Back to Jobs
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const crewName = crews.find((c) => c.id === job.crew_id)?.name;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/jobs")}
            className="w-fit -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground font-mono">
                  {job.job_number}
                </span>
                <Badge variant="outline" className={statusColors[job.status || "scheduled"]}>
                  {statusLabels[job.status || "scheduled"]}
                </Badge>
                {crewName && (
                  <Badge variant="secondary">{crewName}</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{job.name}</h1>
              <p className="text-muted-foreground">{job.site_address}</p>
            </div>

            <div className="flex gap-2">
              <Select
                value={job.status || "scheduled"}
                onValueChange={(v) => updateStatus.mutate(v)}
              >
                <SelectTrigger className="w-[140px] touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setIsEditOpen(true)} className="touch-target">
                <Pencil className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
                className="touch-target text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Overview
            </TabsTrigger>
            <TabsTrigger value="startup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Project Startup
            </TabsTrigger>
            <TabsTrigger value="pours" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Pours
            </TabsTrigger>
            <TabsTrigger value="itps" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              ITPs
            </TabsTrigger>
            <TabsTrigger value="swms" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              SWMS
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Test Results
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Documents
            </TabsTrigger>
            <TabsTrigger value="equipment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Equipment
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="m-0">
              <JobOverviewTab job={job} crewName={crewName} />
            </TabsContent>
            <TabsContent value="startup" className="m-0">
              <JobProjectStartupTab jobId={job.id} job={job} />
            </TabsContent>
            <TabsContent value="pours" className="m-0">
              <JobPoursTab jobId={job.id} />
            </TabsContent>
            <TabsContent value="itps" className="m-0">
              <JobITPsTab jobId={job.id} />
            </TabsContent>
            <TabsContent value="swms" className="m-0">
              <JobSWMSTab jobId={job.id} />
            </TabsContent>
            <TabsContent value="tests" className="m-0">
              <JobTestResultsTab jobId={job.id} />
            </TabsContent>
            <TabsContent value="documents" className="m-0">
              <JobDocumentsTab jobId={job.id} businessId={job.business_id} />
            </TabsContent>
            <TabsContent value="equipment" className="m-0">
              <JobEquipmentTab jobId={job.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

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
              Are you sure you want to delete "{job.name}"? This will also delete all associated
              ITPs, SWMS, test results, and documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-target">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-target"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
