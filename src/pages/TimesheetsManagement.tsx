import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Timesheet = {
  id: string;
  staff_id: string;
  job_id: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  break_minutes: number;
  total_hours: number | null;
  notes: string | null;
  status: string;
  billable: boolean;
  hourly_rate: number | null;
  edit_request: string | null;
  profiles: {
    full_name: string;
  };
  jobs: {
    job_number: string;
    title: string;
  } | null;
};

type Job = {
  id: string;
  title: string;
  job_number: string;
};

export default function TimesheetsManagement() {
  const navigate = useNavigate();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | "all">("all");
  const [newTimesheet, setNewTimesheet] = useState({
    job_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "17:00",
    break_minutes: "30",
    notes: "",
    billable: true,
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, [filterStatus]);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);

    const { data: adminRole } = await supabase.rpc("has_role", {
      _user_id: session.user.id,
      _role: "admin",
    });

    setIsAdmin(!!adminRole);

    await Promise.all([fetchTimesheets(session.user.id, !!adminRole), fetchJobs()]);
    setLoading(false);
  };

  const fetchTimesheets = async (userId: string, isAdminUser: boolean) => {
    let query = supabase
      .from("timesheets")
      .select(`
        *,
        jobs(job_number, title)
      `)
      .order("date", { ascending: false });

    if (!isAdminUser) {
      query = query.eq("staff_id", userId);
    }

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus as "draft" | "submitted" | "approved" | "rejected");
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to fetch timesheets");
      return;
    }

    if (data) {
      // Fetch staff names separately
      const staffIds = [...new Set(data.map(t => t.staff_id))];
      const { data: staffData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", staffIds);

      const staffMap = new Map(staffData?.map(s => [s.id, s.full_name]) || []);

      const enrichedData = data.map(timesheet => ({
        ...timesheet,
        profiles: { full_name: staffMap.get(timesheet.staff_id) || "Unknown" }
      }));

      setTimesheets(enrichedData);
    }
  };

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("id, title, job_number")
      .order("created_at", { ascending: false });

    setJobs(data || []);
  };

  const calculateTotalHours = (startTime: string, endTime: string, breakMinutes: number) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;
    
    const totalMinutes = endInMinutes - startInMinutes - breakMinutes;
    return totalMinutes / 60;
  };

  const createTimesheet = async () => {
    if (!newTimesheet.date || !newTimesheet.start_time || !newTimesheet.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalHours = calculateTotalHours(
      newTimesheet.start_time,
      newTimesheet.end_time,
      parseInt(newTimesheet.break_minutes)
    );

    const { error } = await supabase.from("timesheets").insert({
      staff_id: currentUserId,
      job_id: newTimesheet.job_id || null,
      date: newTimesheet.date,
      start_time: newTimesheet.start_time,
      end_time: newTimesheet.end_time,
      break_minutes: parseInt(newTimesheet.break_minutes),
      total_hours: totalHours,
      notes: newTimesheet.notes || null,
      billable: newTimesheet.billable,
      status: "draft",
    });

    if (error) {
      toast.error("Failed to create timesheet");
      return;
    }

    toast.success("Timesheet created successfully");
    setDialogOpen(false);
    setNewTimesheet({
      job_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "17:00",
      break_minutes: "30",
      notes: "",
      billable: true,
    });
    fetchTimesheets(currentUserId, isAdmin);
  };

  const updateTimesheetStatus = async (id: string, newStatus: "draft" | "submitted" | "approved" | "rejected") => {
    const updateData: any = { status: newStatus };
    
    if (newStatus === "approved") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = currentUserId;
      // Clear edit request when approving
      updateData.edit_request = null;
    }

    const { error } = await supabase
      .from("timesheets")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update timesheet");
      return;
    }

    toast.success(`Timesheet ${newStatus}`);
    fetchTimesheets(currentUserId, isAdmin);
  };

  const clearEditRequest = async (id: string) => {
    const { error } = await supabase
      .from("timesheets")
      .update({ edit_request: null })
      .eq("id", id);

    if (error) {
      toast.error("Failed to clear edit request");
      return;
    }

    toast.success("Edit request cleared");
    fetchTimesheets(currentUserId, isAdmin);
  };

  const deleteTimesheet = async (id: string) => {
    const { error } = await supabase
      .from("timesheets")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete timesheet");
      return;
    }

    toast.success("Timesheet deleted");
    fetchTimesheets(currentUserId, isAdmin);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "submitted": return "bg-blue-500";
      case "approved": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

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
            <h1 className="text-4xl font-bold">Timesheets</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Timesheet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Timesheet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newTimesheet.date}
                    onChange={(e) => setNewTimesheet(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Job (Optional)</Label>
                  <Select value={newTimesheet.job_id} onValueChange={(v) => setNewTimesheet(prev => ({ ...prev, job_id: v }))}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newTimesheet.start_time}
                      onChange={(e) => setNewTimesheet(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newTimesheet.end_time}
                      onChange={(e) => setNewTimesheet(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Break (minutes)</Label>
                  <Input
                    type="number"
                    value={newTimesheet.break_minutes}
                    onChange={(e) => setNewTimesheet(prev => ({ ...prev, break_minutes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newTimesheet.notes}
                    onChange={(e) => setNewTimesheet(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>
                <Button onClick={createTimesheet} className="w-full">
                  Create Timesheet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Timesheets</CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Staff</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                      No timesheets found
                    </TableCell>
                  </TableRow>
                ) : (
                  timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                      {isAdmin && <TableCell>{timesheet.profiles.full_name}</TableCell>}
                      <TableCell>
                        {format(new Date(timesheet.date), "PPP")}
                        {timesheet.edit_request && (
                          <div className="flex items-center gap-1 mt-1 text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs font-medium">Edit requested</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {timesheet.jobs ? `${timesheet.jobs.job_number} - ${timesheet.jobs.title}` : "No job"}
                      </TableCell>
                      <TableCell>
                        {timesheet.end_time ? (
                          <>
                            {timesheet.total_hours?.toFixed(2)}h
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {timesheet.start_time} - {timesheet.end_time}
                            </span>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            In Progress
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(timesheet.status)}>
                          {timesheet.status}
                        </Badge>
                        {timesheet.edit_request && (
                          <div className="mt-2 text-xs text-muted-foreground max-w-xs">
                            <p className="font-medium text-amber-600">Edit Request:</p>
                            <p className="italic">{timesheet.edit_request}</p>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="link"
                                className="h-auto p-0 mt-1"
                                onClick={() => clearEditRequest(timesheet.id)}
                              >
                                Clear request
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isAdmin && timesheet.status === "submitted" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTimesheetStatus(timesheet.id, "approved")}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTimesheetStatus(timesheet.id, "rejected")}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {timesheet.status === "draft" && timesheet.end_time && (
                            <Button
                              size="sm"
                              onClick={() => updateTimesheetStatus(timesheet.id, "submitted")}
                            >
                              Submit
                            </Button>
                          )}
                          {(timesheet.status === "draft" || isAdmin) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteTimesheet(timesheet.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
