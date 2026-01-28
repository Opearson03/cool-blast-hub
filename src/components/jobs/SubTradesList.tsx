import { useState } from "react";
import { useSubTradeInvites, useRevokeSubTradeInvite, SubTradeInvite } from "@/hooks/useSubTradeInvites";
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
import { ChevronDown, Plus, UserPlus, X, Clock, AlertTriangle } from "lucide-react";
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

  const confirmedCount = invites.filter((i) => i.status === "accepted").length;
  const pendingCount = invites.filter((i) => ["sent", "viewed"].includes(i.status)).length;
  const totalActive = invites.filter((i) => !["revoked", "expired", "declined"].includes(i.status)).length;
  const deliveryIssues = invites.filter(
    (i) => i.sms_delivery_status === "failed" || i.email_delivery_status === "failed"
  ).length;

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

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground py-2">Loading sub-trades...</div>
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
                <span>Sub-Trades</span>
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
                No sub-trades invited yet
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
              Invite Sub-Trade
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
