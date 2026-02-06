import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, X, Plus, Search, UserPlus, Bell, Mail, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBusinessSubbies, PastSubbie } from "@/hooks/useBusinessSubbies";
import { useSendSubTradeInvite } from "@/hooks/useSubTradeInvites";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface MiscJobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedSubbie {
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  role: string;
  isNew?: boolean;
}

export function MiscJobFormDialog({ open, onOpenChange }: MiscJobFormDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [selectedSubbies, setSelectedSubbies] = useState<SelectedSubbie[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSubbieName, setNewSubbieName] = useState("");
  const [newSubbiePhone, setNewSubbiePhone] = useState("");
  const [newSubbieRole, setNewSubbieRole] = useState("");

  // Notify client state
  const [notifyClient, setNotifyClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [sendVia, setSendVia] = useState<"sms" | "email" | "both">("sms");

  const { data: pastSubbies = [], isLoading: subbiesLoading } = useBusinessSubbies();
  const sendInvite = useSendSubTradeInvite();
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      // Create the misc job
      const { data: job, error: jobError } = await supabase.from("jobs").insert({
        name,
        site_address: address,
        scheduled_date: date ? format(date, "yyyy-MM-dd") : null,
        job_notes: notes || null,
        job_type: "misc",
        status: "scheduled",
        business_id: profile.business_id,
        created_by: user.id,
      }).select().single();

      if (jobError) throw jobError;

      // If there are subbies to invite and we have a date, create a pour and send invites
      if (selectedSubbies.length > 0 && date) {
        // Create a pour for the misc job
        const { data: pour, error: pourError } = await supabase.from("job_pours").insert({
          job_id: job.id,
          pour_name: name,
          pour_date: format(date, "yyyy-MM-dd"),
          visit_type: "misc",
          status: "scheduled",
        }).select().single();

        if (pourError) throw pourError;

        return { job, pour };
      }

      return { job, pour: null };
    },
    onSuccess: async (result) => {
      let toastMessages: string[] = [];

      // Send invites to sub-contractors after job/pour is created
      if (result.pour && selectedSubbies.length > 0) {
        setIsSendingInvites(true);
        let sentCount = 0;
        
        for (const subbie of selectedSubbies) {
          if (subbie.recipient_phone || subbie.recipient_email) {
            try {
              await sendInvite.mutateAsync({
                job_pour_id: result.pour.id,
                recipient_name: subbie.recipient_name,
                role: subbie.role,
                recipient_phone: subbie.recipient_phone || undefined,
                recipient_email: subbie.recipient_email || undefined,
              });
              sentCount++;
            } catch (error) {
              console.error("Failed to send invite to", subbie.recipient_name, error);
            }
          }
        }
        
        setIsSendingInvites(false);
        
        if (sentCount > 0) {
          toastMessages.push(`${sentCount} subbie invite(s) sent`);
        }
      }

      // Send client notification if enabled
      if (notifyClient && clientName.trim()) {
        const canSendSms = (sendVia === "sms" || sendVia === "both") && clientPhone.trim();
        const canSendEmail = (sendVia === "email" || sendVia === "both") && clientEmail.trim();

        if (canSendSms || canSendEmail) {
          setIsSendingNotification(true);
          try {
            const { data, error } = await supabase.functions.invoke("send-misc-job-confirmation", {
              body: {
                job_id: result.job.id,
                client_name: clientName.trim(),
                client_phone: clientPhone.trim() || undefined,
                client_email: clientEmail.trim() || undefined,
                send_via: sendVia,
              },
            });

            if (error) {
              console.error("Failed to send client notification:", error);
              toastMessages.push("Client notification failed");
            } else if (data?.success) {
              const notifyMethod = sendVia === "both" ? "SMS & email" : sendVia.toUpperCase();
              toastMessages.push(`Client notified via ${notifyMethod}`);
            }
          } catch (err) {
            console.error("Error sending client notification:", err);
            toastMessages.push("Client notification failed");
          }
          setIsSendingNotification(false);
        }
      }

      // Show combined toast
      if (toastMessages.length > 0) {
        toast.success(`Misc job added - ${toastMessages.join(", ")}`);
      } else {
        toast.success("Misc job added");
      }
      
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-pours"] });
      queryClient.invalidateQueries({ queryKey: ["business-subbies"] });
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    setName("");
    setAddress("");
    setDate(undefined);
    setNotes("");
    setSelectedSubbies([]);
    setShowAddNew(false);
    setNewSubbieName("");
    setNewSubbiePhone("");
    setNewSubbieRole("");
    setNotifyClient(false);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setSendVia("sms");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("Name and address are required");
      return;
    }

    // Validate notify client fields if enabled
    if (notifyClient) {
      if (!clientName.trim()) {
        toast.error("Client name is required for notification");
        return;
      }
      if (sendVia === "sms" && !clientPhone.trim()) {
        toast.error("Client phone is required for SMS notification");
        return;
      }
      if (sendVia === "email" && !clientEmail.trim()) {
        toast.error("Client email is required for email notification");
        return;
      }
      if (sendVia === "both" && (!clientPhone.trim() || !clientEmail.trim())) {
        toast.error("Both phone and email are required");
        return;
      }
    }

    createMutation.mutate();
  };

  const handleSelectSubbie = (subbie: PastSubbie) => {
    const exists = selectedSubbies.some(
      (s) => s.recipient_name === subbie.recipient_name && s.role === subbie.role
    );
    if (!exists) {
      setSelectedSubbies([...selectedSubbies, {
        recipient_name: subbie.recipient_name,
        recipient_phone: subbie.recipient_phone,
        recipient_email: subbie.recipient_email,
        role: subbie.role,
      }]);
    }
  };

  const handleRemoveSubbie = (index: number) => {
    setSelectedSubbies(selectedSubbies.filter((_, i) => i !== index));
  };

  const handleAddNewSubbie = () => {
    if (!newSubbieName.trim() || !newSubbieRole.trim()) {
      toast.error("Name and role are required");
      return;
    }
    setSelectedSubbies([...selectedSubbies, {
      recipient_name: newSubbieName,
      recipient_phone: newSubbiePhone || null,
      recipient_email: null,
      role: newSubbieRole,
      isNew: true,
    }]);
    setNewSubbieName("");
    setNewSubbiePhone("");
    setNewSubbieRole("");
    setShowAddNew(false);
  };

  const isSubmitting = createMutation.isPending || isSendingInvites || isSendingNotification;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Quick Add - Misc Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Subbie work at Acme Concrete"
                  className="touch-target"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 123 Other St, Sydney"
                  className="touch-target"
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal touch-target",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., 2 blokes booked for the day"
                  rows={2}
                />
              </div>

              {/* Notify Client Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notify Client
                  </Label>
                  <Switch
                    checked={notifyClient}
                    onCheckedChange={setNotifyClient}
                  />
                </div>

                {notifyClient && (
                  <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                    <Input
                      placeholder="Client name *"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-9"
                    />
                    
                    <RadioGroup
                      value={sendVia}
                      onValueChange={(v) => setSendVia(v as "sms" | "email" | "both")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sms" id="sms" />
                        <Label htmlFor="sms" className="flex items-center gap-1 text-sm cursor-pointer">
                          <MessageSquare className="h-3 w-3" />
                          SMS
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="flex items-center gap-1 text-sm cursor-pointer">
                          <Mail className="h-3 w-3" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both" className="text-sm cursor-pointer">Both</Label>
                      </div>
                    </RadioGroup>

                    {(sendVia === "sms" || sendVia === "both") && (
                      <Input
                        placeholder="Phone number *"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="h-9"
                        type="tel"
                      />
                    )}

                    {(sendVia === "email" || sendVia === "both") && (
                      <Input
                        placeholder="Email address *"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="h-9"
                        type="email"
                      />
                    )}

                    <p className="text-xs text-muted-foreground">
                      Client will receive a confirmation with the job address and date.
                    </p>
                  </div>
                )}
              </div>

              {/* Subbie Allocation Section */}
              <div className="space-y-2 border-t pt-4">
                <Label className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Allocate Sub-Contractors
                </Label>
                
                {/* Selected Subbies */}
                {selectedSubbies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSubbies.map((subbie, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="flex items-center gap-1 py-1"
                      >
                        <span>{subbie.recipient_name}</span>
                        <span className="text-xs text-muted-foreground">({subbie.role})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubbie(index)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Search Past Subbies */}
                {!showAddNew && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-muted-foreground font-normal"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search past sub-contractors...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search past sub-contractors..." />
                        <CommandList className="max-h-48">
                          <CommandEmpty>
                            <span className="text-muted-foreground text-sm">No sub-contractors found</span>
                          </CommandEmpty>
                          <CommandGroup>
                            {pastSubbies.map((subbie, index) => {
                              const isSelected = selectedSubbies.some(
                                (s) => s.recipient_name === subbie.recipient_name && s.role === subbie.role
                              );
                              return (
                                <CommandItem
                                  key={index}
                                  onSelect={() => handleSelectSubbie(subbie)}
                                  disabled={isSelected}
                                  className={cn(isSelected && "opacity-50")}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{subbie.recipient_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {subbie.role} {subbie.recipient_phone && `• ${subbie.recipient_phone}`}
                                    </span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Add New Subbie Form */}
                {showAddNew ? (
                  <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">New Sub-Contractor</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddNew(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Name *"
                      value={newSubbieName}
                      onChange={(e) => setNewSubbieName(e.target.value)}
                      className="h-9"
                    />
                    <Input
                      placeholder="Phone"
                      value={newSubbiePhone}
                      onChange={(e) => setNewSubbiePhone(e.target.value)}
                      className="h-9"
                    />
                    <Input
                      placeholder="Role (e.g., Pump Operator) *"
                      value={newSubbieRole}
                      onChange={(e) => setNewSubbieRole(e.target.value)}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNewSubbie}
                      className="w-full"
                    >
                      Add Sub-Contractor
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddNew(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Sub-Contractor
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 touch-target"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 touch-target"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isSendingNotification ? "Notifying..." : isSendingInvites ? "Sending Invites..." : "Add Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
