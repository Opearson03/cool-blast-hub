import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Users, DollarSign, MapPin, Save, X } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface JobDetailsDialogProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function JobDetailsDialog({ jobId, open, onOpenChange, onUpdate }: JobDetailsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState<any>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [depositPaidDate, setDepositPaidDate] = useState<Date | undefined>();

  useEffect(() => {
    if (open && jobId) {
      fetchJobDetails();
      fetchStaffMembers();
    }
  }, [open, jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    setLoading(true);
    
    // Fetch job with customer data
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        customers (
          id,
          contact_name,
          company_name,
          email,
          phone
        )
      `)
      .eq("id", jobId)
      .single();

    if (jobError) {
      console.error("Job fetch error:", jobError);
      toast({ title: "Error", description: "Failed to load job details", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch job assignments separately
    const { data: assignments } = await supabase
      .from("job_assignments")
      .select("staff_id")
      .eq("job_id", jobId);

    setJobData(job);
    setAssignedStaff(assignments?.map((a: any) => a.staff_id) || []);
    if (job.scheduled_date) {
      setScheduledDate(new Date(job.scheduled_date));
    }
    if (job.scheduled_time) {
      setScheduledTime(job.scheduled_time);
    }
    if (job.deposit_paid_date) {
      setDepositPaidDate(new Date(job.deposit_paid_date));
    }
    setLoading(false);
  };

  const fetchStaffMembers = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "staff");

    if (!roles) return;

    const staffIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", staffIds);

    setStaffMembers(profiles || []);
  };

  const handleSave = async () => {
    if (!jobId || !jobData) return;

    try {
      // Update job details
      const { error: jobError } = await supabase
        .from("jobs")
        .update({
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          status: jobData.status,
          quoted_amount: jobData.quoted_amount,
          scheduled_date: scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : null,
          scheduled_time: scheduledTime || null,
          special_requirements: jobData.special_requirements,
          deposit_required: jobData.deposit_required,
          deposit_amount: jobData.deposit_amount,
          deposit_percentage: jobData.deposit_percentage,
          deposit_status: jobData.deposit_status,
          deposit_payment_method: jobData.deposit_payment_method,
          deposit_reference: jobData.deposit_reference,
          deposit_notes: jobData.deposit_notes,
          deposit_paid_date: depositPaidDate ? format(depositPaidDate, "yyyy-MM-dd") : null,
        })
        .eq("id", jobId);

      if (jobError) throw jobError;

      // Update staff assignments
      // First, delete existing assignments
      await supabase
        .from("job_assignments")
        .delete()
        .eq("job_id", jobId);

      // Then add new assignments
      if (assignedStaff.length > 0) {
        const { data: session } = await supabase.auth.getSession();
        const assignments = assignedStaff.map(staffId => ({
          job_id: jobId,
          staff_id: staffId,
          assigned_by: session.session?.user.id,
        }));

        const { error: assignError } = await supabase
          .from("job_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }

      toast({ title: "Success", description: "Job updated successfully" });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const calculateDepositAmount = () => {
    if (jobData?.deposit_percentage && jobData?.quoted_amount) {
      return (jobData.quoted_amount * jobData.deposit_percentage / 100).toFixed(2);
    }
    return jobData?.deposit_amount?.toFixed(2) || "0.00";
  };

  if (!jobId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Job Details
            {jobData && (
              <Badge className={getStatusColor(jobData.status)}>
                {jobData.status.toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">Loading...</div>
        ) : jobData ? (
          <div className="space-y-6">
            {/* Job Number */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Job Number:</span>
              <Badge variant="outline">{jobData.job_number}</Badge>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={jobData.title}
                  onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={jobData.description || ""}
                  onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-2" />
                  <Input
                    id="location"
                    value={jobData.location || ""}
                    onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Info */}
            {jobData.customers && (
              <div className="space-y-2">
                <h3 className="font-semibold">Customer Information</h3>
                <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {jobData.customers.contact_name}</p>
                  {jobData.customers.company_name && (
                    <p><span className="font-medium">Company:</span> {jobData.customers.company_name}</p>
                  )}
                  {jobData.customers.email && (
                    <p><span className="font-medium">Email:</span> {jobData.customers.email}</p>
                  )}
                  {jobData.customers.phone && (
                    <p><span className="font-medium">Phone:</span> {jobData.customers.phone}</p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Status & Pricing */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={jobData.status}
                  onValueChange={(value) => setJobData({ ...jobData, status: value })}
                >
                  <SelectTrigger>
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quoted_amount">Quoted Amount</Label>
                <div className="flex gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-2" />
                  <Input
                    id="quoted_amount"
                    type="number"
                    step="0.01"
                    value={jobData.quoted_amount || ""}
                    onChange={(e) => setJobData({ ...jobData, quoted_amount: parseFloat(e.target.value) || null })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Scheduling */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Scheduling
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="scheduled_time">Time</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Staff Assignment */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Staff
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-4">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`staff-${staff.id}`}
                      checked={assignedStaff.includes(staff.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAssignedStaff([...assignedStaff, staff.id]);
                        } else {
                          setAssignedStaff(assignedStaff.filter(id => id !== staff.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`staff-${staff.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {staff.full_name}
                    </label>
                  </div>
                ))}
                {staffMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No staff members available
                  </p>
                )}
              </div>
            </div>

            {/* Special Requirements */}
            <div className="grid gap-2">
              <Label htmlFor="special_requirements">Special Requirements</Label>
              <Textarea
                id="special_requirements"
                value={jobData.special_requirements || ""}
                onChange={(e) => setJobData({ ...jobData, special_requirements: e.target.value })}
                rows={2}
                placeholder="Any special requirements or notes..."
              />
            </div>

            <Separator />

            {/* Deposit Section */}
            {jobData.job_type === "retail" && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Deposit
                  </h3>
                  {jobData.deposit_status && jobData.deposit_status !== "not_required" && (
                    <Badge className={getDepositStatusColor(jobData.deposit_status)}>
                      {jobData.deposit_status.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {/* Deposit Required Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deposit_required"
                    checked={jobData.deposit_required || false}
                    onCheckedChange={(checked) => {
                      setJobData({ 
                        ...jobData, 
                        deposit_required: checked as boolean,
                        deposit_status: checked ? "pending" : "not_required"
                      });
                    }}
                  />
                  <Label htmlFor="deposit_required" className="cursor-pointer">
                    Deposit Required
                  </Label>
                </div>

                {jobData.deposit_required && (
                  <>
                    {/* Amount or Percentage */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="deposit_amount">Deposit Amount ($)</Label>
                        <Input
                          id="deposit_amount"
                          type="number"
                          step="0.01"
                          value={jobData.deposit_amount || ""}
                          onChange={(e) => setJobData({ 
                            ...jobData, 
                            deposit_amount: parseFloat(e.target.value) || null,
                            deposit_percentage: null
                          })}
                          placeholder="0.00"
                          disabled={!!jobData.deposit_percentage}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="deposit_percentage">Or Percentage (%)</Label>
                        <Input
                          id="deposit_percentage"
                          type="number"
                          step="0.01"
                          max="100"
                          value={jobData.deposit_percentage || ""}
                          onChange={(e) => setJobData({ 
                            ...jobData, 
                            deposit_percentage: parseFloat(e.target.value) || null,
                            deposit_amount: null
                          })}
                          placeholder="0"
                          disabled={!!jobData.deposit_amount}
                        />
                      </div>
                    </div>

                    {/* Calculated Amount Display */}
                    {(jobData.deposit_amount || jobData.deposit_percentage) && (
                      <div className="bg-background p-3 rounded-md">
                        <p className="text-sm font-medium">
                          Deposit Amount: <span className="text-lg text-primary">${calculateDepositAmount()}</span>
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Payment Details */}
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="deposit_status">Deposit Status</Label>
                          <Select
                            value={jobData.deposit_status}
                            onValueChange={(value) => setJobData({ ...jobData, deposit_status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                              <SelectItem value="waived">Waived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="deposit_payment_method">Payment Method</Label>
                          <Select
                            value={jobData.deposit_payment_method || ""}
                            onValueChange={(value) => setJobData({ ...jobData, deposit_payment_method: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="eftpos">EFTPOS</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Date Paid</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "justify-start text-left font-normal",
                                  !depositPaidDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {depositPaidDate ? format(depositPaidDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={depositPaidDate}
                                onSelect={setDepositPaidDate}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="deposit_reference">Payment Reference</Label>
                          <Input
                            id="deposit_reference"
                            value={jobData.deposit_reference || ""}
                            onChange={(e) => setJobData({ ...jobData, deposit_reference: e.target.value })}
                            placeholder="Receipt #, Transaction ID, etc."
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="deposit_notes">Deposit Notes</Label>
                        <Textarea
                          id="deposit_notes"
                          value={jobData.deposit_notes || ""}
                          onChange={(e) => setJobData({ ...jobData, deposit_notes: e.target.value })}
                          rows={2}
                          placeholder="Additional notes about the deposit..."
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Stripe Section (Coming Soon) */}
                    <div className="bg-muted p-4 rounded-lg border-2 border-dashed opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-1">
                            🔗 Stripe Payment Links
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Automatically generate payment links for customers
                          </p>
                        </div>
                        <Button disabled size="sm">
                          Generate Link
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Coming soon - Enable Stripe integration to accept online payments
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Failed to load job details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}