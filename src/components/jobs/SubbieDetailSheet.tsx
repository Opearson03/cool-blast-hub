import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Calendar, Plus, Send } from "lucide-react";
import { format } from "date-fns";
import { SubTradeStatusBadge } from "./SubTradeStatusBadge";
import { useSendSubTradeInvite, type SubTradeInvite } from "@/hooks/useSubTradeInvites";
import { toast } from "sonner";

interface SubbieDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  subbie: {
    recipient_name: string;
    recipient_phone: string | null;
    recipient_email: string | null;
    role: string;
  } | null;
}

interface Pour {
  id: string;
  pour_name: string;
  pour_date: string | null;
  scheduled_time: string | null;
  status: string | null;
}

export function SubbieDetailSheet({ open, onOpenChange, jobId, subbie }: SubbieDetailSheetProps) {
  const [selectedPours, setSelectedPours] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const sendInvite = useSendSubTradeInvite();

  // Fetch all pours for this job
  const { data: pours = [] } = useQuery({
    queryKey: ["job-pours", jobId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select("id, pour_name, pour_date, scheduled_time, status")
        .eq("job_id", jobId)
        .order("pour_date", { ascending: true });
      if (error) throw error;
      return data as Pour[];
    },
  });

  // Fetch all invites for this subbie on this job
  const { data: subbieInvites = [], refetch: refetchInvites } = useQuery({
    queryKey: ["subbie-invites", jobId, subbie?.recipient_name, subbie?.role],
    enabled: open && !!subbie,
    queryFn: async () => {
      if (!subbie) return [];
      const { data, error } = await supabase
        .from("external_invites")
        .select("*")
        .eq("job_id", jobId)
        .eq("invite_type", "sub_trade")
        .ilike("recipient_name", subbie.recipient_name)
        .ilike("role", subbie.role)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SubTradeInvite[];
    },
  });

  // Get pour IDs this subbie is already invited to
  const invitedPourIds = new Set(subbieInvites.map((inv) => inv.job_pour_id));

  // Pours they're on vs not on
  const poursOn = pours.filter((p) => invitedPourIds.has(p.id));
  const poursNotOn = pours.filter((p) => !invitedPourIds.has(p.id));

  const togglePour = (pourId: string) => {
    setSelectedPours((prev) =>
      prev.includes(pourId) ? prev.filter((id) => id !== pourId) : [...prev, pourId]
    );
  };

  const selectAll = () => {
    setSelectedPours(poursNotOn.map((p) => p.id));
  };

  const clearSelection = () => {
    setSelectedPours([]);
  };

  const handleBulkInvite = async () => {
    if (!subbie || selectedPours.length === 0) return;

    setIsSending(true);
    try {
      await Promise.all(
        selectedPours.map((pourId) =>
          sendInvite.mutateAsync({
            job_pour_id: pourId,
            recipient_name: subbie.recipient_name,
            role: subbie.role,
            recipient_phone: subbie.recipient_phone || undefined,
            recipient_email: subbie.recipient_email || undefined,
          })
        )
      );
      toast.success(`Invited ${subbie.recipient_name} to ${selectedPours.length} pour(s)`);
      setSelectedPours([]);
      refetchInvites();
    } catch (error) {
      toast.error("Failed to send invites");
    } finally {
      setIsSending(false);
    }
  };

  if (!subbie) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{subbie.recipient_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Contact Details */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{subbie.role}</Badge>
              </div>
              {subbie.recipient_phone && (
                <a
                  href={`tel:${subbie.recipient_phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Phone className="h-4 w-4" />
                  {subbie.recipient_phone}
                </a>
              )}
              {subbie.recipient_email && (
                <a
                  href={`mailto:${subbie.recipient_email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                  {subbie.recipient_email}
                </a>
              )}
            </CardContent>
          </Card>

          {/* Pours They're On */}
          <div>
            <h3 className="text-sm font-medium mb-2">Invited Pours ({poursOn.length})</h3>
            {poursOn.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pours yet</p>
            ) : (
              <div className="space-y-2">
                {poursOn.map((pour) => {
                  const invite = subbieInvites.find((inv) => inv.job_pour_id === pour.id);
                  return (
                    <Card key={pour.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{pour.pour_name}</div>
                          {pour.pour_date && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(pour.pour_date), "EEE, d MMM")}
                              {pour.scheduled_time && ` @ ${pour.scheduled_time.slice(0, 5)}`}
                            </div>
                          )}
                        </div>
                        {invite && <SubTradeStatusBadge status={invite.status as any} />}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Invite to More Pours */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Invite to More Pours</h3>
              {poursNotOn.length > 0 && (
                <div className="flex gap-2">
                  {selectedPours.length < poursNotOn.length ? (
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      Select all
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>

            {poursNotOn.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Already invited to all pours on this job
              </p>
            ) : (
              <div className="space-y-2">
                {poursNotOn.map((pour) => (
                  <Card
                    key={pour.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPours.includes(pour.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => togglePour(pour.id)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Checkbox
                        checked={selectedPours.includes(pour.id)}
                        onCheckedChange={() => togglePour(pour.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{pour.pour_name}</div>
                        {pour.pour_date && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(pour.pour_date), "EEE, d MMM")}
                            {pour.scheduled_time && ` @ ${pour.scheduled_time.slice(0, 5)}`}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedPours.length > 0 && (
              <Button
                className="w-full mt-4"
                onClick={handleBulkInvite}
                disabled={isSending}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending
                  ? "Sending..."
                  : `Invite to ${selectedPours.length} Pour${selectedPours.length > 1 ? "s" : ""}`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
