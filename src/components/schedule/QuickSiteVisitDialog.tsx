import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
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
import { CalendarIcon } from "lucide-react";
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
  const [siteAddress, setSiteAddress] = useState("");
  const [visitDate, setVisitDate] = useState<Date | undefined>(defaultDate || new Date());
  const [visitTime, setVisitTime] = useState("09:00");
  const [calendarOpen, setCalendarOpen] = useState(false);
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

      // Get business details for the email
      const { data: business } = await supabase
        .from("businesses")
        .select("name, phone, email")
        .eq("id", profile.business_id)
        .single();

      const formattedDate = visitDate ? format(visitDate, "yyyy-MM-dd") : null;

      const { data: estimate, error } = await supabase
        .from("estimates")
        .insert({
          business_id: profile.business_id,
          client_name: clientName.trim() || "Site Visit",
          client_email: clientEmail.trim() || null,
          site_address: siteAddress.trim() || "TBC",
          site_visit_date: formattedDate,
          status: "draft",
          estimate_type: "driveway",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email if client email provided
      if (clientEmail.trim() && formattedDate && business) {
        try {
          await supabase.functions.invoke("send-site-visit-email", {
            body: {
              clientName: clientName.trim() || "Site Visit",
              clientEmail: clientEmail.trim(),
              siteAddress: siteAddress.trim() || "TBC",
              siteVisitDate: formattedDate,
              siteVisitTime: visitTime,
              businessName: business.name,
              businessPhone: business.phone,
              businessEmail: business.email,
            },
          });
        } catch (emailError) {
          console.error("Failed to send site visit email:", emailError);
        }
      }

      return estimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-estimates"] });
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      const emailSent = clientEmail.trim() ? " - confirmation email sent" : "";
      toast({ title: `Site visit scheduled${emailSent}` });
      onOpenChange(false);
      // Reset form
      setClientName("");
      setClientEmail("");
      setSiteAddress("");
      setVisitDate(new Date());
      setVisitTime("09:00");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSiteVisit.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email</Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="e.g. john@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If provided, a confirmation email will be sent
            </p>
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
