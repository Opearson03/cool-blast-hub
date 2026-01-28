import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSendSubTradeInvite } from "@/hooks/useSubTradeInvites";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Send, 
  Phone, 
  Mail, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Calendar,
  MapPin,
  X
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ScheduleSubbieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedJobId?: string;
}

type Job = {
  id: string;
  name: string;
  site_address: string;
  job_number: string | null;
  job_type?: string;
  scheduled_date?: string | null;
};

type Pour = {
  id: string;
  pour_name: string;
  pour_date: string | null;
  job_id: string;
  job: Job;
};

type SelectedPour = {
  pourId: string;
  pourName: string;
  pourDate: string | null;
  jobId: string;
  jobName: string;
};

const ROLES = [
  { value: "Pump Operator", label: "Pump Operator" },
  { value: "Digger/Excavation", label: "Digger / Excavation" },
  { value: "Concrete Testing", label: "Concrete Testing" },
  { value: "Finisher", label: "Finisher" },
  { value: "Other", label: "Other" },
];

const formSchema = z
  .object({
    recipient_name: z.string().min(1, "Name is required").max(100),
    role: z.string().min(1, "Role is required"),
    custom_role: z.string().optional(),
    recipient_phone: z.string().optional(),
    recipient_email: z.string().email("Invalid email").optional().or(z.literal("")),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.recipient_phone || data.recipient_email,
    {
      message: "At least one contact method is required",
      path: ["recipient_phone"],
    }
  );

type FormData = z.infer<typeof formSchema>;

export function ScheduleSubbieDialog({ open, onOpenChange, preselectedJobId }: ScheduleSubbieDialogProps) {
  const [step, setStep] = useState<"select" | "details">("select");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedPours, setSelectedPours] = useState<SelectedPour[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  
  const sendInvite = useSendSubTradeInvite();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient_name: "",
      role: "",
      custom_role: "",
      recipient_phone: "",
      recipient_email: "",
      notes: "",
    },
  });

  // Fetch jobs with scheduled/in-progress pours (including misc jobs)
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-with-pours-for-subbie"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) return [];

      const { data, error } = await supabase
        .from("jobs")
        .select("id, name, site_address, job_number, job_type, scheduled_date")
        .eq("business_id", profile.business_id)
        .in("status", ["scheduled", "in_progress"])
        .order("name");

      if (error) throw error;
      return data as (Job & { job_type: string; scheduled_date: string | null })[];
    },
    enabled: open,
  });

  // Preselect job when provided
  useEffect(() => {
    if (preselectedJobId && open && jobs.length > 0) {
      const job = jobs.find(j => j.id === preselectedJobId);
      if (job && !selectedJob) {
        setSelectedJob(job);
      }
    }
  }, [preselectedJobId, open, jobs, selectedJob]);

  // Fetch pours for selected job (or create one for misc jobs)
  const { data: pours = [], isLoading: isLoadingPours } = useQuery({
    queryKey: ["pours-for-job", selectedJob?.id],
    queryFn: async () => {
      if (!selectedJob) return [];

      const { data, error } = await supabase
        .from("job_pours")
        .select("id, pour_name, pour_date, job_id")
        .eq("job_id", selectedJob.id)
        .in("status", ["scheduled", "in_progress"])
        .order("pour_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data.map(p => ({
        ...p,
        job: selectedJob
      })) as Pour[];
    },
    enabled: !!selectedJob,
  });

  const queryClient = useQueryClient();

  // Mutation to create a pour for misc jobs
  const createMiscPour = useMutation({
    mutationFn: async (job: Job) => {
      const pourName = job.scheduled_date 
        ? `Subbie Work - ${format(new Date(job.scheduled_date), "d MMM yyyy")}`
        : "Subbie Work";

      const { data, error } = await supabase
        .from("job_pours")
        .insert({
          job_id: job.id,
          pour_name: pourName,
          pour_date: job.scheduled_date || null,
          status: "scheduled",
          visit_type: "misc",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pours-for-job", selectedJob?.id] });
    },
  });

  // Filter jobs by search
  const filteredJobs = useMemo(() => {
    if (!jobSearch) return jobs;
    const search = jobSearch.toLowerCase();
    return jobs.filter(
      (job) =>
        job.name.toLowerCase().includes(search) ||
        job.site_address?.toLowerCase().includes(search) ||
        job.job_number?.toLowerCase().includes(search)
    );
  }, [jobs, jobSearch]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedJob(null);
      setSelectedPours([]);
      setJobSearch("");
      form.reset();
    }
  }, [open, form]);

  const handleJobSelect = async (job: Job) => {
    setSelectedJob(job);
    setJobSearch("");
    
    // For misc jobs, auto-create a pour if none exists
    if (job.job_type === "misc") {
      // Check if pour exists after query settles
      const { data: existingPours } = await supabase
        .from("job_pours")
        .select("id")
        .eq("job_id", job.id)
        .in("status", ["scheduled", "in_progress"]);
      
      if (!existingPours || existingPours.length === 0) {
        await createMiscPour.mutateAsync(job);
      }
    }
  };

  const handlePourToggle = (pour: Pour, checked: boolean) => {
    if (checked) {
      setSelectedPours((prev) => [
        ...prev,
        {
          pourId: pour.id,
          pourName: pour.pour_name,
          pourDate: pour.pour_date,
          jobId: pour.job.id,
          jobName: pour.job.name,
        },
      ]);
    } else {
      setSelectedPours((prev) => prev.filter((p) => p.pourId !== pour.id));
    }
  };

  const handleRemoveSelectedPour = (pourId: string) => {
    setSelectedPours((prev) => prev.filter((p) => p.pourId !== pourId));
  };

  const handleBackToJobs = () => {
    setSelectedJob(null);
  };

  const handleContinueToDetails = () => {
    if (selectedPours.length === 0) {
      toast.error("Please select at least one pour");
      return;
    }
    setStep("details");
  };

  const handleBackToSelection = () => {
    setStep("select");
  };

  const onSubmit = async (data: FormData) => {
    const role = data.role === "Other" && data.custom_role ? data.custom_role : data.role;

    try {
      // Send invites to all selected pours
      await Promise.all(
        selectedPours.map((pour) =>
          sendInvite.mutateAsync({
            job_pour_id: pour.pourId,
            recipient_name: data.recipient_name,
            role,
            recipient_phone: data.recipient_phone || undefined,
            recipient_email: data.recipient_email || undefined,
            notes: data.notes || undefined,
          })
        )
      );

      toast.success(
        selectedPours.length === 1
          ? "Invite sent successfully"
          : `${selectedPours.length} invites sent successfully`
      );
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invites");
    }
  };

  const watchRole = form.watch("role");

  // Check if a pour is already selected
  const isPourSelected = (pourId: string) => selectedPours.some((p) => p.pourId === pourId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Schedule a Subbie" : "Subbie Details"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Select jobs and pours to invite a subcontractor to"
              : `Sending invite to ${selectedPours.length} pour${selectedPours.length > 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Selected pours summary */}
            {selectedPours.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Selected ({selectedPours.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPours.map((pour) => (
                    <Badge
                      key={pour.pourId}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      <span className="truncate max-w-[150px]">
                        {pour.jobName} - {pour.pourName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedPour(pour.pourId)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Job selection / Pour selection */}
            {!selectedJob ? (
              <div className="flex-1 min-h-0 flex flex-col">
                <Command className="border rounded-lg flex-1 flex flex-col">
                  <CommandInput
                    placeholder="Search jobs..."
                    value={jobSearch}
                    onValueChange={setJobSearch}
                  />
                  <CommandList className="flex-1 max-h-[300px]">
                    <CommandEmpty>No jobs found.</CommandEmpty>
                    <CommandGroup heading="Active Jobs">
                      {filteredJobs.map((job) => (
                        <CommandItem
                          key={job.id}
                          value={job.id}
                          onSelect={() => handleJobSelect(job)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col gap-0.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{job.name}</span>
                              {job.job_type === "misc" && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-purple-500/20 text-purple-600 border-purple-500/30">
                                  Misc
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.site_address?.split(",")[0]}
                              {job.job_number && ` • ${job.job_number}`}
                              {job.job_type === "misc" && job.scheduled_date && (
                                <>
                                  {" • "}
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(job.scheduled_date), "d MMM")}
                                </>
                              )}
                            </span>
                          </div>
                          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col space-y-3">
                {/* Back button and job name - only show back button if no preselected job */}
                <div className="flex items-center gap-2">
                  {!preselectedJobId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToJobs}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Jobs
                    </Button>
                  )}
                  <span className="font-medium truncate">{selectedJob.name}</span>
                </div>

                {/* Pours list */}
                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {isLoadingPours || createMiscPour.isPending ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          {createMiscPour.isPending ? "Setting up..." : "Loading..."}
                        </span>
                      </div>
                    ) : pours.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No scheduled pours for this job
                      </p>
                    ) : (
                      pours.map((pour) => {
                        const isSelected = isPourSelected(pour.id);
                        return (
                          <label
                            key={pour.id}
                            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handlePourToggle(pour, checked as boolean)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {pour.pour_name}
                              </p>
                              {pour.pour_date && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(pour.pour_date), "EEE, d MMM yyyy")}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Continue button */}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleContinueToDetails}
                disabled={selectedPours.length === 0}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex-1 flex flex-col min-h-0 space-y-4"
            >
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recipient_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mike's Pumping" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[200]">
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchRole === "Other" && (
                    <FormField
                      control={form.control}
                      name="custom_role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specify Role</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Formwork" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recipient_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            Phone
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="0412 345 678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recipient_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contact@company.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    At least one contact method is required. SMS and/or email will be
                    sent based on what you provide.
                  </p>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Access instructions, timing, site constraints..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              <div className="flex justify-between pt-2 border-t">
                <Button type="button" variant="outline" onClick={handleBackToSelection}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={sendInvite.isPending}>
                  {sendInvite.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send {selectedPours.length > 1 ? `${selectedPours.length} Invites` : "Invite"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
