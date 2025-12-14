import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Briefcase, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  customers?: {
    contact_name: string;
    company_name: string | null;
  } | null;
};

type Booking = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  service_type: string;
  preferred_date: string | null;
  message: string | null;
};

export default function JobsManagement() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // New job form state
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
  }, [statusFilter]);

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

    setAuthorized(true);
    await Promise.all([fetchJobs(), fetchPendingBookings()]);
    setLoading(false);
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
      query = query.eq("status", statusFilter as "quoted" | "scheduled" | "in_progress" | "completed" | "cancelled" | "invoiced");
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

  const fetchPendingBookings = async () => {
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

  const convertBookingToJob = async (booking: Booking) => {
    if (!userId) return;

    try {
      // First create customer
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

      // Create job
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

      // Update booking status
      await supabase
        .from("bookings")
        .update({ status: "converted" })
        .eq("id", booking.id);

      toast({
        title: "Job Created",
        description: "Booking has been successfully converted to a job.",
      });

      setSelectedBooking(null);
      await Promise.all([fetchJobs(), fetchPendingBookings()]);
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

  const updateJobStatus = async (jobId: string, newStatus: "quoted" | "scheduled" | "in_progress" | "completed" | "cancelled" | "invoiced") => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
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
      case "quoted":
        return "bg-yellow-500";
      case "scheduled":
        return "bg-blue-500";
      case "in_progress":
        return "bg-purple-500";
      case "completed":
        return "bg-green-500";
      case "invoiced":
        return "bg-teal-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatJobType = (type: string) => {
    return type === "industrial" ? "Industrial" : "Retail";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {bookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Bookings</CardTitle>
                <CardDescription>Convert bookings into jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} Service
                          {booking.preferred_date && ` • ${format(new Date(booking.preferred_date), "MMM dd, yyyy")}`}
                        </p>
                      </div>
                      <Button onClick={() => convertBookingToJob(booking)}>
                        Convert to Job
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Jobs
                  </CardTitle>
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
                    <TableHead>Quote</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">
                          {job.job_number || "Pending"}
                        </TableCell>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>
                          {job.customers ? (
                            <div>
                              <p className="font-medium">{job.customers.contact_name}</p>
                              {job.customers.company_name && (
                                <p className="text-sm text-muted-foreground">{job.customers.company_name}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No customer</span>
                          )}
                        </TableCell>
                        <TableCell>{formatJobType(job.job_type)}</TableCell>
                        <TableCell>
                          {job.scheduled_date ? (
                            format(new Date(job.scheduled_date), "MMM dd, yyyy")
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.quoted_amount ? (
                            `$${job.quoted_amount.toFixed(2)}`
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={job.status}
                            onValueChange={(value) => updateJobStatus(job.id, value as any)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
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
        </div>
      </main>
    </div>
  );
}
