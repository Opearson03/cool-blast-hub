import { useState } from "react";
import { useSubTradeInvites, useRevokeSubTradeInvite, useResendSubTradeNotification, useSendSubTradeInvite, SubTradeInvite } from "@/hooks/useSubTradeInvites";
import { SubTradeStatusBadge } from "./SubTradeStatusBadge";
import { SubTradeInviteDialog } from "./SubTradeInviteDialog";
import { DeliveryStatusIndicator } from "./DeliveryStatusIndicator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Plus, UserPlus, X, Clock, AlertTriangle, Send, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface SubTradesListProps {
  jobId: string;
  pourId: string;
  pourName: string;
  pourDate: string | null;
  expanded?: boolean;
}

export function SubTradesList({ jobId, pourId, pourName, pourDate, expanded = false }: SubTradesListProps) {
  const [isOpen, setIsOpen] = useState(expanded);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [revokeInvite, setRevokeInvite] = useState<SubTradeInvite | null>(null);

  const { data: invites = [], isLoading } = useSubTradeInvites(pourId);
  const revokeMutation = useRevokeSubTradeInvite();
  const resendMutation = useResendSubTradeNotification();

  const confirmedCount = invites.filter((i) => i.status === "accepted").length;
  const pendingCount = invites.filter((i) => ["sent", "viewed"].includes(i.status)).length;
  const totalActive = invites.filter((i) => !["revoked", "expired", "declined"].includes(i.status)).length;
  const deliveryIssues = invites.filter(
    (i) => i.sms_delivery_status === "failed" || i.email_delivery_status === "failed"
  ).length;

  // Check if an invite has delivery issues and can be resent
  const hasDeliveryIssues = (invite: SubTradeInvite) => {
    return (
      invite.sms_delivery_status === "failed" ||
      invite.sms_delivery_status === "rate_limited" ||
      invite.email_delivery_status === "failed"
    );
  };

  const handleRevoke = () => {
    if (!revokeInvite) return;
    revokeMutation.mutate(
      { inviteId: revokeInvite.id, jobPourId: pourId },
      {
        onSuccess: () => {
          toast.success("Invite cancelled");
          setRevokeInvite(null);
        },
        onError: () => {
          toast.error("Failed to cancel invite");
        },
      }
    );
  };

  const handleSendInvite = (invite: SubTradeInvite) => {
    resendMutation.mutate(
      { inviteId: invite.id, jobPourId: pourId },
      {
        onSuccess: (data) => {
          // Show appropriate toast based on delivery results
          const result = data.result;
          if (result) {
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
              toast.warning("Email sent, but SMS delivery failed");
            } else if (smsOk && emailFailed) {
              toast.warning("SMS sent, but email delivery failed");
            } else if (smsFailed && emailFailed) {
              toast.error("Both SMS and email delivery failed");
            } else if (smsFailed) {
              toast.error("SMS delivery failed");
            } else if (emailFailed) {
              toast.error("Email delivery failed");
            } else {
              toast.success("Invite sent successfully");
            }
          } else {
            toast.success("Invite sent successfully");
          }
        },
        onError: () => {
          toast.error("Failed to send invite");
        },
      }
    );
  };

  const handleResendInvite = (invite: SubTradeInvite) => {
    resendMutation.mutate(
      { inviteId: invite.id, jobPourId: pourId },
      {
        onSuccess: (data) => {
          const result = data.result;
          if (result) {
            const smsOk = result.sms_status === "sent";
            const emailOk = result.email_status === "sent";
            const smsFailed = result.sms_status === "failed";
            const emailFailed = result.email_status === "failed";

            if (smsOk || emailOk) {
              const channels = [smsOk && "SMS", emailOk && "email"].filter(Boolean).join(" and ");
              toast.success(`Invite resent via ${channels}`);
            } else if (smsFailed || emailFailed) {
              const failedChannels = [smsFailed && "SMS", emailFailed && "email"].filter(Boolean).join(" and ");
              toast.error(`Resend failed: ${failedChannels} delivery failed`);
            } else {
              toast.success("Invite resent successfully");
            }
          } else {
            toast.success("Invite resent successfully");
          }
        },
        onError: () => {
          toast.error("Failed to resend invite");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground py-2">Loading sub-contractors...</div>
    );
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="border-t pt-2 mt-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-2 h-8 text-sm font-normal"
            >
              <span className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sub-Contractors</span>
                {totalActive > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {confirmedCount}/{totalActive} confirmed
                  </Badge>
                )}
                {deliveryIssues > 0 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 text-yellow-600 border-yellow-500/30">
                    <AlertTriangle className="h-3 w-3 mr-0.5" />
                    {deliveryIssues}
                  </Badge>
                )}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-2 space-y-2">
            {invites.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2">
                No sub-contractors invited yet
              </p>
            ) : (
              <div className="space-y-1">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className={cn(
                      "flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-muted/50",
                      invite.status === "revoked" && "opacity-50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {invite.recipient_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {invite.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {/* Show delivery status indicators */}
                        <DeliveryStatusIndicator
                          smsStatus={invite.sms_delivery_status}
                          emailStatus={invite.email_delivery_status}
                          smsError={invite.sms_error_message}
                          emailError={invite.email_error_message}
                        />
                        {invite.sent_at && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {format(new Date(invite.sent_at), "d MMM")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <SubTradeStatusBadge status={invite.status} className="text-xs" />
                      {/* Resend button for failed deliveries */}
                      {["sent", "viewed"].includes(invite.status) && hasDeliveryIssues(invite) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs border-yellow-500/50 text-yellow-600 hover:bg-yellow-50"
                          onClick={() => handleResendInvite(invite)}
                          disabled={resendMutation.isPending}
                        >
                          <RotateCw className="h-3 w-3 mr-1" />
                          Resend
                        </Button>
                      )}
                      {/* Send button for drafted invites */}
                      {invite.status === "drafted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleSendInvite(invite)}
                          disabled={resendMutation.isPending}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </Button>
                      )}
                      {/* Cancel button for pending invites */}
                      {["sent", "viewed"].includes(invite.status) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setRevokeInvite(invite)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => setInviteDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Invite Sub-Contractor
            </Button>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <SubTradeInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        jobId={jobId}
        pourId={pourId}
        pourName={pourName}
        pourDate={pourDate}
      />

      <AlertDialog open={!!revokeInvite} onOpenChange={() => setRevokeInvite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invite?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the invite link for {revokeInvite?.recipient_name}. They will no
              longer be able to accept or decline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invite</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
