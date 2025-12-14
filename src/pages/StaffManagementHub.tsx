import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Users, UserPlus, Loader2, Eye, Shield, FileText } from "lucide-react";
import { format } from "date-fns";
import { SWMSBuilder } from "@/components/safety/SWMSBuilder";
import { SWMSViewer } from "@/components/safety/SWMSViewer";
import { SWMSManagementTab } from "@/components/safety/SWMSManagementTab";

export default function StaffManagementHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Staff invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  
  // Schedule state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    job_id: "",
    staff_id: "",
    role_on_job: "",
  });
  
  // Timesheets state
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [timesheetFilter, setTimesheetFilter] = useState<string>("all");
  
  // SWMS state
  const [swmsDocuments, setSwmsDocuments] = useState<any[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedSwms, setSelectedSwms] = useState<any>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/admin");
      return;
    }

    setIsAdmin(true);
    await Promise.all([
      fetchInvites(),
      fetchStaff(),
      fetchJobs(),
      fetchAssignments(),
      fetchTimesheets(),
      fetchSWMSDocuments()
    ]);
    setLoading(false);
  };

  const fetchInvites = async () => {
    const { data, error } = await supabase
      .from("pending_invites")
      .select("*")
      .order("invited_at", { ascending: false });

    if (!error) setInvites(data || []);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("pending_invites")
        .insert([{
          email: inviteEmail,
          full_name: inviteFullName,
          role: inviteRole,
          invited_by: session.user.id,
        }]);

      if (error) throw error;

      toast({
        title: "Invite sent!",
        description: `An invitation has been sent to ${inviteEmail}`,
      });

      setInviteEmail("");
      setInviteFullName("");
      setInviteRole("staff");
      await fetchInvites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setInviting(false);
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

  const fetchAssignments = async () => {
    const { data } = await supabase
      .from("job_assignments")
      .select(`
        *,
        jobs(title, job_number, scheduled_date, scheduled_time, location)
      `)
      .order("assigned_at", { ascending: false });

    if (data) {
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

  const createAssignment = async () => {
    if (!newAssignment.job_id || !newAssignment.staff_id) {
      toast({
        title: "Error",
        description: "Please select both job and staff member",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("job_assignments").insert({
      job_id: newAssignment.job_id,
      staff_id: newAssignment.staff_id,
      role_on_job: newAssignment.role_on_job || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Assignment created successfully" });
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
      toast({ title: "Error", description: "Failed to delete assignment", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Assignment removed" });
    fetchAssignments();
  };

  const fetchTimesheets = async () => {
    let query = supabase
      .from("timesheets")
      .select("*")
      .order("date", { ascending: false });

    if (timesheetFilter !== "all") {
      query = query.eq("status", timesheetFilter as "draft" | "submitted" | "approved" | "rejected");
    }

    const { data, error } = await query;

    if (!error && data) {
      const staffIds = [...new Set(data.map(t => t.staff_id))];
      const { data: staffData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", staffIds);

      const staffMap = new Map(staffData?.map(s => [s.id, s.full_name]) || []);
      const enrichedData = data.map(timesheet => ({
        ...timesheet,
        staff_name: staffMap.get(timesheet.staff_id) || "Unknown"
      }));

      setTimesheets(enrichedData);
    }
  };

  useEffect(() => {
    if (!loading) fetchTimesheets();
  }, [timesheetFilter]);

  const updateTimesheetStatus = async (id: string, status: "draft" | "submitted" | "approved" | "rejected") => {
    const { error } = await supabase
      .from("timesheets")
      .update({ 
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        approved_by: status === "approved" ? (await supabase.auth.getSession()).data.session?.user.id : null
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update timesheet", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Timesheet updated" });
      fetchTimesheets();
    }
  };

  const clearEditRequest = async (id: string) => {
    const { error } = await supabase
      .from("timesheets")
      .update({ edit_request: null })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to clear edit request", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Edit request cleared" });
      fetchTimesheets();
    }
  };

  const fetchSWMSDocuments = async () => {
    const { data, error } = await supabase
      .from("swms_documents")
      .select(`
        *,
        jobs(job_number, title)
      `)
      .order("created_at", { ascending: false });

    if (!error) setSwmsDocuments(data || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "draft": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "submitted": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "approved": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-muted";
    }
  };

  const filteredAssignments = selectedDate
    ? assignments.filter(a => 
        a.jobs.scheduled_date === format(selectedDate, "yyyy-MM-dd")
      )
    : assignments;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Staff Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
            <TabsTrigger value="safety">Safety Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Invite New Staff
                  </CardTitle>
                  <CardDescription>Send an invitation to a new team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={inviteFullName}
                        onChange={(e) => setInviteFullName(e.target.value)}
                        required
                        disabled={inviting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        disabled={inviting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value: "admin" | "staff") => setInviteRole(value)}
                        disabled={inviting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={inviting}>
                      {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Invitation
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Members & Invitations</CardTitle>
                  <CardDescription>View all staff invitations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>{invite.full_name}</TableCell>
                          <TableCell>{invite.email}</TableCell>
                          <TableCell className="capitalize">{invite.role}</TableCell>
                          <TableCell>
                            {invite.accepted_at ? (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Accepted</Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Staff Schedule & Roster</h2>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <div className="space-y-3">
                    {filteredAssignments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No assignments for this date</p>
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
          </TabsContent>

          <TabsContent value="timesheets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Staff Timesheets</CardTitle>
                    <CardDescription>Review and approve staff timesheets</CardDescription>
                  </div>
                  <Select value={timesheetFilter} onValueChange={setTimesheetFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
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
                      <TableHead>Staff</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No timesheets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      timesheets.map((timesheet) => (
                        <TableRow key={timesheet.id}>
                          <TableCell>{timesheet.staff_name}</TableCell>
                          <TableCell>{format(new Date(timesheet.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{timesheet.total_hours || "0.0"}h</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getStatusColor(timesheet.status)}>
                                {timesheet.status}
                              </Badge>
                              {timesheet.edit_request && (
                                <p className="text-xs text-muted-foreground">Edit: {timesheet.edit_request}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {timesheet.status === "submitted" && (
                                <>
                                  <Button size="sm" onClick={() => updateTimesheetStatus(timesheet.id, "approved")}>
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => updateTimesheetStatus(timesheet.id, "rejected")}>
                                    Reject
                                  </Button>
                                </>
                              )}
                              {timesheet.edit_request && (
                                <Button size="sm" variant="outline" onClick={() => clearEditRequest(timesheet.id)}>
                                  Clear Edit
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
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <SWMSManagementTab 
              onCreateNew={() => setBuilderOpen(true)}
              onRefresh={fetchSWMSDocuments}
              onViewSwms={(swms) => { setSelectedSwms(swms); setViewerOpen(true); }}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create NSW-Compliant SWMS</DialogTitle>
            </DialogHeader>
            <SWMSBuilder onClose={() => { setBuilderOpen(false); fetchSWMSDocuments(); }} />
          </DialogContent>
        </Dialog>

        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>SWMS Document</DialogTitle>
            </DialogHeader>
            {selectedSwms && <SWMSViewer swmsId={selectedSwms.id} />}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
