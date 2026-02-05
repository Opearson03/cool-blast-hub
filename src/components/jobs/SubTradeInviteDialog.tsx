import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSendSubTradeInvite } from "@/hooks/useSubTradeInvites";
import { useBusinessSubbies, type PastSubbie } from "@/hooks/useBusinessSubbies";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Phone, Mail, Users, UserPlus, Check, Search, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
    start_time: z.string().optional(),
  })
  .refine(
    (data) => data.recipient_phone || data.recipient_email,
    {
      message: "At least one contact method is required",
      path: ["recipient_phone"],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface SubTradeInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  pourId: string;
  pourName: string;
  pourDate: string | null;
  pourScheduledTime?: string | null;
}

export function SubTradeInviteDialog({
  open,
  onOpenChange,
  jobId,
  pourId,
  pourName,
  pourDate,
  pourScheduledTime,
}: SubTradeInviteDialogProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  const [selectedSubbie, setSelectedSubbie] = useState<PastSubbie | null>(null);
  const [subbieSearch, setSubbieSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [startTime, setStartTime] = useState("");
  
  const sendInvite = useSendSubTradeInvite();
  const { data: pastSubbies = [], isLoading: isLoadingSubbies } = useBusinessSubbies();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient_name: "",
      role: "",
      custom_role: "",
      recipient_phone: "",
      recipient_email: "",
      notes: "",
      start_time: pourScheduledTime?.slice(0, 5) || "",
    },
  });

  // Reset state when dialog closes, set default start time when opening
  useEffect(() => {
    if (!open) {
      setActiveTab("existing");
      setSelectedSubbie(null);
      setSubbieSearch("");
      setNotes("");
      setStartTime("");
      form.reset();
    } else {
      // Set default start time from pour's scheduled time
      const defaultTime = pourScheduledTime?.slice(0, 5) || "";
      setStartTime(defaultTime);
      form.setValue("start_time", defaultTime);
    }
  }, [open, form, pourScheduledTime]);

  // Filter subbies by search
  const filteredSubbies = pastSubbies.filter((subbie) => {
    if (!subbieSearch) return true;
    const search = subbieSearch.toLowerCase();
    return (
      subbie.recipient_name.toLowerCase().includes(search) ||
      subbie.role.toLowerCase().includes(search)
    );
  });

  const handleSelectSubbie = (subbie: PastSubbie) => {
    if (selectedSubbie?.recipient_name === subbie.recipient_name && 
        selectedSubbie?.role === subbie.role) {
      setSelectedSubbie(null);
    } else {
      setSelectedSubbie(subbie);
    }
  };

  const handleSendExistingSubbie = async () => {
    if (!selectedSubbie) {
      toast.error("Please select a subbie");
      return;
    }

    try {
      const result = await sendInvite.mutateAsync({
        job_pour_id: pourId,
        recipient_name: selectedSubbie.recipient_name,
        role: selectedSubbie.role,
        recipient_phone: selectedSubbie.recipient_phone || undefined,
        recipient_email: selectedSubbie.recipient_email || undefined,
        notes: notes || undefined,
        start_time: startTime || undefined,
      });

      // Show appropriate toast based on delivery results
      const smsOk = result.sms_status === "sent";
      const emailOk = result.email_status === "sent";
      const smsFailed = result.sms_status === "failed";
      const emailFailed = result.email_status === "failed";

      if (smsOk && emailOk) {
        toast.success("Invite sent via SMS and email");
      } else if (smsOk && !result.email_status) {
        toast.success("Invite sent via SMS");
      } else if (emailOk && !result.sms_status) {
        toast.success("Invite sent via email");
      } else if (emailOk && smsFailed) {
        toast.warning("Email sent, but SMS delivery failed", {
          description: "The contractor received the email but SMS could not be delivered."
        });
      } else if (smsOk && emailFailed) {
        toast.warning("SMS sent, but email delivery failed", {
          description: "The contractor received the SMS but email could not be delivered."
        });
      } else if (smsFailed && emailFailed) {
        toast.error("Delivery failed", {
          description: "Both SMS and email delivery failed. Please check the contact details."
        });
        return; // Keep dialog open so user can fix
      } else if (smsFailed) {
        toast.error("SMS delivery failed", {
          description: "Could not send SMS. Please check the phone number or use email instead."
        });
        return; // Keep dialog open
      } else if (emailFailed) {
        toast.error("Email delivery failed", {
          description: "Could not send email. Please check the email address."
        });
        return; // Keep dialog open
      } else {
        toast.success("Invite sent successfully");
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invite");
    }
  };

  const onSubmit = async (data: FormData) => {
    const role = data.role === "Other" && data.custom_role ? data.custom_role : data.role;

    try {
      const result = await sendInvite.mutateAsync({
        job_pour_id: pourId,
        recipient_name: data.recipient_name,
        role,
        recipient_phone: data.recipient_phone || undefined,
        recipient_email: data.recipient_email || undefined,
        notes: data.notes || undefined,
        start_time: data.start_time || undefined,
      });

      // Show appropriate toast based on delivery results
      const smsOk = result.sms_status === "sent";
      const emailOk = result.email_status === "sent";
      const smsFailed = result.sms_status === "failed";
      const emailFailed = result.email_status === "failed";

      if (smsOk && emailOk) {
        toast.success("Invite sent via SMS and email");
      } else if (smsOk && !result.email_status) {
        toast.success("Invite sent via SMS");
      } else if (emailOk && !result.sms_status) {
        toast.success("Invite sent via email");
      } else if (emailOk && smsFailed) {
        toast.warning("Email sent, but SMS delivery failed", {
          description: "The contractor received the email but SMS could not be delivered."
        });
      } else if (smsOk && emailFailed) {
        toast.warning("SMS sent, but email delivery failed", {
          description: "The contractor received the SMS but email could not be delivered."
        });
      } else if (smsFailed && emailFailed) {
        toast.error("Delivery failed", {
          description: "Both SMS and email delivery failed. Please check the contact details."
        });
        return; // Keep dialog open so user can fix
      } else if (smsFailed) {
        toast.error("SMS delivery failed", {
          description: "Could not send SMS. Please check the phone number or use email instead."
        });
        return; // Keep dialog open
      } else if (emailFailed) {
        toast.error("Email delivery failed", {
          description: "Could not send email. Please check the email address."
        });
        return; // Keep dialog open
      } else {
        toast.success("Invite sent successfully");
      }

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invite");
    }
  };

  const watchRole = form.watch("role");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Invite Sub-Trade</DialogTitle>
          <DialogDescription>
            For: {pourName}
            {pourDate && ` — ${format(new Date(pourDate), "EEE, d MMMM")}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "existing" | "new")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Previously Used</span>
              <span className="sm:hidden">Existing</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" />
              <span>New Sub-Contractor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="flex-1 flex flex-col min-h-0 space-y-3 mt-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sub-contractors..."
                value={subbieSearch}
                onChange={(e) => setSubbieSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Subbies list */}
            <ScrollArea className="flex-1 border rounded-lg max-h-[200px]">
              <div className="p-2 space-y-1">
                {isLoadingSubbies ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSubbies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {subbieSearch ? "No sub-contractors match your search" : "No previous sub-contractors found"}
                  </p>
                ) : (
                  filteredSubbies.map((subbie, idx) => {
                    const isSelected = selectedSubbie?.recipient_name === subbie.recipient_name && 
                                       selectedSubbie?.role === subbie.role;
                    return (
                      <button
                        key={`${subbie.recipient_name}-${subbie.role}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSubbie(subbie)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                          isSelected
                            ? "bg-primary/10 border-primary"
                            : "bg-background hover:bg-muted/50 border-border"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {subbie.recipient_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {subbie.recipient_phone || subbie.recipient_email || "No contact"}
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {subbie.role}
                        </Badge>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Start time for existing subbie */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Start Time (optional)
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Notes for existing subbie */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Access instructions, site constraints..."
                className="resize-none"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Send button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendExistingSubbie} 
                disabled={!selectedSubbie || sendInvite.isPending}
              >
                {sendInvite.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="new" className="flex-1 flex flex-col min-h-0 mt-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col space-y-4">
                <ScrollArea className="flex-1 pr-2">
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
                            <SelectContent>
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
                      At least one contact method is required. SMS and/or email will be sent based on what
                      you provide.
                    </p>

                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Start Time (optional)
                          </FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Access instructions, site constraints..."
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

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
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
                        Send Invite
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}