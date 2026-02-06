import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContentWithoutPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", 
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

interface QuickSiteVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

export function QuickSiteVisitDialog({
  open,
  onOpenChange,
  defaultDate,
}: QuickSiteVisitDialogProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [visitDate, setVisitDate] = useState<Date | undefined>(defaultDate || new Date());
  const [visitTime, setVisitTime] = useState("09:00");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notifyClient, setNotifyClient] = useState(false);
  const [notifyMethod, setNotifyMethod] = useState<"email" | "sms" | "both">("email");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSiteVisit = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) throw new Error("No business found");

      // Get business details for the notification
      const { data: business } = await supabase
        .from("businesses")
        .select("name, phone, email, inbound_email_alias")
        .eq("id", profile.business_id)
        .single();

      const formattedDate = visitDate ? format(visitDate, "yyyy-MM-dd") : null;

      const { data: estimate, error } = await supabase
        .from("estimates")
        .insert({
          business_id: profile.business_id,
          client_name: clientName.trim() || "Site Visit",
          client_email: clientEmail.trim() || null,
          client_phone: clientPhone.trim() || null,
          site_address: siteAddress.trim() || "TBC",
          site_visit_date: formattedDate,
          status: "draft",
          estimate_type: "driveway",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification if enabled and we have contact info
      if (notifyClient && formattedDate && business) {
        const canEmail = (notifyMethod === "email" || notifyMethod === "both") && clientEmail.trim();
        const canSms = (notifyMethod === "sms" || notifyMethod === "both") && clientPhone.trim();

        if (canEmail || canSms) {
          try {
            await supabase.functions.invoke("send-site-visit-email", {
              body: {
                clientName: clientName.trim() || "Site Visit",
                clientEmail: clientEmail.trim() || null,
                clientPhone: clientPhone.trim() || null,
                siteAddress: siteAddress.trim() || "TBC",
                siteVisitDate: formattedDate,
                siteVisitTime: visitTime,
                businessName: business.name,
                businessPhone: business.phone,
                businessEmail: business.email,
                businessEmailAlias: business.inbound_email_alias || null,
                notifyMethod,
              },
            });
          } catch (emailError) {
            console.error("Failed to send site visit notification:", emailError);
          }
        }
      }

      return { estimate, notified: notifyClient };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["schedule-estimates"] });
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      
      let message = "Site visit scheduled";
      if (result.notified) {
        const methodLabel = notifyMethod === "both" ? "SMS & email" : notifyMethod === "sms" ? "SMS" : "email";
        message += ` - ${methodLabel} sent`;
      }
      toast({ title: message });
      
      onOpenChange(false);
      // Reset form
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setSiteAddress("");
      setVisitDate(new Date());
      setVisitTime("09:00");
      setNotifyClient(false);
      setNotifyMethod("email");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSiteVisit.mutate();
  };

  const canNotify = clientEmail.trim() || clientPhone.trim();
  const showEmailOption = clientEmail.trim();
  const showSmsOption = clientPhone.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Site Visit</DialogTitle>
          <DialogDescription>
            Quickly schedule a site visit. This creates a draft estimate you can complete later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              placeholder="e.g. John Smith"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="john@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Phone</Label>
              <Input
                id="clientPhone"
                type="tel"
                placeholder="+61 400 000 000"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteAddress">Site Address</Label>
            <Input
              id="siteAddress"
              placeholder="e.g. 123 Main St, Sydney"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Visit Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !visitDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {visitDate ? format(visitDate, "dd MMM") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContentWithoutPortal className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={visitDate}
                    onSelect={(date) => {
                      setVisitDate(date);
                      setCalendarOpen(false);
                    }}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContentWithoutPortal>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={visitTime} onValueChange={setVisitTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notify Client Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-client">Notify Client</Label>
                <p className="text-xs text-muted-foreground">
                  Send confirmation to client
                </p>
              </div>
              <Switch
                id="notify-client"
                checked={notifyClient}
                onCheckedChange={setNotifyClient}
                disabled={!canNotify}
              />
            </div>

            {notifyClient && canNotify && (
              <RadioGroup
                value={notifyMethod}
                onValueChange={(v) => setNotifyMethod(v as "email" | "sms" | "both")}
                className="flex gap-4"
              >
                {showSmsOption && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms" className="flex items-center gap-1 text-sm cursor-pointer">
                      <MessageSquare className="h-3.5 w-3.5" />
                      SMS
                    </Label>
                  </div>
                )}
                {showEmailOption && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center gap-1 text-sm cursor-pointer">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </Label>
                  </div>
                )}
                {showEmailOption && showSmsOption && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="text-sm cursor-pointer">Both</Label>
                  </div>
                )}
              </RadioGroup>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSiteVisit.isPending}>
              {createSiteVisit.isPending ? "Scheduling..." : "Schedule Visit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
