import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type JobAssignment = {
  id: string;
  job_id: string;
  staff_id: string;
  role_on_job: string | null;
  assigned_at: string;
  jobs: {
    title: string;
    job_number: string;
    scheduled_date: string | null;
    scheduled_time: string | null;
    location: string | null;
  };
  profiles: {
    full_name: string;
  };
};

type StaffMember = {
  id: string;
  full_name: string;
};

type Job = {
  id: string;
  title: string;
  job_number: string;
  scheduled_date: string | null;
};

export default function ScheduleManagement() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    job_id: "",
    staff_id: "",
    role_on_job: "",
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const isAuthorized = await checkAuthorization(session.user.id);
    if (!isAuthorized) {
      navigate("/admin");
      return;
    }

    await Promise.all([fetchAssignments(), fetchStaff(), fetchJobs()]);
    setLoading(false);
  };

  const checkAuthorization = async (userId: string) => {
    const { data: adminRole } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    const { data: staffRole } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "staff",
    });

    return adminRole || staffRole;
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("job_assignments")
      .select(`
        *,
        jobs(title, job_number, scheduled_date, scheduled_time, location)
      `)
      .order("assigned_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch assignments");
      return;
    }

    if (data) {
      // Fetch staff names separately
      const staffIds = [...new Set(data.map(a => a.staff_id))];
      const { data: staffData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", staffIds);

      const staffMap = new Map(staffData?.map(s => [s.id, s.full_name]) || []);

      const enrichedData = data.map(assignment => ({
        ...assignment,
        profiles: { full_name: staffMap.get(assignment.staff_id) || "Unknown" }
      }));

      setAssignments(enrichedData);
    }
  };

  const fetchStaff = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "staff");

    if (!roles) return;

    const staffIds = roles.map(r => r.user_id);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", staffIds);

    setStaff(data || []);
  };

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("id, title, job_number, scheduled_date")
      .not("scheduled_date", "is", null)
      .order("scheduled_date", { ascending: true });

    setJobs(data || []);
  };

  const createAssignment = async () => {
    if (!newAssignment.job_id || !newAssignment.staff_id) {
      toast.error("Please select both job and staff member");
      return;
    }

    const { error } = await supabase.from("job_assignments").insert({
      job_id: newAssignment.job_id,
      staff_id: newAssignment.staff_id,
      role_on_job: newAssignment.role_on_job || null,
    });

    if (error) {
      toast.error("Failed to create assignment");
      return;
    }

    toast.success("Assignment created successfully");
    setDialogOpen(false);
    setNewAssignment({ job_id: "", staff_id: "", role_on_job: "" });
    fetchAssignments();
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase
      .from("job_assignments")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete assignment");
      return;
    }

    toast.success("Assignment removed");
    fetchAssignments();
  };

  const filteredAssignments = selectedDate
    ? assignments.filter(a => 
        a.jobs.scheduled_date === format(selectedDate, "yyyy-MM-dd")
      )
    : assignments;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-4xl font-bold">Staff Schedule & Roster</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Assign Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Staff Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Job</Label>
                  <Select value={newAssignment.job_id} onValueChange={(v) => setNewAssignment(prev => ({ ...prev, job_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.job_number} - {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Staff Member</Label>
                  <Select value={newAssignment.staff_id} onValueChange={(v) => setNewAssignment(prev => ({ ...prev, staff_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Role on Job</Label>
                  <Input
                    value={newAssignment.role_on_job}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, role_on_job: e.target.value }))}
                    placeholder="e.g. Team Leader, Technician"
                  />
                </div>
                <Button onClick={createAssignment} className="w-full">
                  Create Assignment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedDate ? `Assignments for ${format(selectedDate, "PPP")}` : "All Assignments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAssignments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No assignments for this date
                  </p>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{assignment.jobs.job_number}</Badge>
                          <span className="font-semibold">{assignment.jobs.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Staff: {assignment.profiles.full_name}
                          {assignment.role_on_job && ` (${assignment.role_on_job})`}
                        </p>
                        {assignment.jobs.scheduled_time && (
                          <p className="text-sm text-muted-foreground">
                            Time: {assignment.jobs.scheduled_time}
                          </p>
                        )}
                        {assignment.jobs.location && (
                          <p className="text-sm text-muted-foreground">
                            Location: {assignment.jobs.location}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAssignment(assignment.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
