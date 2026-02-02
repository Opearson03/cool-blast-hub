import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, MapPin, User, Send, CalendarClock, Phone, Loader2 } from "lucide-react";
import { useResendSubTradeNotification } from "@/hooks/useSubTradeInvites";
import { toast } from "sonner";
import { ScheduleSubbieDialog } from "@/components/schedule/ScheduleSubbieDialog";

interface PendingInvite {
  id: string;
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email?: string | null;
  role: string;
  status: string;
  sent_at: string | null;
  pour_date: string;
  pour_name: string;
  job_name: string;
  job_id: string;
  job_pour_id?: string;
}

interface PendingInviteActionSheetProps {
  invite: PendingInvite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
}

export function PendingInviteActionSheet({
  invite,
  open,
  onOpenChange,
  onActionComplete,
}: PendingInviteActionSheetProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const resendMutation = useResendSubTradeNotification();

  if (!invite) return null;

  const handleResend = () => {
    resendMutation.mutate(
      { inviteId: invite.id, jobPourId: invite.job_pour_id || "" },
      {
        onSuccess: () => {
          toast.success("Invite sent successfully");
          onOpenChange(false);
          onActionComplete?.();
        },
        onError: () => {
          toast.error("Failed to send invite");
        },
      }
    );
  };

  const handleCall = () => {
    if (invite.recipient_phone) {
      window.location.href = `tel:${invite.recipient_phone}`;
    }
  };

  const statusLabels: Record<string, string> = {
    sent: "Sent",
    viewed: "Viewed",
    drafted: "Draft",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>{invite.recipient_name}</DialogTitle>
            </div>
            <DialogDescription className="flex items-center gap-2 pt-1">
              <Badge variant="outline">{invite.role}</Badge>
              <Badge variant="secondary">{statusLabels[invite.status] || invite.status}</Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Job Details */}
            <div className="space-y-2 p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{invite.job_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{invite.pour_name} • {format(new Date(invite.pour_date), "EEEE, d MMMM yyyy")}</span>
              </div>
              {invite.sent_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Send className="h-3 w-3" />
                  <span>Sent {format(new Date(invite.sent_at), "d MMM 'at' h:mm a")}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid gap-2">
              {invite.recipient_phone && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleCall}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call {invite.recipient_name}
                </Button>
              )}
              
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={handleResend}
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {invite.status === "drafted" ? "Send Invite" : "Resend Invite"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onOpenChange(false);
                  setRescheduleOpen(true);
                }}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Reschedule to Different Pour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScheduleSubbieDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        preselectedSubbie={{
          recipient_name: invite.recipient_name,
          recipient_phone: invite.recipient_phone,
          recipient_email: invite.recipient_email || null,
          role: invite.role,
          lastUsed: new Date().toISOString(),
        }}
      />
    </>
  );
}
