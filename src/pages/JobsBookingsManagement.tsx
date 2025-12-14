import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Filter, Phone, Mail, Calendar as CalendarIcon, MessageSquare, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { JobDetailsDialog } from "@/components/jobs/JobDetailsDialog";

type Booking = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  service_type: string;
  preferred_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

type Job = {
  id: string;
  job_number: string | null;
  title: string;
  job_type: string;
  status: string;
  customer_id: string | null;
  scheduled_date: string | null;
  quoted_amount: number | null;
  created_at: string;
  deposit_status?: string | null;
  deposit_required?: boolean;
  customers?: {
    contact_name: string;
    company_name: string | null;
  } | null;
};

export default function JobsBookingsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    jobType: "industrial" as "industrial" | "retail",
    location: "",
    quotedAmount: "",
    scheduledDate: "",
    specialRequirements: "",
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

    setUserId(session.user.id);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["admin", "staff"])
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

    await Promise.all([fetchBookings(), fetchJobs()]);
    setLoading(false);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
    } else {
      setBookings(data || []);
    }
  };

  const fetchJobs = async () => {
    let query = supabase
      .from("jobs")
      .select(`
        *,
        customers (
          contact_name,
          company_name
        )
      `)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as "quoted" | "scheduled" | "in_progress" | "completed" | "invoiced" | "cancelled");
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load jobs.",
        variant: "destructive",
      });
    } else {
      setJobs(data || []);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchJobs();
    }
  }, [statusFilter]);

  const convertBookingToJob = async (booking: Booking) => {
    if (!userId) return;

    try {
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert([{
          contact_name: booking.name,
          phone: booking.phone,
          email: booking.email,
          customer_type: booking.service_type === "automotive" ? "retail" : "industrial",
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      const { error: jobError } = await supabase
        .from("jobs")
        .insert([{
          title: `${booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} Service`,
          job_type: booking.service_type === "automotive" ? "retail" : "industrial",
          customer_id: customerData.id,
          booking_id: booking.id,
          scheduled_date: booking.preferred_date,
          description: booking.message,
          created_by: userId,
          status: "quoted",
        }]);

      if (jobError) throw jobError;

      await supabase
        .from("bookings")
        .update({ status: "converted" })
        .eq("id", booking.id);

      toast({
        title: "Job Created",
        description: "Booking has been successfully converted to a job.",
      });

      setSelectedBooking(null);
      await Promise.all([fetchBookings(), fetchJobs()]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createNewJob = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("jobs")
        .insert([{
          title: newJob.title,
          description: newJob.description,
          job_type: newJob.jobType,
          location: newJob.location || null,
          quoted_amount: newJob.quotedAmount ? parseFloat(newJob.quotedAmount) : null,
          scheduled_date: newJob.scheduledDate || null,
          special_requirements: newJob.specialRequirements || null,
          created_by: userId,
          status: "quoted",
        }]);

      if (error) throw error;

      toast({
        title: "Job Created",
        description: "New job has been created successfully.",
      });

      setShowCreateDialog(false);
      setNewJob({
        title: "",
        description: "",
        jobType: "industrial",
        location: "",
        quotedAmount: "",
        scheduledDate: "",
        specialRequirements: "",
      });
      await fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus as "quoted" | "scheduled" | "in_progress" | "completed" | "invoiced" | "cancelled" })
      .eq("id", jobId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update job status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status Updated",
        description: "Job status has been updated successfully.",
      });
      await fetchJobs();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "quoted": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "scheduled": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_progress": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "invoiced": return "bg-teal-500/10 text-teal-500 border-teal-500/20";
      case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted";
    }
  };

  const getDepositStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "paid": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "refunded": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "waived": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted";
    }
  };

  const scheduledJobs = jobs.filter(job => job.scheduled_date);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Jobs & Bookings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">Booking Requests ({bookings.length})</TabsTrigger>
            <TabsTrigger value="calendar">Jobs Calendar</TabsTrigger>
            <TabsTrigger value="jobs">All Jobs ({jobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Pending Bookings</h3>
                <p className="text-muted-foreground">All booking requests have been processed</p>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{booking.name}</h3>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.service_type}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {booking.phone}
                          </div>
                          {booking.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {booking.email}
                            </div>
                          )}
                          {booking.preferred_date && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(booking.preferred_date), "MMM dd, yyyy")}
                            </div>
                          )}
                        </div>
                        {booking.message && (
                          <p className="mt-2 text-sm bg-muted p-3 rounded-md">{booking.message}</p>
                        )}
                      </div>
                      <Button onClick={() => convertBookingToJob(booking)}>
                        Convert to Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
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
                    {selectedDate ? `Jobs for ${format(selectedDate, "PPP")}` : "Scheduled Jobs"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scheduledJobs
                      .filter(job => !selectedDate || job.scheduled_date === format(selectedDate, "yyyy-MM-dd"))
                      .map((job) => (
                        <div key={job.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{job.job_number}</Badge>
                            <span className="font-semibold">{job.title}</span>
                            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                          </div>
                          {job.customers && (
                            <p className="text-sm text-muted-foreground">
                              Customer: {job.customers.contact_name}
                            </p>
                          )}
                        </div>
                      ))}
                    {scheduledJobs.filter(job => !selectedDate || job.scheduled_date === format(selectedDate, "yyyy-MM-dd")).length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No jobs scheduled for this date</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Jobs</CardTitle>
                    <CardDescription>Manage and track all jobs</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="invoiced">Invoiced</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          New Job
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Job</DialogTitle>
                          <DialogDescription>Add a new job to the system</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input
                              id="title"
                              value={newJob.title}
                              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                              placeholder="e.g., Factory Equipment Cleaning"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="jobType">Job Type *</Label>
                            <Select
                              value={newJob.jobType}
                              onValueChange={(value: "industrial" | "retail") => setNewJob({ ...newJob, jobType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="industrial">Industrial</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={newJob.description}
                              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                              placeholder="Job details..."
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="location">Location</Label>
                              <Input
                                id="location"
                                value={newJob.location}
                                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                                placeholder="Job site address"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="quotedAmount">Quoted Amount ($)</Label>
                              <Input
                                id="quotedAmount"
                                type="number"
                                value={newJob.quotedAmount}
                                onChange={(e) => setNewJob({ ...newJob, quotedAmount: e.target.value })}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="scheduledDate">Scheduled Date</Label>
                            <Input
                              id="scheduledDate"
                              type="date"
                              value={newJob.scheduledDate}
                              onChange={(e) => setNewJob({ ...newJob, scheduledDate: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="specialRequirements">Special Requirements</Label>
                            <Textarea
                              id="specialRequirements"
                              value={newJob.specialRequirements}
                              onChange={(e) => setNewJob({ ...newJob, specialRequirements: e.target.value })}
                              placeholder="Safety requirements, access restrictions, etc."
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={createNewJob} disabled={!newJob.title}>
                              Create Job
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Quote</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No jobs found
                        </TableCell>
                      </TableRow>
                     ) : (
                      jobs.map((job) => (
                        <TableRow 
                          key={job.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setJobDetailsOpen(true);
                          }}
                        >
                          <TableCell className="font-medium">{job.job_number || "N/A"}</TableCell>
                          <TableCell>{job.title}</TableCell>
                          <TableCell>
                            {job.customers ? (
                              <div>
                                <div className="font-medium">{job.customers.contact_name}</div>
                                {job.customers.company_name && (
                                  <div className="text-xs text-muted-foreground">{job.customers.company_name}</div>
                                )}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{job.job_type}</TableCell>
                          <TableCell>
                            {job.scheduled_date ? format(new Date(job.scheduled_date), "MMM dd, yyyy") : "Not scheduled"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {job.job_type === "retail" && job.deposit_required ? (
                              <Badge className={getDepositStatusColor(job.deposit_status || "not_required")}>
                                {job.deposit_status === "paid" ? "✓ Paid" : 
                                 job.deposit_status === "pending" ? "⏳ Pending" :
                                 job.deposit_status === "refunded" ? "↩ Refunded" :
                                 job.deposit_status === "waived" ? "~ Waived" : "N/A"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {job.quoted_amount ? `$${job.quoted_amount.toFixed(2)}` : "N/A"}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={job.status}
                              onValueChange={(value: "quoted" | "scheduled" | "in_progress" | "completed" | "invoiced" | "cancelled") => updateJobStatus(job.id, value)}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="quoted">Quoted</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="invoiced">Invoiced</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Job Details Dialog */}
      <JobDetailsDialog
        jobId={selectedJobId}
        open={jobDetailsOpen}
        onOpenChange={setJobDetailsOpen}
        onUpdate={fetchJobs}
      />
    </div>
  );
}
