import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Coffee, Clock, CheckCircle, XCircle, FileText, AlertTriangle, Edit } from "lucide-react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { format, differenceInMinutes } from "date-fns";

interface Timesheet {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  break_minutes: number | null;
  total_hours: number | null;
  notes: string | null;
  status: string;
  edit_request: string | null;
  job_id: string | null;
  jobs: {
    title: string;
    job_number: string | null;
  } | null;
}

export default function StaffTimesheets() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [activeShift, setActiveShift] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [editRequestDialog, setEditRequestDialog] = useState<string | null>(null);
  const [editRequestNote, setEditRequestNote] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTimesheets();
    fetchRecentJobs();
    
    // Update current time every second for live timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRecentJobs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("job_assignments")
      .select(`
        jobs (
          id,
          title,
          job_number
        )
      `)
      .eq("staff_id", session.user.id)
      .limit(20);

    if (data) {
      setJobs(data.map((d) => d.jobs).filter(Boolean));
    }
  };

  const fetchTimesheets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("timesheets")
      .select(`
        *,
        jobs (
          title,
          job_number
        )
      `)
      .eq("staff_id", session.user.id)
      .order("date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(30);

    if (!error && data) {
      const active = data.find(t => t.end_time === null && t.status === "draft");
      setActiveShift(active || null);
      setTimesheets(data.filter(t => t.end_time !== null) as Timesheet[]);
    }
    setLoading(false);
  };

  const calculateHours = (start: string, end: string, breakMins: number) => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin) - breakMins;
    return Math.max(0, totalMinutes / 60);
  };

  const calculateLiveDuration = () => {
    if (!activeShift) return "0h 0m";
    
    const today = format(new Date(), "yyyy-MM-dd");
    const startDateTime = new Date(`${today}T${activeShift.start_time}`);
    const minutes = differenceInMinutes(currentTime, startDateTime) - (activeShift.break_minutes || 0);
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleStartShift = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const now = new Date();
    const { error } = await supabase.from("timesheets").insert({
      staff_id: session.user.id,
      date: format(now, "yyyy-MM-dd"),
      start_time: format(now, "HH:mm:ss"),
      end_time: null,
      status: "draft",
      job_id: selectedJobId || null,
      break_minutes: 0,
      billable: true,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start shift",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Shift Started",
        description: "Your shift has been clocked in",
      });
      fetchTimesheets();
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;

    const now = new Date();
    const endTime = format(now, "HH:mm:ss");
    const totalHours = calculateHours(activeShift.start_time, endTime, activeShift.break_minutes || 0);

    const { error } = await supabase
      .from("timesheets")
      .update({
        end_time: endTime,
        total_hours: totalHours,
        status: "submitted", // Auto-submit
      })
      .eq("id", activeShift.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to end shift",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Shift Ended",
        description: "Your timesheet has been submitted for approval",
      });
      setActiveShift(null);
      fetchTimesheets();
    }
  };

  const handleAddBreak = async (minutes: number) => {
    if (!activeShift) return;

    const newBreakTotal = (activeShift.break_minutes || 0) + minutes;
    const { error } = await supabase
      .from("timesheets")
      .update({ break_minutes: newBreakTotal })
      .eq("id", activeShift.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add break",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Break Added",
        description: `${minutes} minute break added`,
      });
      fetchTimesheets();
    }
  };

  const handleUpdateJob = async (jobId: string) => {
    if (!activeShift) return;

    const { error } = await supabase
      .from("timesheets")
      .update({ job_id: jobId || null })
      .eq("id", activeShift.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Job Updated",
        description: "Job assigned to current shift",
      });
      fetchTimesheets();
    }
  };

  const handleRequestEdit = async (timesheetId: string) => {
    if (!editRequestNote.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the edit request",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("timesheets")
      .update({ edit_request: editRequestNote })
      .eq("id", timesheetId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit edit request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Submitted",
        description: "Your edit request has been sent to admin",
      });
      setEditRequestDialog(null);
      setEditRequestNote("");
      fetchTimesheets();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      draft: { variant: "secondary", icon: FileText, label: "Draft" },
      submitted: { variant: "default", icon: Clock, label: "Submitted" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Timesheets</h1>
          <p className="text-muted-foreground mt-1">
            Clock in/out and track your work hours
          </p>
        </div>

        {activeShift ? (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <CardTitle>Currently On Shift</CardTitle>
              </div>
              <CardDescription>Started at {activeShift.start_time}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-primary">
                {calculateLiveDuration()}
              </div>
              <div className="text-sm text-muted-foreground">
                Break: {activeShift.break_minutes || 0} minutes
              </div>

              <div>
                <Label>Job (Optional)</Label>
                <select
                  value={activeShift.job_id || ""}
                  onChange={(e) => handleUpdateJob(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">No job selected</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_number ? `${job.job_number} - ` : ""}{job.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddBreak(15)}
                  className="flex-1"
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  Add Break (15 min)
                </Button>
                <Button
                  onClick={handleEndShift}
                  className="flex-1"
                >
                  <Square className="mr-2 h-4 w-4" />
                  End Shift
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>You're not currently on shift</CardTitle>
              <CardDescription>Start a new shift to begin tracking your time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Job (Optional)</Label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">No job selected</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_number ? `${job.job_number} - ` : ""}{job.title}
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={handleStartShift} className="w-full" size="lg">
                <Play className="mr-2 h-5 w-5" />
                Start Shift
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">Shift History</h2>
          {timesheets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No completed shifts yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {timesheets.map((timesheet) => (
                <Card key={timesheet.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {format(new Date(timesheet.date), "EEEE, MMMM d, yyyy")}
                        </CardTitle>
                        {timesheet.jobs && (
                          <CardDescription>
                            {timesheet.jobs.job_number && `${timesheet.jobs.job_number} - `}
                            {timesheet.jobs.title}
                          </CardDescription>
                        )}
                      </div>
                      {getStatusBadge(timesheet.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start</p>
                        <p className="font-medium">{timesheet.start_time}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End</p>
                        <p className="font-medium">{timesheet.end_time}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Break</p>
                        <p className="font-medium">{timesheet.break_minutes || 0} min</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Hours</p>
                        <p className="font-medium text-lg">{timesheet.total_hours?.toFixed(2)}h</p>
                      </div>
                    </div>
                    {timesheet.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{timesheet.notes}</p>
                      </div>
                    )}
                    {timesheet.edit_request && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-600">Edit Requested:</p>
                            <p className="text-muted-foreground">{timesheet.edit_request}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {(timesheet.status === "submitted" || timesheet.status === "approved") && !timesheet.edit_request && (
                      <div className="mt-4 flex gap-2">
                        <Dialog
                          open={editRequestDialog === timesheet.id}
                          onOpenChange={(open) => {
                            setEditRequestDialog(open ? timesheet.id : null);
                            if (!open) setEditRequestNote("");
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Edit className="mr-2 h-4 w-4" />
                              Request Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Request Timesheet Edit</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Reason for edit request *</Label>
                                <Textarea
                                  value={editRequestNote}
                                  onChange={(e) => setEditRequestNote(e.target.value)}
                                  placeholder="e.g., Wrong end time - actually finished at 5:30pm not 5:00pm"
                                  className="mt-1"
                                  rows={4}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditRequestDialog(null);
                                    setEditRequestNote("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={() => handleRequestEdit(timesheet.id)}>
                                  Submit Request
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
